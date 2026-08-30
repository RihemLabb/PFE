import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  MonitorCog,
  Moon,
  Search,
  Settings,
  Sun,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: string;
  roles?: string[];
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const commands: Command[] = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      description: 'View live overview and statistics',
      icon: LayoutDashboard,
      action: () => navigate('/dashboard'),
      category: 'Navigation',
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      id: 'services',
      label: 'Go to Services',
      description: 'Manage schedules, capacity, and documents',
      icon: Settings,
      action: () => navigate('/dashboard/services'),
      category: 'Administration',
      roles: ['ADMIN'],
    },
    {
      id: 'counters',
      label: 'Go to Counters',
      description: 'Manage physical service counters',
      icon: MonitorCog,
      action: () => navigate('/dashboard/counters'),
      category: 'Administration',
      roles: ['ADMIN'],
    },
    {
      id: 'staff',
      label: 'Go to Staff & Assignments',
      description: 'Manage agents, supervisors, and counter assignments',
      icon: UserCog,
      action: () => navigate('/dashboard/staff'),
      category: 'Administration',
      roles: ['ADMIN'],
    },
    {
      id: 'appointments',
      label: 'Go to Appointments',
      description: 'View all appointments',
      icon: Calendar,
      action: () => navigate('/dashboard/appointments'),
      category: 'Navigation',
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      id: 'queue',
      label: 'Go to Queue',
      description: 'Manage the live queue',
      icon: Users,
      action: () => navigate('/dashboard/queue'),
      category: 'Navigation',
      roles: ['ADMIN', 'AGENT'],
    },
    {
      id: 'theme',
      label: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
      description: 'Toggle dark/light theme',
      icon: theme === 'light' ? Moon : Sun,
      action: toggleTheme,
      category: 'Preferences',
    },
    {
      id: 'logout',
      label: 'Sign Out',
      description: 'Log out of your account',
      icon: LogOut,
      action: () => {
        logout();
        navigate('/login');
      },
      category: 'Account',
    },
  ];

  const availableCommands = commands.filter(
    (command) => !command.roles || (user && command.roles.includes(user.role)),
  );
  const normalizedSearch = search.toLowerCase();
  const filteredCommands = availableCommands.filter(
    (command) =>
      command.label.toLowerCase().includes(normalizedSearch) ||
      command.description.toLowerCase().includes(normalizedSearch) ||
      command.category.toLowerCase().includes(normalizedSearch),
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommand = (command: Command) => {
    command.action();
    setIsOpen(false);
    setSearch('');
  };

  const groupedCommands = filteredCommands.reduce(
    (groups, command) => {
      if (!groups[command.category]) groups[command.category] = [];
      groups[command.category].push(command);
      return groups;
    },
    {} as Record<string, Command[]>,
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex fixed top-5 right-8 z-30 items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="px-1.5 py-0.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[calc(100%_-_2rem)] max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            >
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No results found
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                    <div key={category} className="mb-4">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {category}
                      </div>
                      {categoryCommands.map((command) => {
                        const Icon = command.icon;
                        return (
                          <button
                            key={command.id}
                            onClick={() => handleCommand(command)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                              <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {command.label}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {command.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
