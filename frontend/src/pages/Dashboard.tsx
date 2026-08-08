import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CalendarDays,
  CheckCircle,
  Clock,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../api/axios';

interface DashboardStats {
  totalServices: number;
  todayAppointments: number;
  checkedIn: number;
  finished: number;
  cancelled: number;
  absent: number;
  waiting: number;
  averageWaitMinutes: number;
  weeklyData: Array<{
    day: string;
    appointments: number;
    completed: number;
  }>;
  statusBreakdown: Array<{
    name: string;
    value: number;
  }>;
}

const statusColors: Record<string, string> = {
  Finished: '#10b981',
  Waiting: '#f59e0b',
  Cancelled: '#ef4444',
  Absent: '#64748b',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get<DashboardStats>(
          '/appointments/dashboard/stats',
        );
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard statistics', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = window.setInterval(fetchStats, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const statusData = useMemo(
    () =>
      (stats?.statusBreakdown ?? []).map((entry) => ({
        ...entry,
        color: statusColors[entry.name] ?? '#6366f1',
      })),
    [stats],
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Overview
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Live operational metrics for today's appointments and queue.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-4 lg:col-span-4 row-span-2 bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-950 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Weekly Performance
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Appointments vs completed services
                </p>
              </div>
              <div className="flex items-center gap-1 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap">
                <Clock className="w-3.5 h-3.5" /> Avg wait {stats?.averageWaitMinutes ?? 0} min
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats?.weeklyData ?? []}>
                <defs>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="appointments" name="Appointments" stroke="#6366f1" strokeWidth={3} fill="url(#colorApp)" />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} fill="url(#colorDone)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
          <CalendarDays className="w-5 h-5 text-indigo-200 mb-3" />
          <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Appointments Today</p>
          <p className="text-4xl font-bold mt-1">{stats?.todayAppointments ?? 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Clock className="w-5 h-5 text-amber-500 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Waiting Now</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats?.waiting ?? 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Users className="w-5 h-5 text-blue-500 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Checked In Today</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats?.checkedIn ?? 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CheckCircle className="w-5 h-5 text-emerald-500 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Finished Today</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats?.finished ?? 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Activity className="w-5 h-5 text-purple-500 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Active Services</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats?.totalServices ?? 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="md:col-span-2 lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 w-full text-left">
            Today's Status Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                {statusData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-2">
            {statusData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{entry.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
