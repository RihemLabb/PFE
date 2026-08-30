import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Megaphone } from 'lucide-react';
import {
  getPublicQueueDisplay,
  type PublicQueueEntry,
} from '../api/appointmentsApi';
import { getServices, type Service } from '../api/servicesApi';

export default function QueueDisplay() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [queue, setQueue] = useState<PublicQueueEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await getServices();
        const activeServices = data.filter((service) => service.isActive);
        setServices(activeServices);
        setSelectedServiceId(activeServices[0]?._id ?? '');
      } catch {
        setServices([]);
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    if (!selectedServiceId) {
      setQueue([]);
      return;
    }

    const fetchQueue = async () => {
      try {
        const data = await getPublicQueueDisplay(selectedServiceId);
        setQueue(data);
      } catch {
        setQueue([]);
      }
    };

    fetchQueue();
    const interval = window.setInterval(fetchQueue, 3000);
    return () => window.clearInterval(interval);
  }, [selectedServiceId]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeTickets = queue.filter(
    (entry) => entry.status === 'CALLED' || entry.status === 'IN_PROGRESS',
  );
  const waitingTickets = queue
    .filter((entry) => entry.status === 'WAITING')
    .slice(0, 4);
  const selectedService = services.find(
    (service) => service._id === selectedServiceId,
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300 font-semibold mb-2">
              Smart Queue
            </p>
            <h1 className="text-4xl md:text-5xl font-bold">Now Serving</h1>
            <p className="text-gray-400 mt-2">
              {selectedService?.name ?? 'Select a service'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {services.length > 1 && (
              <select
                value={selectedServiceId}
                onChange={(event) => setSelectedServiceId(event.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white"
              >
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            )}
            <div className="text-2xl md:text-3xl font-mono bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-center">
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {activeTickets.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center mb-12">
            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Waiting for the next call</h2>
            <p className="text-gray-400 mt-2">
              Called tickets will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {activeTickets.map((entry) => {
              const isCalled = entry.status === 'CALLED';
              const Icon = isCalled ? Megaphone : CheckCircle2;
              return (
                <motion.div
                  key={entry._id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`rounded-3xl p-10 md:p-14 text-center shadow-2xl ${
                    isCalled
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-800'
                      : 'bg-gradient-to-br from-purple-600 to-violet-900'
                  }`}
                >
                  <Icon className="w-16 h-16 mx-auto mb-5" />
                  <p className="uppercase tracking-widest text-sm font-bold opacity-80 mb-3">
                    {isCalled ? 'Please proceed' : 'In service'}
                  </p>
                  <div className="text-6xl md:text-7xl font-black mb-5">
                    {entry.ticketNumber}
                  </div>
                  <div className="text-2xl opacity-95">
                    {entry.counterNumber
                      ? `Counter ${entry.counterNumber}`
                      : 'Counter assignment pending'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
            <Clock className="w-7 h-7" /> Up Next
          </h2>

          {waitingTickets.length === 0 ? (
            <p className="text-gray-500 py-6 text-center">
              No checked-in visitors are waiting right now.
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {waitingTickets.map((entry, index) => (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center"
                >
                  <div className="text-3xl font-bold mb-2">
                    {entry.ticketNumber}
                  </div>
                  <div className="text-gray-400">Position #{entry.position}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
