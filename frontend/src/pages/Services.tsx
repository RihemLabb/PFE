import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Clock, Users, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getServices } from '../api/servicesApi';

interface Service {
  _id: string;
  name: string;
  description: string;
  avgDuration: number;
  slotDuration: number;
  maxCapacityPerSlot: number;
  isActive: boolean;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (error) { toast.error('Failed to load services'); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-96 bg-gray-100 rounded-2xl animate-pulse"></div>;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-900">Services</h2>
        <p className="text-gray-500 mt-2">Manage all available administrative services</p>
      </motion.div>

      {services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-premium">
          <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900">No services configured</p>
          <p className="text-sm text-gray-500 mt-1">Create your first service to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div 
              key={service._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-premium hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${service.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
              <p className="text-sm text-gray-600 mb-6 line-clamp-2 leading-relaxed">{service.description}</p>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <Clock className="w-4 h-4 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500 font-medium">Duration</p>
                  <p className="text-sm font-bold text-gray-900">{service.avgDuration}m</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Clock className="w-4 h-4 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500 font-medium">Slot</p>
                  <p className="text-sm font-bold text-gray-900">{service.slotDuration}m</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Users className="w-4 h-4 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500 font-medium">Capacity</p>
                  <p className="text-sm font-bold text-gray-900">{service.maxCapacityPerSlot}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}