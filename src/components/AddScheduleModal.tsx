import { useState, useEffect } from 'react';
import { X, Clock, Database } from 'lucide-react';
import { api } from '../services/api';

interface AddScheduleModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface DatabaseOption {
  id: string;
  name: string;
}

const cronPresets = [
  { label: 'Toutes les heures', value: '0 * * * *' },
  { label: 'Toutes les 6 heures', value: '0 */6 * * *' },
  { label: 'Toutes les 12 heures', value: '0 */12 * * *' },
  { label: 'Tous les jours à minuit', value: '0 0 * * *' },
  { label: 'Tous les jours à 2h', value: '0 2 * * *' },
  { label: 'Toutes les semaines (dimanche)', value: '0 0 * * 0' },
  { label: 'Tous les mois (1er)', value: '0 0 1 * *' },
];

export default function AddScheduleModal({ onClose, onSuccess }: AddScheduleModalProps) {
  const [databases, setDatabases] = useState<DatabaseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    databaseId: '',
    cronExpression: '',
    usePreset: true,
  });

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    try {
      const data = await api.databases.getAll();
      setDatabases(data.map((db: any) => ({ id: db.id, name: db.name })));
    } catch (error) {
      console.error('Error loading databases:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.schedules.create({
        databaseId: formData.databaseId,
        cronExpression: formData.cronExpression,
        enabled: true,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Erreur lors de la création de la planification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <Clock className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Nouvelle planification
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Automatisez vos sauvegardes
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base de données
                </label>
                <div className="relative">
                  <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.databaseId}
                    onChange={(e) => setFormData({ ...formData, databaseId: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionnez une base de données</option>
                    {databases.map(db => (
                      <option key={db.id} value={db.id}>{db.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.usePreset}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      usePreset: e.target.checked,
                      cronExpression: e.target.checked ? '' : formData.cronExpression
                    })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Utiliser une planification prédéfinie
                  </span>
                </label>
              </div>

              {formData.usePreset ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fréquence
                  </label>
                  <select
                    value={formData.cronExpression}
                    onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionnez une fréquence</option>
                    {cronPresets.map((preset, index) => (
                      <option key={index} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expression cron personnalisée
                  </label>
                  <input
                    type="text"
                    value={formData.cronExpression}
                    onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                    placeholder="0 */12 * * *"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Format: minute heure jour mois jour-semaine
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Exemples d'expressions cron:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    <code className="px-1.5 py-0.5 bg-blue-100 rounded">0 * * * *</code> 
                    {' - Toutes les heures'}
                  </li>
                  <li>
                    <code className="px-1.5 py-0.5 bg-blue-100 rounded">0 2 * * *</code> 
                    {' - Tous les jours à 2h'}
                  </li>
                  <li>
                    <code className="px-1.5 py-0.5 bg-blue-100 rounded">0 */6 * * *</code> 
                    {' - Toutes les 6 heures'}
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer la planification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

