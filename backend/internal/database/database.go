package database

import (
	"safebase-backend/internal/models"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB(path string) error {
	var err error
	DB, err = gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		return err
	}

	err = DB.AutoMigrate(&models.User{}, &models.Database{}, &models.BackupSchedule{}, &models.Backup{})
	if err != nil {
		return err
	}

	return nil
}

func GetEnabledSchedules() ([]models.BackupSchedule, error) {
	var schedules []models.BackupSchedule
	now := time.Now()
	err := DB.Where("enabled = ? AND (next_run IS NULL OR next_run <= ?)", true, now).Find(&schedules).Error
	return schedules, err
}

func GetSchedule(scheduleID string) (*models.BackupSchedule, error) {
	var schedule models.BackupSchedule
	err := DB.First(&schedule, "id = ?", scheduleID).Error
	return &schedule, err
}

func UpdateScheduleNextRun(scheduleID string, nextRun time.Time) error {
	return DB.Model(&models.BackupSchedule{}).Where("id = ?", scheduleID).Update("next_run", nextRun).Error
}

func UpdateScheduleLastRun(scheduleID string, lastRun time.Time) error {
	return DB.Model(&models.BackupSchedule{}).Where("id = ?", scheduleID).Update("last_run", lastRun).Error
}

