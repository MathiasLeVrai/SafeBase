package scheduler

import (
	"safebase-backend/internal/backup"
	"safebase-backend/internal/database"
	"safebase-backend/internal/models"
	"time"

	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	cron          *cron.Cron
	BackupExec    *backup.BackupExecutor
	scheduleJobs  map[string]cron.EntryID
}

func NewScheduler(backupDir string) *Scheduler {
	c := cron.New(cron.WithSeconds())
	return &Scheduler{
		cron:         c,
		BackupExec:   backup.NewBackupExecutor(backupDir),
		scheduleJobs: make(map[string]cron.EntryID),
	}
}

func (s *Scheduler) Start() {
	s.cron.Start()
	s.loadAndScheduleAll()
	s.startPeriodicCheck()
}

func (s *Scheduler) Stop() {
	s.cron.Stop()
}

func (s *Scheduler) loadAndScheduleAll() {
	var schedules []models.BackupSchedule
	database.DB.Where("enabled = ?", true).Find(&schedules)

	for _, schedule := range schedules {
		s.AddSchedule(schedule)
	}
}

func (s *Scheduler) startPeriodicCheck() {
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			schedules, err := database.GetEnabledSchedules()
			if err != nil {
				continue
			}

			for _, schedule := range schedules {
				if schedule.NextRun != nil && schedule.NextRun.Before(time.Now()) {
					s.executeBackupNow(schedule)
					s.CalculateAndUpdateNextRun(schedule)
				}
			}
		}
	}()
}

func (s *Scheduler) AddSchedule(schedule models.BackupSchedule) {
	if !schedule.Enabled {
		return
	}

	expr := s.convertCronToStandard(schedule.CronExpression)
	if expr == "" {
		return
	}

	var db models.Database
	if err := database.DB.First(&db, "id = ?", schedule.DatabaseID).Error; err != nil {
		return
	}

	entryID, err := s.cron.AddFunc(expr, func() {
		s.executeBackup(schedule, db)
	})

	if err != nil {
		return
	}

	s.scheduleJobs[schedule.ID] = entryID
	s.CalculateAndUpdateNextRun(schedule)
}

func (s *Scheduler) RemoveSchedule(scheduleID string) {
	if entryID, exists := s.scheduleJobs[scheduleID]; exists {
		s.cron.Remove(entryID)
		delete(s.scheduleJobs, scheduleID)
	}
}

func (s *Scheduler) UpdateSchedule(schedule models.BackupSchedule) {
	s.RemoveSchedule(schedule.ID)
	if schedule.Enabled {
		s.AddSchedule(schedule)
	}
}

func (s *Scheduler) executeBackup(schedule models.BackupSchedule, db models.Database) {
	backup, err := s.BackupExec.ExecuteBackup(db, schedule.ID)
	if err != nil {
		database.DB.Create(&backup)
		return
	}

	database.DB.Create(&backup)

	now := time.Now()
	database.UpdateScheduleLastRun(schedule.ID, now)
	s.CalculateAndUpdateNextRun(schedule)

	var dbModel models.Database
	database.DB.First(&dbModel, "id = ?", db.ID)
	dbModel.LastBackup = &now
	dbModel.BackupCount++
	database.DB.Save(&dbModel)
}

func (s *Scheduler) executeBackupNow(schedule models.BackupSchedule) {
	var db models.Database
	if err := database.DB.First(&db, "id = ?", schedule.DatabaseID).Error; err != nil {
		return
	}

	s.executeBackup(schedule, db)
}

func (s *Scheduler) CalculateAndUpdateNextRun(schedule models.BackupSchedule) {
	expr := s.convertCronToStandard(schedule.CronExpression)
	if expr == "" {
		return
	}

	scheduleParser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)
	sched, err := scheduleParser.Parse(expr)
	if err != nil {
		return
	}

	nextRun := sched.Next(time.Now())
	database.UpdateScheduleNextRun(schedule.ID, nextRun)
}

func (s *Scheduler) convertCronToStandard(expr string) string {
	return expr
}

