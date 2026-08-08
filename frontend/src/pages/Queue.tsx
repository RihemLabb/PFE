import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Link2,
  Megaphone,
  Play,
  QrCode,
  Settings2,
  Users,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  callNextTicket,
  checkInUser,
  finishService,
  getTodayQueue,
  markAbsent,
  startService,
  type QueueEntry,
} from '../api/appointmentsApi';
import { getServices, type Service } from '../api/servicesApi';
import { getCounters, type Counter } from '../api/countersApi';
import {
  getMyAgentAssignment,
  type AgentAssignment,
} from '../api/agentAssignmentsApi';
import { useAuthStore } from '../store/authStore';

export default function Queue() {
  const user = useAuthStore((state) => state.user);
  const isAgent = user?.role === 'AGENT';
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [assignment, setAssignment] = useState<AgentAssignment | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedCounterId, setSelectedCounterId] = useState('');
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [qrToken, setQrToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    const loadConfiguration = async () => {
      setConfigLoading(true);
      try {
        if (isAgent) {
          const currentAssignment = await getMyAgentAssignment();
          setAssignment(currentAssignment);

          if (!currentAssignment) {
            setSelectedServiceId('');
            setSelectedCounterId('');
            return;
          }

          const serviceRef = currentAssignment.counterId.serviceId;
          const serviceId =
            typeof serviceRef === 'string' ? serviceRef : serviceRef._id;
          setSelectedServiceId(serviceId);
          setSelectedCounterId(currentAssignment.counterId._id);
        } else {
          const [serviceData, counterData] = await Promise.all([
            getServices(),
            getCounters(),
          ]);
          const activeServices = serviceData.filter((service) => service.isActive);
          setServices(activeServices);
          setCounters(counterData);
          setSelectedServiceId(activeServices[0]?._id ?? '');
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || 'Failed to load counter configuration',
        );
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfiguration();
  }, [isAgent]);

  const serviceCounters = useMemo(
    () =>
      counters.filter((counter) => {
        const serviceId =
          typeof counter.serviceId === 'string'
            ? counter.serviceId
            : counter.serviceId._id;
        return serviceId === selectedServiceId && counter.status === 'ACTIVE';
      }),
    [counters, selectedServiceId],
  );

  useEffect(() => {
    if (isAgent) return;
    if (!serviceCounters.some((counter) => counter._id === selectedCounterId)) {
      setSelectedCounterId(serviceCounters[0]?._id ?? '');
    }
  }, [isAgent, selectedCounterId, serviceCounters]);

  const fetchQueue = useCallback(
    async (showError = false) => {
      if (!selectedServiceId) {
        setQueue([]);
        return;
      }

      try {
        const data = await getTodayQueue(selectedServiceId);
        setQueue(data);
      } catch (error: any) {
        if (showError) {
          toast.error(error.response?.data?.message || 'Failed to load queue');
        }
      }
    },
    [selectedServiceId],
  );

  useEffect(() => {
    if (!selectedServiceId) return;
    fetchQueue(true);
    const interval = window.setInterval(() => fetchQueue(false), 4000);
    return () => window.clearInterval(interval);
  }, [fetchQueue, selectedServiceId]);

  const handleCheckIn = async () => {
    const token = qrToken.trim();
    if (!token) return;

    setIsLoading(true);
    try {
      await checkInUser(token);
      toast.success('User checked in successfully');
      setQrToken('');
      await fetchQueue();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallNext = async () => {
    if (!selectedServiceId || !selectedCounterId) {
      toast.error(
        isAgent
          ? 'No active counter is assigned to your account'
          : 'Select an active service and counter first',
      );
      return;
    }

    try {
      await callNextTicket(selectedServiceId, selectedCounterId);
      toast.success('Next ticket called');
      await fetchQueue();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Call next failed');
    }
  };

  const handleAction = async (
    id: string,
    action: 'start' | 'finish' | 'absent',
  ) => {
    try {
      const actions = {
        start: startService,
        finish: finishService,
        absent: markAbsent,
      };
      await actions[action](id);
      toast.success(
        action === 'absent'
          ? 'Ticket marked absent'
          : action === 'finish'
            ? 'Service finished successfully'
            : 'Service started successfully',
      );
      await fetchQueue();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action}`);
    }
  };

  const waitingCount = queue.filter((entry) => entry.status === 'WAITING').length;
  const calledCount = queue.filter((entry) => entry.status === 'CALLED').length;
  const finishedCount = queue.filter((entry) => entry.status === 'FINISHED').length;

  const stats = [
    {
      label: 'Waiting',
      value: waitingCount,
      icon: Clock,
      boxClass: 'bg-amber-50 dark:bg-amber-900/20',
      iconClass: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Called',
      value: calledCount,
      icon: Megaphone,
      boxClass: 'bg-blue-50 dark:bg-blue-900/20',
      iconClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Finished',
      value: finishedCount,
      icon: CheckCircle2,
      boxClass: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Total Today',
      value: queue.length,
      icon: Users,
      boxClass: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconClass: 'text-indigo-600 dark:text-indigo-400',
    },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'WAITING':
        return { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock };
      case 'CALLED':
        return { bg: 'bg-blue-50', text: 'text-blue-700', icon: Megaphone };
      case 'IN_PROGRESS':
        return { bg: 'bg-purple-50', text: 'text-purple-700', icon: Play };
      case 'ABSENT':
        return { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle };
      case 'FINISHED':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', icon: Clock };
    }
  };

  const assignedServiceName =
    assignment && typeof assignment.counterId.serviceId !== 'string'
      ? assignment.counterId.serviceId.name
      : 'Assigned service';

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Queue Management
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Live agent control center
        </p>
      </motion.div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-premium">
        <div className="flex items-center gap-2 mb-4">
          {isAgent ? (
            <Link2 className="w-5 h-5 text-indigo-600" />
          ) : (
            <Settings2 className="w-5 h-5 text-indigo-600" />
          )}
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            {isAgent ? 'Your counter assignment' : 'Counter configuration'}
          </h3>
        </div>

        {configLoading ? (
          <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ) : isAgent ? (
          assignment ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                  Service
                </p>
                <p className="font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {assignedServiceName}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                  Counter
                </p>
                <p className="font-bold text-gray-900 dark:text-gray-100 mt-1">
                  #{assignment.counterId.number} — {assignment.counterId.name}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <p className="font-bold">No active counter assignment</p>
              <p className="text-sm mt-1">
                Ask an administrator to assign your agent account to a counter before calling tickets.
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                Service
              </span>
              <select
                value={selectedServiceId}
                onChange={(event) => setSelectedServiceId(event.target.value)}
                className="form-input"
              >
                {services.length === 0 && <option value="">No active services</option>}
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                Counter
              </span>
              <select
                value={selectedCounterId}
                onChange={(event) => setSelectedCounterId(event.target.value)}
                disabled={!selectedServiceId || serviceCounters.length === 0}
                className="form-input disabled:opacity-50"
              >
                {serviceCounters.length === 0 && (
                  <option value="">No active counter for this service</option>
                )}
                {serviceCounters.map((counter) => (
                  <option key={counter._id} value={counter._id}>
                    #{counter.number} — {counter.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-premium"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.boxClass}`}>
                  <Icon className={`w-6 h-6 ${stat.iconClass}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-premium"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            Check-in User
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={qrToken}
              onChange={(event) => setQrToken(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCheckIn();
              }}
              placeholder="Scan or paste QR token..."
              className="form-input"
            />
            <button
              onClick={handleCheckIn}
              disabled={isLoading || !qrToken.trim()}
              className="bg-gray-900 dark:bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : 'Check In'}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-premium flex flex-col justify-center"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5" /> Call Next
          </h3>
          <button
            onClick={handleCallNext}
            disabled={!selectedCounterId || waitingCount === 0}
            className="w-full bg-white text-indigo-600 px-6 py-3.5 rounded-xl font-bold disabled:opacity-60"
          >
            Call Next Ticket
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-premium overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Today's Queue
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <AnimatePresence>
            {queue.length === 0 ? (
              <div className="p-16 text-center">
                <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  No one in queue
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Checked-in users for this service will appear here
                </p>
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
                    transition={{ delay: index * 0.03 }}
                    className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          #{entry.position}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                          {entry.appointmentId?.ticketNumber}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {entry.appointmentId?.userId?.firstName} · {entry.appointmentId?.timeSlot}
                          {entry.counterId?.number ? ` · Counter ${entry.counterId.number}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${config.bg} ${config.text}`}>
                        <Icon className="w-4 h-4" /> {entry.status}
                      </span>
                      {entry.status === 'CALLED' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(entry._id, 'start')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => handleAction(entry._id, 'absent')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                          >
                            Absent
                          </button>
                        </div>
                      )}
                      {entry.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleAction(entry._id, 'finish')}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
                        >
                          Finish
                        </button>
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
