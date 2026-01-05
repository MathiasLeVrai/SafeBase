import { useState } from 'react';
import { X, RotateCcw, AlertTriangle, Database } from 'lucide-react';
import { Backup } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RestoreModalProps {
  backup: Backup;
  onClose: () => void;
}

export default function RestoreModal({ backup, onClose }: RestoreModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    if (!confirmed) return;
    
    setIsRestoring(true);
    // Simulate restore process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRestoring(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <RotateCcw className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Restaurer une sauvegarde
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Confirmez l'opération de restauration
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

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">
                    Attention
                  </h4>
                  <p className="text-sm text-yellow-800">
                    Cette opération va remplacer les données actuelles de la base de données 
                    par celles de la sauvegarde sélectionnée. Cette action est irréversible.
                  </p>
                </div>
              </div>
            </div>

            {/* Backup Info */}
            <div className="card p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Informations de la sauvegarde
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base de données:</span>
                  <span className="font-medium text-gray-900">{backup.databaseName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium text-gray-900 font-mono">{backup.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date de création:</span>
                  <span className="font-medium text-gray-900">
                    {format(backup.createdAt, "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taille:</span>
                  <span className="font-medium text-gray-900">{backup.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className={`badge ${
                    backup.type === 'manual' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {backup.type === 'manual' ? 'Manuelle' : 'Planifiée'}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmation */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Je comprends que cette action va remplacer les données actuelles et je souhaite continuer
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isRestoring}
            >
              Annuler
            </button>
            <button
              onClick={handleRestore}
              disabled={!confirmed || isRestoring}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRestoring ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Restauration...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Restaurer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

