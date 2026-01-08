package backup

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"safebase-backend/internal/models"
	"time"

	"github.com/google/uuid"
)

func findCommand(cmd string) string {
	possiblePaths := []string{
		"/opt/homebrew/opt/mysql-client/bin/" + cmd,
		"/usr/local/bin/" + cmd,
		"/usr/bin/" + cmd,
		cmd,
	}

	for _, path := range possiblePaths {
		if _, err := exec.LookPath(path); err == nil {
			return path
		}
	}

	return cmd
}

type BackupExecutor struct {
	BackupDir string
}

func NewBackupExecutor(backupDir string) *BackupExecutor {
	os.MkdirAll(backupDir, 0755)
	return &BackupExecutor{BackupDir: backupDir}
}

func (be *BackupExecutor) ExecuteBackup(db models.Database, scheduleID string) (models.Backup, error) {
	startTime := time.Now()
	backup := models.Backup{
		ID:           uuid.New().String(),
		DatabaseID:   db.ID,
		DatabaseName: db.Name,
		Status:       "in_progress",
		Type:         "scheduled",
		CreatedAt:    time.Now(),
	}

	var filePath string
	var err error

	if db.Type == "mysql" {
		filePath, err = be.backupMySQL(db)
	} else if db.Type == "postgresql" {
		filePath, err = be.backupPostgreSQL(db)
	} else {
		err = fmt.Errorf("unsupported database type: %s", db.Type)
	}

	duration := int(time.Since(startTime).Seconds())

	if err != nil {
		backup.Status = "failed"
		backup.Error = err.Error()
		backup.Duration = duration
		return backup, err
	}

	fileInfo, statErr := os.Stat(filePath)
	if statErr == nil {
		size := fileInfo.Size()
		if size < 1024 {
			backup.Size = fmt.Sprintf("%d B", size)
		} else if size < 1024*1024 {
			backup.Size = fmt.Sprintf("%.2f KB", float64(size)/1024)
		} else {
			backup.Size = fmt.Sprintf("%.2f MB", float64(size)/(1024*1024))
		}
	}

	backup.FilePath = filePath
	backup.Status = "success"
	backup.Duration = duration

	return backup, nil
}

func (be *BackupExecutor) backupMySQL(db models.Database) (string, error) {
	timestamp := time.Now().Format("20060102_150405")
	fileName := fmt.Sprintf("%s_%s.sql", db.Name, timestamp)
	filePath := filepath.Join(be.BackupDir, fileName)

	env := os.Environ()
	env = append(env, fmt.Sprintf("MYSQL_PWD=%s", db.Password))

	mysqldumpPath := findCommand("mysqldump")
	
	host := db.Host
	// In Docker, use service name directly; for localhost, convert to 127.0.0.1
	if host == "localhost" {
		host = "127.0.0.1"
	}
	// Note: In Docker Compose, use service name "mysql" instead of localhost
	
	cmd := exec.Command(mysqldumpPath,
		"-h", host,
		"-P", fmt.Sprintf("%d", db.Port),
		"-u", db.Username,
		"--protocol=TCP",
		"--single-transaction",
		"--quick",
		"--lock-tables=false",
		db.Database,
	)

	cmd.Env = env

	outputFile, err := os.Create(filePath)
	if err != nil {
		return "", err
	}
	defer outputFile.Close()

	cmd.Stdout = outputFile

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	err = cmd.Run()
	if err != nil {
		os.Remove(filePath)
		return "", fmt.Errorf("mysqldump failed: %v, stderr: %s", err, stderr.String())
	}

	return filePath, nil
}

func (be *BackupExecutor) backupPostgreSQL(db models.Database) (string, error) {
	timestamp := time.Now().Format("20060102_150405")
	fileName := fmt.Sprintf("%s_%s.dump", db.Name, timestamp)
	filePath := filepath.Join(be.BackupDir, fileName)

	var cmd *exec.Cmd
	var stderr bytes.Buffer

	// Check if we're in Docker and host is localhost - try docker exec first
	// Otherwise, use pg_dump directly (works for Docker service names and external hosts)
	if db.Host == "localhost" || db.Host == "127.0.0.1" {
		// Try docker exec first (for local development outside Docker)
		containerPath := "/tmp/" + fileName
		dockerCmd := exec.Command("docker", "exec",
			"-e", fmt.Sprintf("PGPASSWORD=%s", db.Password),
			"safebase-postgres",
			"pg_dump",
			"-U", db.Username,
			"-d", db.Database,
			"-F", "c",
			"-f", containerPath,
		)
		dockerCmd.Stderr = &stderr
		
		if err := dockerCmd.Run(); err == nil {
			// Docker exec succeeded, copy the file
			cpCmd := exec.Command("docker", "cp", "safebase-postgres:"+containerPath, filePath)
			if err := cpCmd.Run(); err != nil {
				return "", fmt.Errorf("failed to copy backup from container: %v", err)
			}
			exec.Command("docker", "exec", "safebase-postgres", "rm", containerPath).Run()
			return filePath, nil
		}
		// Docker exec failed, fall through to use pg_dump directly
	}

	// Use pg_dump directly (works in Docker with service names like "postgresql" or external hosts)
	pgDumpPath := findCommand("pg_dump")
	host := db.Host
	if host == "localhost" {
		host = "127.0.0.1"
	}
	
	cmd = exec.Command(pgDumpPath,
		"-h", host,
		"-p", fmt.Sprintf("%d", db.Port),
		"-U", db.Username,
		"-d", db.Database,
		"-F", "c",
		"-f", filePath,
	)
	cmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", db.Password))
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		os.Remove(filePath)
		return "", fmt.Errorf("pg_dump failed: %v, stderr: %s", err, stderr.String())
	}

	return filePath, nil
}

