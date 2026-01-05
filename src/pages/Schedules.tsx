import { useState, useEffect } from 'react';
import { 
  Plus, 
  Clock,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Play,
  Database as DatabaseIcon,
  Calendar
} from 'lucide-react';
import { BackupSchedule } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AddScheduleModal from '../components/AddScheduleModal';
import { api } from '../services/api';

const cronToHuman = (cron: string | undefined): string => {
  if (!cron || typeof cron !== 'string') {
    return 'Expression invalide';
  }

  const parts = cron.split(' ');
  if (parts.length < 5) {
    return cron;
  }

  const minute = parts[0];
  const hour = parts[1];
  const dayOfMonth = parts[2];
  const month = parts[3];
  const dayOfWeek = parts[4];

  if (hour && hour.includes('*/')) {
    const hours = hour.split('*/')[1];
    return `Toutes les ${hours} heures`;
  }

  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Tous les jours à ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  return cron;
};

export default function Schedules() {
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await api.schedules.getAll();
      const formattedData: BackupSchedule[] = data.map((schedule: any) => ({
        ...schedule,
        nextRun: schedule.nextRun ? new Date(schedule.nextRun) : undefined,
        lastRun: schedule.lastRun ? new Date(schedule.lastRun) : undefined,
      }));
      setSchedules(formattedData);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSchedule = async (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;
    
    try {
      await api.schedules.update(id, { ...schedule, enabled: !schedule.enabled });
      await loadSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette planification ?')) {
      return;
    }
    try {
      await api.schedules.delete(id);
      await loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleExecute = async (id: string) => {
    if (!confirm('Voulez-vous exécuter cette sauvegarde maintenant ?')) {
      return;
    }
    try {
      await api.schedules.execute(id);
      alert('Sauvegarde lancée avec succès !');
      await loadSchedules();
    } catch (error: any) {
      console.error('Error executing schedule:', error);
      const errorMessage = error?.message || 'Erreur lors de l\'exécution de la sauvegarde';
      alert(`Erreur : ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  const stats = {
    total: schedules.length,
    active: schedules.filter(s => s.enabled).length,
    inactive: schedules.filter(s => !s.enabled).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planification</h1>
          <p className="text-gray-600 mt-1">
            Automatisez vos sauvegardes avec des tâches planifiées
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouvelle planification
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
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
              <Play className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Actives</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <ToggleLeft className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactives</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              À propos des expressions cron
            </h4>
            <p className="text-sm text-blue-800">
              Les tâches planifiées utilisent le format cron standard. Exemples: 
              <code className="mx-1 px-1.5 py-0.5 bg-blue-100 rounded text-xs">0 */12 * * *</code> 
              (toutes les 12h), 
              <code className="mx-1 px-1.5 py-0.5 bg-blue-100 rounded text-xs">0 2 * * *</code> 
              (tous les jours à 2h).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {schedules.map((schedule) => (
          <div 
            key={schedule.id} 
            className={`card hover:shadow-md transition-shadow ${
              !schedule.enabled ? 'opacity-60' : ''
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    schedule.enabled ? 'bg-green-50' : 'bg-gray-100'
                  }`}>
                    <DatabaseIcon className={`w-6 h-6 ${
                      schedule.enabled ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {schedule.databaseName}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono mt-0.5">
                      {schedule.cronExpression}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSchedule(schedule.id)}
                  className="ml-2"
                >
                  {schedule.enabled ? (
                    <ToggleRight className="w-8 h-8 text-green-600 hover:text-green-700 transition-colors" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400 hover:text-gray-500 transition-colors" />
                  )}
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900">
                    {cronToHuman(schedule.cronExpression)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {schedule.nextRun ? (
                  <div className="flex items-start justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Prochaine exécution:</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {format(schedule.nextRun, "dd MMM yyyy", { locale: fr })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(schedule.nextRun, "HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Prochaine exécution:</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Non planifiée</p>
                    </div>
                  </div>
                )}

                {schedule.lastRun && (
                  <div className="flex items-start justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Dernière exécution:</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {format(schedule.lastRun, "dd MMM yyyy", { locale: fr })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(schedule.lastRun, "HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => handleExecute(schedule.id)}
                  className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Exécuter maintenant
                </button>
                <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(schedule.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {schedules.length === 0 && (
        <div className="card p-12 text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune planification
          </h3>
          <p className="text-gray-600 mb-4">
            Commencez par créer votre première tâche planifiée
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvelle planification
          </button>
        </div>
      )}

      {showAddModal && (
        <AddScheduleModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false);
            loadSchedules();
          }}
        />
      )}
    </div>
  );
}

