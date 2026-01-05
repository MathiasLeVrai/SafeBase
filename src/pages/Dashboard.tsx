import { useState, useEffect } from 'react';
import { 
  Database, 
  HardDrive, 
  TrendingUp, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { Backup } from '../types';
import { format } from 'date-fns';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [databases, setDatabases] = useState<any[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dbsData, backupsData, schedulesData] = await Promise.all([
        api.databases.getAll(),
        api.backups.getAll(),
        api.schedules.getAll(),
      ]);

      setDatabases(dbsData);
      
      const formattedBackups: Backup[] = backupsData.map((backup: any) => ({
        ...backup,
        createdAt: new Date(backup.createdAt),
      }));
      setBackups(formattedBackups);

      const formattedSchedules: any[] = schedulesData.map((schedule: any) => ({
        ...schedule,
        nextRun: schedule.nextRun ? new Date(schedule.nextRun) : undefined,
      }));
      setSchedules(formattedSchedules);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalDatabases = databases.length;
    const totalBackups = backups.length;
    const successBackups = backups.filter(b => b.status === 'success').length;
    const successRate = totalBackups > 0 ? ((successBackups / totalBackups) * 100).toFixed(1) : '0';
    
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent24h = backups.filter(b => b.createdAt >= last24h);
    const success24h = recent24h.filter(b => b.status === 'success').length;
    const failed24h = recent24h.filter(b => b.status === 'failed').length;
    
    const next24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const scheduledNext24h = schedules.filter(s => 
      s.enabled && s.nextRun && s.nextRun <= next24h
    ).length;

    const totalSize = backups
      .filter(b => b.size && b.size !== '-')
      .reduce((sum, b) => {
        const sizeStr = b.size.toLowerCase();
        if (sizeStr.includes('gb')) {
          return sum + parseFloat(sizeStr.replace('gb', '').trim()) * 1024;
        } else if (sizeStr.includes('mb')) {
          return sum + parseFloat(sizeStr.replace('mb', '').trim());
        }
        return sum;
      }, 0);

    const totalSizeGB = (totalSize / 1024).toFixed(0);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayBackups = backups.filter(b => {
        const backupDate = new Date(b.createdAt);
        return backupDate.toDateString() === date.toDateString();
      });
      return {
        date: format(date, 'dd/MM'),
        backups: dayBackups.length,
        failed: dayBackups.filter(b => b.status === 'failed').length,
      };
    });

    return {
      totalDatabases,
      totalBackups,
      successRate,
      totalSizeGB,
      success24h,
      failed24h,
      scheduledNext24h,
      chartData: last7Days,
      recentBackups: backups
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
    };
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  const stats = calculateStats();
  
  const statCards = [
    {
      title: 'Bases de données',
      value: stats.totalDatabases.toString(),
      change: `${stats.totalDatabases} configurée${stats.totalDatabases > 1 ? 's' : ''}`,
      icon: Database,
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Sauvegardes totales',
      value: stats.totalBackups.toString(),
      change: `${stats.success24h} dans les 24h`,
      icon: HardDrive,
      lightColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Taux de réussite',
      value: `${stats.successRate}%`,
      change: stats.totalBackups > 0 ? `${stats.totalBackups - parseInt(stats.successRate)} échecs` : 'Aucune sauvegarde',
      icon: TrendingUp,
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },

  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Vue d'ensemble de votre système de sauvegarde
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-2">{stat.change}</p>
              </div>
              <div className={`${stat.lightColor} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tendance des sauvegardes
              </h3>
              <p className="text-sm text-gray-500 mt-1">7 derniers jours</p>
            </div>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="colorBackups" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="backups" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                fill="url(#colorBackups)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                État du système
              </h3>
              <p className="text-sm text-gray-500 mt-1">Dernières 24 heures</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">Sauvegardes réussies</p>
                  <p className="text-sm text-gray-600">Sur les dernières 24h</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.success24h}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="font-semibold text-gray-900">Sauvegardes échouées</p>
                  <p className="text-sm text-gray-600">Sur les dernières 24h</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.failed24h}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">Planifiées</p>
                  <p className="text-sm text-gray-600">Prochaines 24h</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.scheduledNext24h}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Sauvegardes récentes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base de données
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taille
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentBackups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucune sauvegarde récente
                  </td>
                </tr>
              ) : (
                stats.recentBackups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Database className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="font-medium text-gray-900">{backup.databaseName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {backup.status === 'success' ? (
                        <span className="badge bg-green-100 text-green-800">
                          Réussi
                        </span>
                      ) : backup.status === 'failed' ? (
                        <span className="badge bg-red-100 text-red-800">
                          Échoué
                        </span>
                      ) : (
                        <span className="badge bg-yellow-100 text-yellow-800">
                          En cours
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(backup.createdAt, 'HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {backup.size || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {backup.duration ? formatDuration(backup.duration) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

