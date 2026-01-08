import { useState } from 'react';
import { X, Database } from 'lucide-react';
import { api } from '../services/api';

interface AddDatabaseModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddDatabaseModal({ onClose, onSuccess }: AddDatabaseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'mysql',
    host: '',
    port: 3306,
    username: '',
    password: '',
    database: '',
  });

  // Exemples selon le type de base de données
  const getPlaceholders = () => {
    if (formData.type === 'mysql') {
      return {
        host: 'mysql (Docker) ou host.docker.internal',
        database: 'testdb',
        username: 'testuser',
      };
    } else {
      return {
        host: 'postgresql (Docker) ou host.docker.internal',
        database: 'testdb',
        username: 'testuser',
      };
    }
  };
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.databases.create(formData);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating database:', error);
      alert('Erreur lors de la création de la base de données');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Mise à jour du port par défaut lors du changement de type
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value,
        port: value === 'mysql' ? 3306 : 5432,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'port' ? parseInt(value) : value,
      }));
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <Database className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Ajouter une base de données
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Configurez une nouvelle connexion
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
            {/* Info Docker */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900 mb-1">
                    🐳 Configuration Docker
                  </h3>
                  <p className="text-sm text-blue-700">
                    Pour les BDD incluses dans Docker : utilisez <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">mysql</code> ou <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">postgresql</code> comme hôte.
                    <br />
                    Pour les BDD sur votre machine : utilisez <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">host.docker.internal</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la connexion
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ex: prod_mysql"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de base de données
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hôte
                  </label>
                  <input
                    type="text"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    placeholder={getPlaceholders().host}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    💡 Dans Docker, utilisez le nom du service (ex: mysql, postgresql)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la base de données
                </label>
                <input
                  type="text"
                  name="database"
                  value={formData.database}
                  onChange={handleChange}
                  placeholder={getPlaceholders().database}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={getPlaceholders().username}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
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
                {loading ? 'Création...' : 'Ajouter la base'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

