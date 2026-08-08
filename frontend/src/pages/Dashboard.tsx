import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Clock, Activity, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/axios';

const weeklyData = [
  { day: 'Mon', appointments: 45, completed: 38 },
  { day: 'Tue', appointments: 52, completed: 48 },
  { day: 'Wed', appointments: 48, completed: 42 },
  { day: 'Thu', appointments: 61, completed: 55 },
  { day: 'Fri', appointments: 58, completed: 52 },
  { day: 'Sat', appointments: 35, completed: 30 },
  { day: 'Sun', appointments: 28, completed: 25 },
];

const statusData = [
  { name: 'Finished', value: 65, color: '#10b981' },
  { name: 'Waiting', value: 20, color: '#f59e0b' },
  { name: 'Cancelled', value: 15, color: '#ef4444' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/appointments/dashboard/stats');
        setStats(data);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h2>
        <p className="text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="md:col-span-4 lg:col-span-4 row-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 group-hover:opacity-70 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Weekly Performance</h3>
                <p className="text-sm text-gray-500">Appointments vs Completed</p>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
                <ArrowUpRight className="w-3 h-3" /> +12.5%
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="appointments" stroke="#6366f1" strokeWidth={3} fill="url(#colorApp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
          <Activity className="w-5 h-5 text-indigo-200 mb-3" />
          <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Total Services</p>
          <p className="text-4xl font-bold mt-1">{stats?.totalServices || 0}</p>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Clock className="w-5 h-5 text-amber-500 mb-3" />
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Waiting Now</p>
          <p className="text-4xl font-bold text-gray-900 mt-1">{stats?.waiting || 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Users className="w-5 h-5 text-blue-500 mb-3" />
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Checked In</p>
          <p className="text-4xl font-bold text-gray-900 mt-1">{stats?.checkedIn || 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CheckCircle className="w-5 h-5 text-emerald-500 mb-3" />
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Finished</p>
          <p className="text-4xl font-bold text-gray-900 mt-1">{stats?.finished || 0}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
          className="md:col-span-2 lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-2 w-full text-left">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}}></div>
                <span className="text-xs text-gray-500 font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
