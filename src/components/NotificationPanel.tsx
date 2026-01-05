import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Alert } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface NotificationPanelProps {
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

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

export default function NotificationPanel({ onClose, onUnreadCountChange }: NotificationPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const data = await api.alerts.getAll();
      const formattedAlerts = data.map((alert: any) => ({
        ...alert,
        timestamp: new Date(alert.timestamp),
      }));
      setAlerts(formattedAlerts);
      
      // Update unread count
      const unreadCount = formattedAlerts.filter((a: Alert) => !a.read).length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unreadCount);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.alerts.markAsRead(id);
      setAlerts(alerts.map(alert => 
        alert.id === id ? { ...alert, read: true } : alert
      ));
      
      // Update unread count
      const unreadCount = alerts.filter(a => a.id !== id && !a.read).length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unreadCount);
      }
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.alerts.markAllAsRead();
      setAlerts(alerts.map(alert => ({ ...alert, read: true })));
      
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  };
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Info className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-500 text-center">Aucune notification</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const Icon = iconMap[alert.type];
              return (
                <div
                  key={alert.id}
                  className={`px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !alert.read ? 'bg-blue-50/30' : ''
                  }`}
                  onClick={() => !alert.read && handleMarkAsRead(alert.id)}
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
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button 
            onClick={handleMarkAllAsRead}
            disabled={loading || alerts.every(a => a.read)}
            className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tout marquer comme lu
          </button>
        </div>
      </div>
    </>
  );
}

