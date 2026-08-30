import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  CalendarDays,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  MonitorCog,
  Moon,
  Settings,
  Sun,
  UserCog,
  Users,
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import CommandPalette from './CommandPalette';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      path: '/dashboard/services',
      label: 'Services',
      icon: Settings,
      roles: ['ADMIN'],
    },
    {
      path: '/dashboard/counters',
      label: 'Counters',
      icon: MonitorCog,
      roles: ['ADMIN'],
    },
    {
      path: '/dashboard/staff',
      label: 'Staff',
      icon: UserCog,
      roles: ['ADMIN'],
    },
    {
      path: '/dashboard/holidays',
      label: 'Schedule',
      icon: CalendarDays,
      roles: ['ADMIN'],
    },
    {
      path: '/dashboard/reports',
      label: 'Reports',
      icon: FileBarChart,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      path: '/dashboard/appointments',
      label: 'Appointments',
      icon: Calendar,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      path: '/dashboard/queue',
      label: 'Queue',
      icon: Users,
      roles: ['ADMIN', 'AGENT'],
    },
  ].filter((item) => (user ? item.roles.includes(user.role) : false));

  const handleLogout = async () => {
    await api.post('/auth/logout', {}).catch(() => undefined);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <CommandPalette />

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed h-full shadow-premium"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Smart Queue
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Staff Portal
            </p>
          </motion.div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-265px)]">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.07 * index }}
              >
                <Link
                  to={item.path}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 gradient-primary rounded-xl"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-all mb-3"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 mb-3"
          >
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold shadow-lg">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.role}
              </p>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </motion.button>
        </div>
      </motion.aside>

      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto p-8 pt-20">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
