import { useState, useEffect } from 'react';
import { 
  Play, 
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Database as DatabaseIcon,
  HardDrive
} from 'lucide-react';
import { Backup } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '../services/api';

export default function Backups() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'scheduled'>('all');

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const data = await api.backups.getAll();
      const formattedData: Backup[] = data.map((backup: any) => ({
        ...backup,
        createdAt: new Date(backup.createdAt),
      }));
      setBackups(formattedData);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBackups = backups.filter(backup => {
    if (filterStatus !== 'all' && backup.status !== filterStatus) return false;
    if (filterType !== 'all' && backup.type !== filterType) return false;
    return true;
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const stats = {
    total: backups.length,
    success: backups.filter(b => b.status === 'success').length,
    failed: backups.filter(b => b.status === 'failed').length,
    inProgress: backups.filter(b => b.status === 'in_progress').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sauvegardes</h1>
          <p className="text-gray-600 mt-1">
            Gérez et lancez vos sauvegardes
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Play className="w-5 h-5" />
          Lancer une sauvegarde
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <HardDrive className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Réussies</p>
              <p className="text-2xl font-bold text-green-600">{stats.success}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Échouées</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtres:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Statut:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="success">Réussies</option>
              <option value="failed">Échouées</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="manual">Manuelles</option>
              <option value="scheduled">Planifiées</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            {filteredBackups.length} résultat(s)
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base de données
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taille
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBackups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DatabaseIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="font-medium text-gray-900">
                        {backup.databaseName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 font-mono">
                      {backup.version}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      backup.type === 'manual' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {backup.type === 'manual' ? 'Manuelle' : 'Planifiée'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {backup.status === 'success' && (
                      <span className="badge bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        Réussi
                      </span>
                    )}
                    {backup.status === 'failed' && (
                      <span className="badge bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" />
                        Échoué
                      </span>
                    )}
                    {backup.status === 'in_progress' && (
                      <span className="badge bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" />
                        En cours
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {format(backup.createdAt, "dd MMM yyyy HH:mm", { locale: fr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {backup.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {backup.duration > 0 ? formatDuration(backup.duration) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="p-2 hover:bg-gray-100 rounded transition-colors group">
                      <Download className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

