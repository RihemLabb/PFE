import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Link2,
  Plus,
  ShieldCheck,
  UserCog,
  UserRoundCheck,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createStaff,
  getStaff,
  setStaffActive,
  type StaffRole,
  type StaffUser,
} from '../api/staffApi';
import { getCounters, type Counter } from '../api/countersApi';
import {
  assignAgent,
  getAgentAssignments,
  unassignAgent,
  type AgentAssignment,
} from '../api/agentAssignmentsApi';

export default function Staff() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [assignments, setAssignments] = useState<AgentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<StaffRole>('AGENT');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedCounterId, setSelectedCounterId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [staffData, counterData, assignmentData] = await Promise.all([
        getStaff(),
        getCounters(),
        getAgentAssignments(),
      ]);
      setStaff(staffData);
      setCounters(counterData);
      setAssignments(assignmentData);
    } catch {
      toast.error('Failed to load staff configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeAgents = useMemo(
    () => staff.filter((user) => user.role === 'AGENT' && user.isActive),
    [staff],
  );

  const activeCounters = useMemo(
    () => counters.filter((counter) => counter.status === 'ACTIVE'),
    [counters],
  );

  useEffect(() => {
    if (!activeAgents.some((agent) => agent._id === selectedAgentId)) {
      setSelectedAgentId(activeAgents[0]?._id ?? '');
    }
    if (!activeCounters.some((counter) => counter._id === selectedCounterId)) {
      setSelectedCounterId(activeCounters[0]?._id ?? '');
    }
  }, [activeAgents, activeCounters, selectedAgentId, selectedCounterId]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createStaff({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      toast.success(`${role === 'AGENT' ? 'Agent' : 'Supervisor'} created`);
      setCreateOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('password123');
      setRole('AGENT');
      await loadData();
    } catch (error: any) {
      const message = error.response?.data?.message;
      toast.error(Array.isArray(message) ? message[0] : message || 'Creation failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: StaffUser) => {
    try {
      await setStaffActive(user._id, !user.isActive);
      toast.success(user.isActive ? 'Staff account disabled' : 'Staff account enabled');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Status update failed');
    }
  };

  const handleAssign = async () => {
    if (!selectedAgentId || !selectedCounterId) {
      toast.error('Select an agent and counter');
      return;
    }

    setSaving(true);
    try {
      await assignAgent(selectedAgentId, selectedCounterId);
      toast.success('Agent assigned to counter');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Assignment failed');
    } finally {
      setSaving(false);
    }
  };

  const endAssignment = async (assignment: AgentAssignment) => {
    try {
      await unassignAgent(assignment._id);
      toast.success('Assignment ended');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not end assignment');
    }
  };

  const counterLabel = (counter: Counter) => {
    const service =
      typeof counter.serviceId === 'string' ? null : counter.serviceId;
    return `#${counter.number} — ${counter.name}${service?.name ? ` · ${service.name}` : ''}`;
  };

  if (loading) {
    return <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Staff & Assignments
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Create agents and supervisors, then connect agents to service counters.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" /> Add staff
        </button>
      </div>

      <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-premium overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <UserCog className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Staff accounts</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Agent and supervisor access to the staff portal.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Action'].map((heading) => (
                  <th key={heading} className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-500 font-bold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {staff.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                      user.role === 'SUPERVISOR'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {user.role === 'SUPERVISOR' ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserRoundCheck className="w-3.5 h-3.5" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${user.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(user)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                        user.isActive
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {user.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-premium p-6">
        <div className="flex items-center gap-3 mb-5">
          <Link2 className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Counter assignments</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              One active assignment per agent and per counter.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mb-6">
          <select
            className="form-input"
            value={selectedAgentId}
            onChange={(event) => setSelectedAgentId(event.target.value)}
          >
            {activeAgents.length === 0 && <option value="">No active agents</option>}
            {activeAgents.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.firstName} {agent.lastName}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            value={selectedCounterId}
            onChange={(event) => setSelectedCounterId(event.target.value)}
          >
            {activeCounters.length === 0 && <option value="">No active counters</option>}
            {activeCounters.map((counter) => (
              <option key={counter._id} value={counter._id}>
                {counterLabel(counter)}
              </option>
            ))}
          </select>

          <button
            onClick={handleAssign}
            disabled={saving || !selectedAgentId || !selectedCounterId}
            className="px-5 py-3 rounded-xl bg-gray-900 dark:bg-indigo-600 text-white font-bold disabled:opacity-50"
          >
            Assign
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => (
            <motion.div
              key={assignment._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {assignment.agentId.firstName} {assignment.agentId.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {counterLabel(assignment.counterId)}
                </p>
              </div>
              <button
                onClick={() => endAssignment(assignment)}
                className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50"
              >
                End
              </button>
            </motion.div>
          ))}
        </div>

        {assignments.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-6">No active agent assignments.</p>
        )}
      </section>

      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => !saving && setCreateOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%_-_2rem)] max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl"
            >
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create staff account</h3>
                    <p className="text-sm text-gray-500 mt-1">Agents operate counters; supervisors monitor performance.</p>
                  </div>
                  <button type="button" onClick={() => setCreateOpen(false)} className="p-2 text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input className="form-input" placeholder="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
                  <input className="form-input" placeholder="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
                </div>
                <input className="form-input" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                <input className="form-input" type="password" minLength={6} placeholder="Temporary password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <select className="form-input" value={role} onChange={(event) => setRole(event.target.value as StaffRole)}>
                  <option value="AGENT">Agent</option>
                  <option value="SUPERVISOR">Supervisor</option>
                </select>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50">
                    {saving ? 'Creating...' : 'Create account'}
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
