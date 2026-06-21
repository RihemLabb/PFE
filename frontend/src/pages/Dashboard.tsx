import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

interface Stats {
  totalServices: number;
  todayAppointments: number;
  checkedIn: number;
  finished: number;
  cancelled: number;
  waiting: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/appointments/dashboard/stats');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Dashboard</h2>
      <p className="mb-6 text-gray-600">Welcome, {user?.firstName} ({user?.role})</p>
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Total Services</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalServices}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Today's Appointments</p>
            <p className="text-3xl font-bold text-green-600">{stats.todayAppointments}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500">Waiting</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.waiting}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">Checked In</p>
            <p className="text-3xl font-bold text-purple-600">{stats.checkedIn}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-emerald-500">
            <p className="text-sm text-gray-500">Finished</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.finished}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
            <p className="text-sm text-gray-500">Cancelled</p>
            <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Loading statistics...</p>
      )}
    </div>
  );
}