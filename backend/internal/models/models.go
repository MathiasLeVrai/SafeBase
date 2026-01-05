package models

import (
	"time"
)

type User struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"unique;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	Name      string    `gorm:"not null" json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Database struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Type        string    `gorm:"not null" json:"type"`
	Host        string    `gorm:"not null" json:"host"`
	Port        int       `gorm:"not null" json:"port"`
	Username    string    `gorm:"not null" json:"username"`
	Password    string    `gorm:"not null" json:"password"`
	Database    string    `gorm:"not null" json:"database"`
	Status      string    `json:"status"`
	LastBackup  *time.Time `json:"lastBackup"`
	BackupCount int       `json:"backupCount"`
	Size        string    `json:"size"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type BackupSchedule struct {
	ID            string     `gorm:"primaryKey" json:"id"`
	DatabaseID    string     `gorm:"not null;index" json:"databaseId"`
	DatabaseName  string     `gorm:"not null" json:"databaseName"`
	CronExpression string    `gorm:"not null" json:"cronExpression"`
	Enabled       bool       `gorm:"default:true" json:"enabled"`
	NextRun       *time.Time `json:"nextRun"`
	LastRun       *time.Time `json:"lastRun"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

type Backup struct {
	ID           string    `gorm:"primaryKey" json:"id"`
	DatabaseID   string    `gorm:"not null;index" json:"databaseId"`
	DatabaseName string    `gorm:"not null" json:"databaseName"`
	Version      string    `json:"version"`
	Size         string    `json:"size"`
	Status       string    `gorm:"not null" json:"status"`
	FilePath     string    `json:"filePath"`
	Type         string    `gorm:"not null" json:"type"`
	Duration     int       `json:"duration"`
	Error        string    `json:"error,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

