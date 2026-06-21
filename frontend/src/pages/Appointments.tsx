import { useEffect, useState } from 'react';
import { getAppointments } from '../api/appointmentsApi';

interface Appointment {
  _id: string;
  ticketNumber: string;
  date: string;
  timeSlot: string;
  status: string;
  serviceId: { name: string };
  userId: { firstName: string; lastName: string };
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAppointments();
        setAppointments(data);
      } catch (error) {
        console.error('Failed to fetch appointments', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Appointments</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map((appt) => (
              <tr key={appt._id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{appt.ticketNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{appt.userId?.firstName} {appt.userId?.lastName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{appt.serviceId?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{appt.date} at {appt.timeSlot}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                    appt.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {appt.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}