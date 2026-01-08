package api

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(handler *Handler) *gin.Engine {
	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// Health check endpoint (no authentication)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"service": "safebase-backend",
		})
	})

	api := r.Group("/api")
	{
		// Public routes (no authentication required)
		auth := api.Group("/auth")
		{
			auth.POST("/register", handler.Register)
			auth.POST("/login", handler.Login)
		}

		// Protected routes (authentication required)
		protected := api.Group("")
		protected.Use(AuthMiddleware())
		{
			protected.GET("/auth/me", handler.GetCurrentUser)
			protected.PUT("/auth/profile", handler.UpdateProfile)
			protected.PUT("/auth/password", handler.ChangePassword)

			protected.GET("/databases", handler.GetDatabases)
			protected.GET("/databases/:id", handler.GetDatabase)
			protected.POST("/databases", handler.CreateDatabase)
			protected.PUT("/databases/:id", handler.UpdateDatabase)
			protected.DELETE("/databases/:id", handler.DeleteDatabase)

			protected.GET("/schedules", handler.GetSchedules)
			protected.GET("/schedules/:id", handler.GetSchedule)
			protected.POST("/schedules", handler.CreateSchedule)
			protected.PUT("/schedules/:id", handler.UpdateSchedule)
			protected.DELETE("/schedules/:id", handler.DeleteSchedule)
			protected.POST("/schedules/:id/execute", handler.ExecuteSchedule)

		protected.GET("/backups", handler.GetBackups)
		protected.GET("/backups/:id", handler.GetBackup)
		protected.POST("/backups/manual", handler.CreateManualBackup)

		protected.GET("/alerts", handler.GetAlerts)
		protected.PUT("/alerts/:id/read", handler.MarkAlertAsRead)
		protected.POST("/alerts/mark-all-read", handler.MarkAllAlertsAsRead)
		protected.GET("/alerts/unread-count", handler.GetUnreadCount)
	}
}

	return r
}

