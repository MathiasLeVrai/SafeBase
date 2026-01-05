import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Alert } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationPanelProps {
  onClose: () => void;
}

// Mock data
const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'error',
    title: 'Échec de sauvegarde',
    message: 'La sauvegarde de prod_mysql a échoué',
    databaseName: 'prod_mysql',
    timestamp: new Date(Date.now() - 3600000),
    read: false,
  },
  {
    id: '2',
    type: 'success',
    title: 'Sauvegarde réussie',
    message: 'La sauvegarde de dev_postgres a été effectuée avec succès',
    databaseName: 'dev_postgres',
    timestamp: new Date(Date.now() - 7200000),
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Espace disque faible',
    message: 'L\'espace de stockage est à 85% de capacité',
    timestamp: new Date(Date.now() - 10800000),
    read: false,
  },
  {
    id: '4',
    type: 'info',
    title: 'Nouvelle version disponible',
    message: 'Une mise à jour de SafeBase est disponible',
    timestamp: new Date(Date.now() - 86400000),
    read: true,
  },
];

const iconMap = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

const colorMap = {
  error: 'text-red-600 bg-red-50',
  warning: 'text-yellow-600 bg-yellow-50',
  success: 'text-green-600 bg-green-50',
  info: 'text-blue-600 bg-blue-50',
};

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {mockAlerts.map((alert) => {
            const Icon = iconMap[alert.type];
            return (
              <div
                key={alert.id}
                className={`px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  !alert.read ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg ${colorMap[alert.type]} flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {alert.title}
                      </h3>
                      {!alert.read && (
                        <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    {alert.databaseName && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        {alert.databaseName}
                      </span>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
            Tout marquer comme lu
          </button>
        </div>
      </div>
    </>
  );
}

