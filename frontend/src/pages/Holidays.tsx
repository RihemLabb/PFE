import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Clock3, Pencil, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createHoliday,
  deleteHoliday,
  getHolidays,
  updateHoliday,
  type Holiday,
} from '../api/holidaysApi';
import { getServices, type Service } from '../api/servicesApi';

export default function Holidays() {
  const [items, setItems] = useState<Holiday[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [isClosed, setIsClosed] = useState(true);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('17:00');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [holidayData, serviceData] = await Promise.all([
        getHolidays(),
        getServices(),
      ]);
      setItems(holidayData);
      setServices(serviceData.filter((service) => service.isActive));
    } catch {
      toast.error('Failed to load schedule exceptions');
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
    setDate('');
    setServiceId('');
    setIsClosed(true);
    setOpeningTime('09:00');
    setClosingTime('17:00');
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (item: Holiday) => {
    setEditing(item);
    setName(item.name);
    setDate(item.date.slice(0, 10));
    setServiceId(
      typeof item.serviceId === 'string'
        ? item.serviceId
        : item.serviceId?._id ?? '',
    );
    setIsClosed(item.isClosed);
    setOpeningTime(item.openingTime ?? '09:00');
    setClosingTime(item.closingTime ?? '17:00');
    setModalOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !date) {
      toast.error('Name and date are required');
      return;
    }
    if (!isClosed && !serviceId) {
      toast.error('Special opening hours must target a service');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        date,
        serviceId: serviceId || null,
        isClosed,
        openingTime: isClosed ? undefined : openingTime,
        closingTime: isClosed ? undefined : closingTime,
      };
      if (editing) {
        await updateHoliday(editing._id, payload);
        toast.success('Schedule exception updated');
      } else {
        await createHoliday(payload);
        toast.success('Schedule exception created');
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

  const remove = async (item: Holiday) => {
    if (!window.confirm(`Delete schedule exception “${item.name}”?`)) return;
    try {
      await deleteHoliday(item._id);
      toast.success('Schedule exception deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const scopeLabel = (item: Holiday) => {
    if (!item.serviceId) return 'All services';
    if (typeof item.serviceId === 'string') {
      return services.find((service) => service._id === item.serviceId)?.name ?? 'Service';
    }
    return item.serviceId.name;
  };

  if (loading) {
    return <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Holidays & Exceptions
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Close all services for a holiday or override one service with special hours.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" /> Add exception
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {items.map((item, index) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-premium"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(item.date).toLocaleDateString()} · {scopeLabel(item)}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  item.isClosed
                    ? 'bg-red-50 text-red-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {item.isClosed ? 'CLOSED' : 'SPECIAL HOURS'}
              </span>
            </div>

            {!item.isClosed && (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <Clock3 className="w-4 h-4" /> {item.openingTime} – {item.closingTime}
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => openEdit(item)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => remove(item)}
                className="p-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="p-14 text-center rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="font-bold text-gray-900 dark:text-gray-100">No exceptions configured</p>
          <p className="text-sm text-gray-500 mt-1">Regular service schedules are currently in effect.</p>
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
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%_-_2rem)] max-w-xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl"
            >
              <form onSubmit={save} className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {editing ? 'Edit exception' : 'Create exception'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Global closures or service-specific special hours.</p>
                  </div>
                  <button type="button" onClick={() => setModalOpen(false)} className="p-2 text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block space-y-2 sm:col-span-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name</span>
                    <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} required />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Date</span>
                    <input className="form-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Scope</span>
                    <select
                      className="form-input"
                      value={serviceId}
                      onChange={(event) => {
                        setServiceId(event.target.value);
                        if (!event.target.value) setIsClosed(true);
                      }}
                    >
                      <option value="">All services</option>
                      {services.map((service) => (
                        <option key={service._id} value={service._id}>{service.name}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Exception type</span>
                  <select
                    className="form-input"
                    value={isClosed ? 'closed' : 'open'}
                    onChange={(event) => setIsClosed(event.target.value === 'closed')}
                    disabled={!serviceId}
                  >
                    <option value="closed">Closed</option>
                    {serviceId && <option value="open">Special opening hours</option>}
                  </select>
                </label>

                {!isClosed && (
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Opening</span>
                      <input className="form-input" type="time" value={openingTime} onChange={(event) => setOpeningTime(event.target.value)} required />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Closing</span>
                      <input className="form-input" type="time" value={closingTime} onChange={(event) => setClosingTime(event.target.value)} required />
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                    Cancel
                  </button>
                  <button disabled={saving} type="submit" className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save exception'}
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
