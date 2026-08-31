import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MonitorCog, Pencil, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createCounter,
  deleteCounter,
  getCounters,
  updateCounter,
  type Counter,
  type CounterStatus,
} from '../api/countersApi';
import { getServices, type Service } from '../api/servicesApi';

export default function Counters() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Counter | null>(null);
  const [name, setName] = useState('');
  const [number, setNumber] = useState(1);
  const [serviceId, setServiceId] = useState('');
  const [status, setStatus] = useState<CounterStatus>('ACTIVE');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [counterData, serviceData] = await Promise.all([
        getCounters(),
        getServices(),
      ]);
      setCounters(counterData);
      setServices(serviceData.filter((service) => service.isActive));
    } catch {
      toast.error('Failed to load counters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setNumber(Math.max(1, ...counters.map((counter) => counter.number + 1)));
    setServiceId(services[0]?._id ?? '');
    setStatus('ACTIVE');
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (counter: Counter) => {
    const currentServiceId =
      typeof counter.serviceId === 'string'
        ? counter.serviceId
        : counter.serviceId._id;
    setEditing(counter);
    setName(counter.name);
    setNumber(counter.number);
    setServiceId(currentServiceId);
    setStatus(counter.status);
    setModalOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !serviceId) {
      toast.error('Name and service are required');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateCounter(editing._id, {
          name: name.trim(),
          serviceId,
          status,
        });
        toast.success('Counter updated');
      } else {
        await createCounter({ name: name.trim(), number, serviceId });
        toast.success('Counter created');
      }
      setModalOpen(false);
      await loadData();
    } catch (error: any) {
      const message = error.response?.data?.message;
      toast.error(Array.isArray(message) ? message[0] : message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (counter: Counter) => {
    if (!window.confirm(`Delete counter #${counter.number} — ${counter.name}?`)) {
      return;
    }

    try {
      await deleteCounter(counter._id);
      toast.success('Counter deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const serviceName = (counter: Counter) =>
    typeof counter.serviceId === 'string'
      ? services.find((service) => service._id === counter.serviceId)?.name ?? 'Service'
      : counter.serviceId.name;

  if (loading) {
    return <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Counters
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Connect physical service counters to the services they handle.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={services.length === 0}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus className="w-5 h-5" /> Add counter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {counters.map((counter, index) => (
          <motion.div
            key={counter._id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-premium"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <MonitorCog className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Counter #{counter.number}
                  </p>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    {counter.name}
                  </h3>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  counter.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : counter.status === 'MAINTENANCE'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {counter.status}
              </span>
            </div>

            <div className="mt-5 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Service</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {serviceName(counter)}
              </p>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => openEdit(counter)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => remove(counter)}
                className="p-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {counters.length === 0 && (
        <div className="p-14 text-center rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <MonitorCog className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="font-bold text-gray-900 dark:text-gray-100">No counters configured</p>
          <p className="text-sm text-gray-500 mt-1">Create a service counter to support the live queue.</p>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => !saving && setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-50 overflow-y-auto overscroll-contain p-4 pointer-events-none"
            >
              <form
                onSubmit={save}
                className="pointer-events-auto relative mx-auto my-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {editing ? 'Edit counter' : 'Create counter'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {editing ? `Counter #${editing.number}` : 'Set the counter number and service.'}
                    </p>
                  </div>
                  <button type="button" onClick={() => setModalOpen(false)} className="p-2 text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name</span>
                  <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} required />
                </label>

                {!editing && (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Counter number</span>
                    <input className="form-input" type="number" min={1} value={number} onChange={(event) => setNumber(Number(event.target.value))} required />
                  </label>
                )}

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Service</span>
                  <select className="form-input" value={serviceId} onChange={(event) => setServiceId(event.target.value)} required>
                    {services.map((service) => (
                      <option key={service._id} value={service._id}>{service.name}</option>
                    ))}
                  </select>
                </label>

                {editing && (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</span>
                    <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value as CounterStatus)}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </label>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                    Cancel
                  </button>
                  <button disabled={saving} type="submit" className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save counter'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
