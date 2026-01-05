package main

import (
	"log"
	"os"
	"safebase-backend/internal/api"
	"safebase-backend/internal/database"
	"safebase-backend/internal/scheduler"
)

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./safebase.db"
	}

	backupDir := os.Getenv("BACKUP_DIR")
	if backupDir == "" {
		backupDir = "./backups"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	err := database.InitDB(dbPath)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	sched := scheduler.NewScheduler(backupDir)
	sched.Start()
	defer sched.Stop()

	handler := api.NewHandler(sched)
	router := api.SetupRoutes(handler)

	log.Printf("Server starting on port %s", port)
	log.Printf("Backup directory: %s", backupDir)
	log.Printf("Database path: %s", dbPath)
	
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}