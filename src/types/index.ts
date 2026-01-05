export interface Database {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql';
  host: string;
  port: number;
  username: string;
  status: 'connected' | 'disconnected' | 'error';
  lastBackup?: Date;
  backupCount: number;
  size: string;
  createdAt: Date;
}

export interface Backup {
  id: string;
  databaseId: string;
  databaseName: string;
  version: string;
  size: string;
  status: 'success' | 'failed' | 'in_progress';
  createdAt: Date;
  duration: number;
  type: 'manual' | 'scheduled';
}

export interface BackupSchedule {
  id: string;
  databaseId: string;
  databaseName: string;
  cronExpression: string;
  enabled: boolean;
  nextRun: Date;
  lastRun?: Date;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  databaseName?: string;
  timestamp: Date;
  read: boolean;
}

export interface DashboardStats {
  totalDatabases: number;
  totalBackups: number;
  successRate: number;
  totalSize: string;
  recentBackups: Backup[];
  recentAlerts: Alert[];
}

