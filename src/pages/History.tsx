import { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Search,
  Database as DatabaseIcon,
  Calendar,
  CheckCircle,
  AlertCircle,
  Download,
  Eye
} from 'lucide-react';
import { Backup } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import RestoreModal from '../components/RestoreModal';
import { api } from '../services/api';

export default function History() {
  const [history, setHistory] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDatabase, setSelectedDatabase] = useState<string>('all');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.backups.getAll();
      const formattedData: Backup[] = data.map((backup: any) => ({
        ...backup,
        createdAt: new Date(backup.createdAt),
      }));
      setHistory(formattedData);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const databases = Array.from(new Set(history.map(h => h.databaseName)));

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.databaseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.version.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDatabase = selectedDatabase === 'all' || item.databaseName === selectedDatabase;
    return matchesSearch && matchesDatabase;
  });

  const handleRestore = (backup: Backup) => {
    setSelectedBackup(backup);
    setShowRestoreModal(true);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historique</h1>
          <p className="text-gray-600 mt-1">
            Consultez et restaurez vos sauvegardes
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par base ou version..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Database Filter */}
          <div className="flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5 text-gray-400" />
            <select
              value={selectedDatabase}
              onChange={(e) => setSelectedDatabase(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Toutes les bases</option>
              {databases.map(db => (
                <option key={db} value={db}>{db}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredHistory.length} version(s) trouvée(s)
        </p>
      </div>

      {/* History Timeline */}
      <div className="space-y-4">
        {filteredHistory.map((backup, index) => {
          const isFirst = index === 0;
          const prevBackup = index > 0 ? filteredHistory[index - 1] : null;
          const showDateSeparator = !prevBackup || 
            format(backup.createdAt, 'yyyy-MM-dd') !== format(prevBackup.createdAt, 'yyyy-MM-dd');

          return (
            <div key={backup.id}>
              {/* Date Separator */}
              {showDateSeparator && (
                <div className="flex items-center gap-4 mb-4">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {format(backup.createdAt, "EEEE d MMMM yyyy", { locale: fr })}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}

              {/* Backup Card */}
              <div className={`card hover:shadow-md transition-all ${
                isFirst ? 'ring-2 ring-primary-500' : ''
              }`}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left Section */}
                    <div className="flex gap-4 flex-1">
                      {/* Icon */}
                      <div className={`p-3 rounded-lg ${
                        backup.status === 'success' 
                          ? 'bg-green-50' 
                          : 'bg-red-50'
                      }`}>
                        {backup.status === 'success' ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {backup.databaseName}
                          </h3>
                          {isFirst && (
                            <span className="badge bg-primary-100 text-primary-800">
                              Plus récent
                            </span>
                          )}
                          <span className={`badge ${
                            backup.type === 'manual' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {backup.type === 'manual' ? 'Manuelle' : 'Planifiée'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 font-mono">
                          {backup.version}
                        </p>

                        <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(backup.createdAt, "HH:mm", { locale: fr })}
                          </div>
                          <div>
                            Taille: <span className="font-medium text-gray-900">{backup.size}</span>
                          </div>
                          <div>
                            Durée: <span className="font-medium text-gray-900">
                              {Math.floor(backup.duration / 60)}m {backup.duration % 60}s
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                        title="Télécharger"
                      >
                        <Download className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                        title="Détails"
                      >
                        <Eye className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                      </button>
                      <button
                        onClick={() => handleRestore(backup)}
                        className="btn-primary flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restaurer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredHistory.length === 0 && (
        <div className="card p-12 text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <DatabaseIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun résultat
          </h3>
          <p className="text-gray-600">
            Aucune sauvegarde ne correspond à vos critères de recherche
          </p>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && selectedBackup && (
        <RestoreModal
          backup={selectedBackup}
          onClose={() => {
            setShowRestoreModal(false);
            setSelectedBackup(null);
          }}
        />
      )}
    </div>
  );
}

