import { useState, useEffect } from 'react';
import { 
  Plus, 
  Database as DatabaseIcon, 
  MoreVertical,
  Edit,
  Trash2,
  Power,
  HardDrive,
  Calendar
} from 'lucide-react';
import { Database } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AddDatabaseModal from '../components/AddDatabaseModal';
import { api } from '../services/api';

export default function Databases() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);

  const getStatusColor = (status: Database['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = (status: Database['status']) => {
    switch (status) {
      case 'connected':
        return 'Connectée';
      case 'disconnected':
        return 'Déconnectée';
      case 'error':
        return 'Erreur';
    }
  };

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    try {
      setLoading(true);
      const data = await api.databases.getAll();
      const formattedData: Database[] = data.map((db: any) => ({
        ...db,
        lastBackup: db.lastBackup ? new Date(db.lastBackup) : undefined,
        createdAt: new Date(db.createdAt),
      }));
      setDatabases(formattedData);
    } catch (error) {
      console.error('Error loading databases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette base de données ?')) {
      return;
    }
    try {
      await api.databases.delete(id);
      await loadDatabases();
    } catch (error) {
      console.error('Error deleting database:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleCreateBackup = async (databaseId: string) => {
    try {
      await api.backups.createManual(databaseId);
      alert('Sauvegarde manuelle lancée');
      await loadDatabases();
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Erreur lors de la sauvegarde');
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Bases de données</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos connexions de bases de données
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Ajouter une base
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{databases.length}</p>
            </div>
            <DatabaseIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Connectées</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {databases.filter(db => db.status === 'connected').length}
              </p>
            </div>
            <Power className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">MySQL</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {databases.filter(db => db.type === 'mysql').length}
              </p>
            </div>
            <DatabaseIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">PostgreSQL</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {databases.filter(db => db.type === 'postgresql').length}
              </p>
            </div>
            <DatabaseIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {databases.map((db) => (
          <div key={db.id} className="card hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    db.type === 'mysql' ? 'bg-blue-50' : 'bg-purple-50'
                  }`}>
                    <DatabaseIcon className={`w-6 h-6 ${
                      db.type === 'mysql' ? 'text-blue-600' : 'text-purple-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{db.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{db.type}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setSelectedDb(selectedDb === db.id ? null : db.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  {selectedDb === db.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Modifier
                      </button>
                      <button 
                        onClick={() => {
                          handleCreateBackup(db.id);
                          setSelectedDb(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <HardDrive className="w-4 h-4" />
                        Sauvegarder maintenant
                      </button>
                      <button 
                        onClick={() => {
                          handleDelete(db.id);
                          setSelectedDb(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <span className={`badge ${getStatusColor(db.status)}`}>
                  {getStatusText(db.status)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Hôte</span>
                  <span className="text-gray-900 font-medium">{db.host}:{db.port}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Utilisateur</span>
                  <span className="text-gray-900 font-medium">{db.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Taille</span>
                  <span className="text-gray-900 font-medium">{db.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sauvegardes</span>
                  <span className="text-gray-900 font-medium">{db.backupCount}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Dernière sauvegarde:</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {db.lastBackup 
                    ? format(db.lastBackup, "dd MMM yyyy 'à' HH:mm", { locale: fr })
                    : 'Aucune'
                  }
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <AddDatabaseModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false);
            loadDatabases();
          }}
        />
      )}
    </div>
  );
}

