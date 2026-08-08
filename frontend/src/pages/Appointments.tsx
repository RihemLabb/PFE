import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Briefcase, Clock, FileText, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAppointments } from '../api/appointmentsApi';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

interface Appointment {
  _id: string;
  ticketNumber: string;
  date: string;
  timeSlot: string;
  status: string;
  serviceId: { name: string };
  userId: { firstName: string; lastName: string };
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'FINISHED': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    case 'IN_PROGRESS': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  }
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAppointments();
        setAppointments(data);
      } catch {
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const getExportData = () => {
    return appointments.map(appt => ({
      Ticket: appt.ticketNumber,
      User: `${appt.userId?.firstName || ''} ${appt.userId?.lastName || ''}`.trim(),
      Service: appt.serviceId?.name || 'N/A',
      Date: new Date(appt.date).toLocaleDateString(),
      Time: appt.timeSlot,
      Status: appt.status
    }));
  };

  const handleExportPDF = () => {
    exportToPDF(getExportData(), 'appointments_report', 'Queue System - Appointments Report');
    toast.success('PDF exported successfully');
  };

  const handleExportExcel = () => {
    exportToExcel(getExportData(), 'appointments_report');
    toast.success('Excel exported successfully');
  };

  if (loading) return <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Appointments</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Complete history of all scheduled appointments</p>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleExportPDF}
              disabled={appointments.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleExportExcel}
              disabled={appointments.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-premium overflow-hidden"
      >
        {appointments.length === 0 ? (
          <div className="p-16 text-center">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">No appointments yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Appointments will appear here once booked</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  {['Ticket', 'User', 'Service', 'Date & Time', 'Status'].map((header) => (
                    <th key={header} className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {appointments.map((appt, index) => (
                  <motion.tr 
                    key={appt._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">{appt.ticketNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {appt.userId?.firstName} {appt.userId?.lastName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        {appt.serviceId?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{new Date(appt.date).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {appt.timeSlot}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusStyle(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
