import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const SERVICE_ID = 'YOUR_SERVICE_ID'; // Replace with your ID
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const data = await getTodayQueue(SERVICE_ID);
        setQueue(data);
      } catch (error) { console.error(error); }
    };
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // Auto-refresh every 5s
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(timer); };
  }, []);

  const currentTicket = queue.find(q => q.status === 'IN_PROGRESS' || q.status === 'CALLED');
  const nextTickets = queue.filter(q => q.status === 'WAITING').slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 flex flex-col font-sans overflow-hidden relative">

      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>

      <div className="flex justify-between items-center mb-12 relative z-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Smart Queue</h1>
          <p className="text-indigo-300 text-lg mt-1">Live Status Board</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-light tracking-wider">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-indigo-300 text-lg mt-1">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-8 relative z-10">

        <div className="col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-12 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
          
          <motion.div 
            key={currentTicket?._id || 'empty'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center relative z-10"
          >
            <div className="inline-flex items-center gap-3 bg-indigo-500/20 border border-indigo-400/30 px-6 py-2 rounded-full mb-8">
              <Megaphone className="w-5 h-5 text-indigo-300" />
              <span className="text-indigo-200 font-semibold uppercase tracking-widest text-sm">Now Serving</span>
            </div>
            
            <h2 className="text-[10rem] font-black leading-none tracking-tighter bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent drop-shadow-2xl">
              {currentTicket?.ticketNumber || '---'}
            </h2>
            
            <p className="text-3xl text-gray-300 mt-4 font-light">
              {currentTicket?.appointmentId?.userId?.firstName || 'Waiting for next ticket...'}
            </p>

            <div className="mt-12 flex items-center gap-4 text-xl text-gray-400">
              <Clock className="w-6 h-6" />
              <span>Counter 01</span>
            </div>
          </motion.div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold">Up Next</h3>
          </div>

          <div className="space-y-4 flex-1">
            <AnimatePresence>
              {nextTickets.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-lg">No one waiting</div>
              ) : (
                nextTickets.map((ticket, i) => (
                  <motion.div
                    key={ticket._id}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl font-bold">
                        {ticket.position}
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{ticket.ticketNumber}</p>
                        <p className="text-sm text-gray-400">{ticket.appointmentId?.userId?.firstName}</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-gray-600" />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}