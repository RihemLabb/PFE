import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  FileText,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createService,
  deleteService,
  getServices,
  updateService,
  type Service,
  type ServicePayload,
} from '../api/servicesApi';

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const defaultForm: ServicePayload = {
  name: '',
  description: '',
  avgDuration: 15,
  slotDuration: 15,
  maxCapacityPerSlot: 1,
  absenceDelayMinutes: 15,
  requiredDocs: [],
  openingTime: '09:00',
  closingTime: '17:00',
  workingDays: [1, 2, 3, 4, 5],
  isActive: true,
};

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServicePayload>(defaultForm);
  const [documentsText, setDocumentsText] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const data = await getServices();
      setServices(data);
    } catch {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingService(null);
    setForm({ ...defaultForm });
    setDocumentsText('');
    setFormOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description || '',
      avgDuration: service.avgDuration,
      slotDuration: service.slotDuration,
      maxCapacityPerSlot: service.maxCapacityPerSlot,
      absenceDelayMinutes: service.absenceDelayMinutes ?? 15,
      requiredDocs: service.requiredDocs ?? [],
      openingTime: service.openingTime || '09:00',
      closingTime: service.closingTime || '17:00',
      workingDays: service.workingDays?.length
        ? service.workingDays
        : [1, 2, 3, 4, 5],
      isActive: service.isActive,
    });
    setDocumentsText((service.requiredDocs ?? []).join('\n'));
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingService(null);
  };

  const toggleWorkingDay = (day: number) => {
    const current = form.workingDays ?? [];
    setForm({
      ...form,
      workingDays: current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day],
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const requiredDocs = documentsText
      .split(/\n|,/)
      .map((document) => document.trim())
      .filter(Boolean);

    const payload: ServicePayload = {
      ...form,
      name: form.name.trim(),
      description: form.description?.trim(),
      requiredDocs,
    };

    if (!payload.name) {
      toast.error('Service name is required');
      return;
    }

    if (!payload.workingDays?.length) {
      toast.error('Select at least one working day');
      return;
    }

    setSaving(true);
    try {
      if (editingService) {
        await updateService(editingService._id, payload);
        toast.success('Service updated');
      } else {
        await createService(payload);
        toast.success('Service created');
      }
      closeForm();
      await fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message;
      toast.error(Array.isArray(message) ? message[0] : message || 'Save failed');
    } finally {
      setSaving(false);
      setFormOpen(false);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await updateService(service._id, { isActive: !service.isActive });
      toast.success(service.isActive ? 'Service disabled' : 'Service enabled');
      await fetchData();
    } catch {
      toast.error('Could not update service status');
    }
  };

  const handleDelete = async (service: Service) => {
    if (
      !window.confirm(
        `Delete “${service.name}”? Consider disabling it instead if it has historical appointments.`,
      )
    ) {
      return;
    }

    try {
      await deleteService(service._id);
      toast.success('Service deleted');
      await fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not delete service');
    }
  };

  if (loading) {
    return <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Services
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Configure service capacity, required documents, and appointment schedules.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-colors"
        >
          <Plus className="w-5 h-5" /> Add service
        </button>
      </motion.div>

      {services.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-16 text-center shadow-premium">
          <Settings className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No services configured
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">
            Create your first service to start accepting appointments.
          </p>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold"
          >
            Create service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-premium"
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <button
                  onClick={() => handleToggleActive(service)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    service.isActive
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {service.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {service.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 min-h-10 line-clamp-2 leading-relaxed">
                {service.description || 'No description'}
              </p>

              <div className="grid grid-cols-3 gap-3 py-5 my-5 border-y border-gray-100 dark:border-gray-800">
                <Metric icon={Clock} label="Duration" value={`${service.avgDuration}m`} />
                <Metric icon={Clock} label="Slot" value={`${service.slotDuration}m`} />
                <Metric
                  icon={Users}
                  label="Capacity"
                  value={String(service.maxCapacityPerSlot)}
                />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <CalendarDays className="w-4 h-4" />
                  <span>
                    {service.openingTime || '09:00'}–{service.closingTime || '17:00'} ·{' '}
                    {formatWorkingDays(service.workingDays)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>No-show grace period: {service.absenceDelayMinutes ?? 15} min</span>
                </div>
                <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                  <FileText className="w-4 h-4 mt-0.5" />
                  <span>
                    {service.requiredDocs?.length
                      ? `${service.requiredDocs.length} required document${service.requiredDocs.length === 1 ? '' : 's'}`
                      : 'No required documents'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => openEdit(service)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(service)}
                  className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  aria-label={`Delete ${service.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={closeForm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="fixed inset-x-4 top-8 bottom-8 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-y-auto border border-gray-200 dark:border-gray-800"
            >
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {editingService ? 'Edit service' : 'Create service'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      These settings drive mobile availability and booking capacity.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Service name" className="md:col-span-2">
                    <input
                      required
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      className="form-input"
                      placeholder="Passport renewal"
                    />
                  </Field>

                  <Field label="Description" className="md:col-span-2">
                    <textarea
                      value={form.description ?? ''}
                      onChange={(event) =>
                        setForm({ ...form, description: event.target.value })
                      }
                      className="form-input min-h-24 resize-y"
                      placeholder="Describe what the service is for"
                    />
                  </Field>

                  <Field label="Average processing time (min)">
                    <input
                      type="number"
                      min={1}
                      required
                      value={form.avgDuration}
                      onChange={(event) =>
                        setForm({ ...form, avgDuration: Number(event.target.value) })
                      }
                      className="form-input"
                    />
                  </Field>

                  <Field label="Appointment slot duration (min)">
                    <input
                      type="number"
                      min={5}
                      required
                      value={form.slotDuration}
                      onChange={(event) =>
                        setForm({ ...form, slotDuration: Number(event.target.value) })
                      }
                      className="form-input"
                    />
                  </Field>

                  <Field label="Capacity per slot">
                    <input
                      type="number"
                      min={1}
                      required
                      value={form.maxCapacityPerSlot}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          maxCapacityPerSlot: Number(event.target.value),
                        })
                      }
                      className="form-input"
                    />
                  </Field>

                  <Field label="Absence grace period (min)">
                    <input
                      type="number"
                      min={0}
                      max={240}
                      step={1}
                      required
                      value={form.absenceDelayMinutes ?? 15}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          absenceDelayMinutes: Number(event.target.value),
                        })
                      }
                      className="form-input"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Opening time">
                      <input
                        type="time"
                        required
                        value={form.openingTime}
                        onChange={(event) =>
                          setForm({ ...form, openingTime: event.target.value })
                        }
                        className="form-input"
                      />
                    </Field>
                    <Field label="Closing time">
                      <input
                        type="time"
                        required
                        value={form.closingTime}
                        onChange={(event) =>
                          setForm({ ...form, closingTime: event.target.value })
                        }
                        className="form-input"
                      />
                    </Field>
                  </div>

                  <Field label="Working days" className="md:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((day) => {
                        const selected = form.workingDays?.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleWorkingDay(day.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                              selected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <Field label="Required documents" className="md:col-span-2">
                    <textarea
                      value={documentsText}
                      onChange={(event) => setDocumentsText(event.target.value)}
                      className="form-input min-h-28 resize-y"
                      placeholder={'One document per line\nNational ID card\nOld passport'}
                    />
                  </Field>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingService ? 'Save changes' : 'Create service'}
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

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <Icon className="w-4 h-4 text-gray-400 mb-1" />
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function Field({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function formatWorkingDays(days?: number[]) {
  if (!days?.length) return 'Mon–Fri';
  const labels = WEEKDAYS.filter((day) => days.includes(day.value)).map(
    (day) => day.label,
  );
  return labels.join(', ');
}
