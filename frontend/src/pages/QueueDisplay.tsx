import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Clock, CheckCircle2 } from 'lucide-react';
import { getTodayQueue } from '../api/appointmentsApi';

interface QueueEntry {
  _id: string;
  position: number;
  status: string;
  ticketNumber: string;
  appointmentId: { userId: { firstName: string } };
}

export default function QueueDisplay() {
  const SERVICE_ID = '6a382d7db354350753f4f830';
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const data = await getTodayQueue(SERVICE_ID);
        setQueue(data.filter(q => q.status === 'CALLED' || q.status === 'IN_PROGRESS'));
      } catch (error) {
        console.error('Failed to fetch queue', error);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentCall = queue.find(q => q.status === 'CALLED');
  const inProgress = queue.find(q => q.status === 'IN_PROGRESS');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-5xl font-bold">Now Serving</h1>
          <div className="text-3xl font-mono">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {currentCall && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-16 text-center shadow-2xl"
            >
              <Megaphone className="w-20 h-20 mx-auto mb-6" />
              <div className="text-7xl font-bold mb-4">{currentCall.ticketNumber}</div>
              <div className="text-2xl opacity-90">Counter {currentCall.position}</div>
            </motion.div>
          )}

          {inProgress && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-16 text-center shadow-2xl"
            >
              <CheckCircle2 className="w-20 h-20 mx-auto mb-6" />
              <div className="text-7xl font-bold mb-4">{inProgress.ticketNumber}</div>
              <div className="text-2xl opacity-90">In Service</div>
            </motion.div>
          )}
        </div>

        <div className="mt-12 bg-gray-800 rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Clock className="w-8 h-8" /> Up Next
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {queue.filter(q => q.status === 'WAITING').slice(0, 4).map((entry, index) => (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-700 rounded-xl p-6 text-center"
              >
                <div className="text-3xl font-bold mb-2">{entry.ticketNumber}</div>
                <div className="text-gray-400">Position #{entry.position}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
