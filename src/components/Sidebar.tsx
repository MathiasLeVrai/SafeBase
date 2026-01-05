import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  HardDrive, 
  History, 
  Clock,
  Shield
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/databases', icon: Database, label: 'Bases de données' },
  { path: '/backups', icon: HardDrive, label: 'Sauvegardes' },
  { path: '/history', icon: History, label: 'Historique' },
  { path: '/schedules', icon: Clock, label: 'Planification' },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside 
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0'
      } overflow-hidden`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="bg-primary-600 p-2 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SafeBase</h1>
            <p className="text-xs text-gray-500">Backup Manager</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            @Mathias
          </p>
        </div>
      </div>
    </aside>
  );
}

