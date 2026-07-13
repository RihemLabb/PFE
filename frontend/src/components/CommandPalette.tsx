import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, Settings, Calendar, Users, LogOut, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: any;
  action: () => void;
  category: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const logout = useAuthStore((s) => s.logout);

  const commands: Command[] = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      description: 'View overview and statistics',
      icon: LayoutDashboard,
      action: () => navigate('/dashboard'),
      category: 'Navigation'
    },
    {
      id: 'services',
      label: 'Go to Services',
      description: 'Manage all services',
      icon: Settings,
      action: () => navigate('/dashboard/services'),
      category: 'Navigation'
    },
    {
      id: 'appointments',
      label: 'Go to Appointments',
      description: 'View all appointments',
      icon: Calendar,
      action: () => navigate('/dashboard/appointments'),
      category: 'Navigation'
    },
    {
      id: 'queue',
      label: 'Go to Queue',
      description: 'Manage the queue',
      icon: Users,
      action: () => navigate('/dashboard/queue'),
      category: 'Navigation'
    },
    {
      id: 'theme',
      label: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
      description: 'Toggle dark/light theme',
      icon: theme === 'light' ? Moon : Sun,
      action: toggleTheme,
      category: 'Preferences'
    },
    {
      id: 'logout',
      label: 'Sign Out',
      description: 'Log out of your account',
      icon: LogOut,
      action: () => { logout(); navigate('/login'); },
      category: 'Account'
    }
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Open with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommand = (cmd: Command) => {
    cmd.action();
    setIsOpen(false);
    setSearch('');
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">⌘K</kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                />
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No results found
                  </div>
                ) : (
                  Object.entries(
                    filteredCommands.reduce((acc, cmd) => {
                      if (!acc[cmd.category]) acc[cmd.category] = [];
                      acc[cmd.category].push(cmd);
                      return acc;
                    }, {} as Record<string, Command[]>)
                  ).map(([category, cmds]) => (
                    <div key={category} className="mb-4">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {category}
                      </div>
                      {cmds.map((cmd) => {
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => handleCommand(cmd)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                              <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{cmd.label}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{cmd.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Esc</kbd>
                    Close
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}