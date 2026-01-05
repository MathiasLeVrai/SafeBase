package api

import (
	"log"
	"net/http"
	"safebase-backend/internal/database"
	"safebase-backend/internal/models"
	"safebase-backend/internal/scheduler"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	scheduler *scheduler.Scheduler
}

func NewHandler(s *scheduler.Scheduler) *Handler {
	return &Handler{scheduler: s}
}

func (h *Handler) GetDatabases(c *gin.Context) {
	var databases []models.Database
	database.DB.Find(&databases)
	c.JSON(http.StatusOK, databases)
}

func (h *Handler) GetDatabase(c *gin.Context) {
	id := c.Param("id")
	var db models.Database
	if err := database.DB.First(&db, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database not found"})
		return
	}
	c.JSON(http.StatusOK, db)
}

func (h *Handler) CreateDatabase(c *gin.Context) {
	var db models.Database
	if err := c.ShouldBindJSON(&db); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db.ID = uuid.New().String()
	db.Status = "connected"
	db.CreatedAt = time.Now()
	db.UpdatedAt = time.Now()

	if err := database.DB.Create(&db).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, db)
}

func (h *Handler) UpdateDatabase(c *gin.Context) {
	id := c.Param("id")
	var db models.Database
	if err := database.DB.First(&db, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database not found"})
		return
	}

	if err := c.ShouldBindJSON(&db); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db.UpdatedAt = time.Now()
	database.DB.Save(&db)
	c.JSON(http.StatusOK, db)
}

func (h *Handler) DeleteDatabase(c *gin.Context) {
	id := c.Param("id")
	database.DB.Delete(&models.Database{}, "id = ?", id)
	c.Status(http.StatusNoContent)
}

func (h *Handler) GetSchedules(c *gin.Context) {
	var schedules []models.BackupSchedule
	database.DB.Find(&schedules)
	c.JSON(http.StatusOK, schedules)
}

func (h *Handler) GetSchedule(c *gin.Context) {
	id := c.Param("id")
	var schedule models.BackupSchedule
	if err := database.DB.First(&schedule, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Schedule not found"})
		return
	}
	c.JSON(http.StatusOK, schedule)
}

func (h *Handler) CreateSchedule(c *gin.Context) {
	var schedule models.BackupSchedule
	if err := c.ShouldBindJSON(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var db models.Database
	if err := database.DB.First(&db, "id = ?", schedule.DatabaseID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Database not found"})
		return
	}

	schedule.ID = uuid.New().String()
	schedule.DatabaseName = db.Name
	schedule.CreatedAt = time.Now()
	schedule.UpdatedAt = time.Now()

	if err := database.DB.Create(&schedule).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.scheduler.AddSchedule(schedule)
	c.JSON(http.StatusCreated, schedule)
}

func (h *Handler) UpdateSchedule(c *gin.Context) {
	id := c.Param("id")
	var schedule models.BackupSchedule
	if err := database.DB.First(&schedule, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Schedule not found"})
		return
	}

	if err := c.ShouldBindJSON(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	schedule.UpdatedAt = time.Now()
	database.DB.Save(&schedule)
	h.scheduler.UpdateSchedule(schedule)
	c.JSON(http.StatusOK, schedule)
}

func (h *Handler) DeleteSchedule(c *gin.Context) {
	id := c.Param("id")
	var schedule models.BackupSchedule
	database.DB.First(&schedule, "id = ?", id)
	database.DB.Delete(&schedule)
	h.scheduler.RemoveSchedule(id)
	c.Status(http.StatusNoContent)
}

func (h *Handler) GetBackups(c *gin.Context) {
	var backups []models.Backup
	query := database.DB

	if databaseID := c.Query("databaseId"); databaseID != "" {
		query = query.Where("database_id = ?", databaseID)
	}

	query.Order("created_at DESC").Limit(100).Find(&backups)
	c.JSON(http.StatusOK, backups)
}

func (h *Handler) GetBackup(c *gin.Context) {
	id := c.Param("id")
	var backup models.Backup
	if err := database.DB.First(&backup, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Backup not found"})
		return
	}
	c.JSON(http.StatusOK, backup)
}

func (h *Handler) CreateManualBackup(c *gin.Context) {
	var req struct {
		DatabaseID string `json:"databaseId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var db models.Database
	if err := database.DB.First(&db, "id = ?", req.DatabaseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database not found"})
		return
	}

	backup, err := h.scheduler.BackupExec.ExecuteBackup(db, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	backup.Type = "manual"
	database.DB.Create(&backup)

	now := time.Now()
	db.LastBackup = &now
	db.BackupCount++
	database.DB.Save(&db)

	c.JSON(http.StatusCreated, backup)
}

func (h *Handler) ExecuteSchedule(c *gin.Context) {
	defer func() {
		if r := recover(); r != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
	}()

	id := c.Param("id")
	var schedule models.BackupSchedule
	if err := database.DB.First(&schedule, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Schedule not found"})
		return
	}

	var db models.Database
	if err := database.DB.First(&db, "id = ?", schedule.DatabaseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database not found"})
		return
	}

	backup, err := h.scheduler.BackupExec.ExecuteBackup(db, schedule.ID)
	
	if err != nil {
		backup.Type = "scheduled"
		database.DB.Create(&backup)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "backup": backup})
		return
	}

	if err := database.DB.Create(&backup).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save backup: " + err.Error()})
		return
	}

	now := time.Now()
	database.UpdateScheduleLastRun(schedule.ID, now)
	
	func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Panic in CalculateAndUpdateNextRun: %v", r)
			}
		}()
		h.scheduler.CalculateAndUpdateNextRun(schedule)
	}()

	db.LastBackup = &now
	db.BackupCount++
	database.DB.Save(&db)

	c.JSON(http.StatusCreated, backup)
}

func (h *Handler) GetAlerts(c *gin.Context) {
	var alerts []models.Alert
	database.DB.Order("created_at DESC").Limit(50).Find(&alerts)
	c.JSON(http.StatusOK, alerts)
}

func (h *Handler) MarkAlertAsRead(c *gin.Context) {
	id := c.Param("id")
	var alert models.Alert
	if err := database.DB.First(&alert, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found"})
		return
	}

	alert.Read = true
	database.DB.Save(&alert)
	c.JSON(http.StatusOK, alert)
}

func (h *Handler) MarkAllAlertsAsRead(c *gin.Context) {
	database.DB.Model(&models.Alert{}).Where("read = ?", false).Update("read", true)
	c.JSON(http.StatusOK, gin.H{"message": "All alerts marked as read"})
}

func (h *Handler) GetUnreadCount(c *gin.Context) {
	var count int64
	database.DB.Model(&models.Alert{}).Where("read = ?", false).Count(&count)
	c.JSON(http.StatusOK, gin.H{"count": count})
}

