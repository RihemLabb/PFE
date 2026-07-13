import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Megaphone, Play, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTodayQueue, checkInUser, callNextTicket, startService, finishService, markAbsent } from '../api/appointmentsApi';

interface QueueEntry {
  _id: string;
  position: number;
  status: string;
  ticketNumber: string;
  appointmentId: { 
    timeSlot: string; 
    ticketNumber: string;
    userId: { firstName: string } 
  };
}

export default function Queue() {
  const SERVICE_ID = '6a382d7db354350753f4f830'; 
  const COUNTER_ID = '6a382d7db354350753f4f832'; 

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [qrToken, setQrToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchQueue = async () => {
    console.log('--- FETCHING QUEUE ---');
    console.log('Using SERVICE_ID:', SERVICE_ID);
    try {
      const data = await getTodayQueue(SERVICE_ID);
      console.log('API Response:', data);
      console.log('Number of entries:', data.length);
      setQueue(data);
    } catch (error: any) {
      console.error('Fetch queue error:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to load queue');
    }
  };

  useEffect(() => { 
    console.log('Queue component mounted');
    fetchQueue(); 
  }, []);

  const handleCheckIn = async () => {
    if (!qrToken) return;
    setIsLoading(true);
    try {
      const response = await checkInUser(qrToken);
      console.log('Check-in response:', response);
      toast.success('User checked in successfully');
      setQrToken('');
      await fetchQueue();
    } catch (err: any) {
      console.error('Check-in error:', err);
      console.error('Error response:', err.response?.data);
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleCallNext = async () => {
    try {
      console.log('Calling next with:', { SERVICE_ID, COUNTER_ID });
      await callNextTicket(SERVICE_ID, COUNTER_ID);
      toast.success('Next ticket called');
      fetchQueue();
    } catch (err: any) {
      console.error('Call next error:', err);
      console.error('Error response:', err.response?.data);
      toast.error(err.response?.data?.message || 'Call next failed');
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      const actions = { start: startService, finish: finishService, absent: markAbsent };
      await actions[action as keyof typeof actions](id);
      toast.success(`Ticket ${action}ed successfully`);
      fetchQueue();
    } catch (err: any) {
      console.error(`${action} error:`, err);
      console.error('Error response:', err.response?.data);
      toast.error(err.response?.data?.message || `Failed to ${action}`);
    }
  };

  const waitingCount = queue.filter(q => q.status === 'WAITING').length;
  const calledCount = queue.filter(q => q.status === 'CALLED').length;
  const finishedCount = queue.filter(q => q.status === 'FINISHED').length;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'WAITING': return { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock };
      case 'CALLED': return { bg: 'bg-blue-50', text: 'text-blue-700', icon: Megaphone };
      case 'IN_PROGRESS': return { bg: 'bg-purple-50', text: 'text-purple-700', icon: Play };
      case 'ABSENT': return { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle };
      case 'FINISHED': return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 };
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', icon: Clock };
    }
  };

  console.log('Current queue state:', queue);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Queue Management</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Real-time agent control center</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Waiting', value: waitingCount, icon: Clock, color: 'amber' },
          { label: 'Called', value: calledCount, icon: Megaphone, color: 'blue' },
          { label: 'Finished', value: finishedCount, icon: CheckCircle2, color: 'emerald' },
          { label: 'Total Today', value: queue.length, icon: Users, color: 'indigo' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-premium"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-premium"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Check-in User
          </h3>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={qrToken} 
              onChange={(e) => setQrToken(e.target.value)}
              placeholder="Paste QR token here..." 
              className="flex-1 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleCheckIn} disabled={isLoading || !qrToken}
              className="bg-gray-900 dark:bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-colors shadow-lg"
            >
              {isLoading ? 'Checking...' : 'Check In'}
            </motion.button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-premium flex flex-col justify-center"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5" /> Call Next
          </h3>
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleCallNext} 
            className="w-full bg-white text-indigo-600 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-lg"
          >
            Call Next Ticket
          </motion.button>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-premium overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Today's Queue</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <AnimatePresence>
            {queue.length === 0 ? (
              <div className="p-16 text-center">
                <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">No one in queue</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Check in users to get started</p>
              </div>
            ) : (
              queue.map((entry, index) => {
                const config = getStatusConfig(entry.status);
                const Icon = config.icon;
                return (
                  <motion.div 
                    key={entry._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">#{entry.position}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">{entry.appointmentId?.ticketNumber}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{entry.appointmentId?.userId?.firstName} • {entry.appointmentId?.timeSlot}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${config.bg} ${config.text}`}>
                        <Icon className="w-4 h-4" /> {entry.status}
                      </span>
                      {entry.status === 'CALLED' && (
                        <div className="flex gap-2">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAction(entry._id, 'start')} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors">Start</motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAction(entry._id, 'absent')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">Absent</motion.button>
                        </div>
                      )}
                      {entry.status === 'IN_PROGRESS' && (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAction(entry._id, 'finish')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">Finish</motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}