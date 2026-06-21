import { useEffect, useState } from 'react';
import { getTodayQueue, checkInUser, callNextTicket, startService, finishService } from '../api/appointmentsApi';

interface QueueEntry {
  _id: string;
  position: number;
  status: string;
  ticketNumber: string;
  appointmentId: { 
    timeSlot: string; 
    ticketNumber: string;
    userId: { firstName: string } 
  };
}

export default function Queue() {
  const SERVICE_ID = '6a317c8bafb66ea0ed0cf513'; 
  const COUNTER_ID = '6a317c8cafb66ea0ed0cf515'; 

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [qrToken, setQrToken] = useState('');
  const [message, setMessage] = useState('');

  const fetchQueue = async () => {
    try {
      const data = await getTodayQueue(SERVICE_ID);
      setQueue(data);
    } catch (error) {
      console.error('Failed to fetch queue', error);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleCheckIn = async () => {
    if (!qrToken) return;
    try {
      const res = await checkInUser(qrToken);
      setMessage(`Success! ${res.ticketNumber} is now at position ${res.position}`);
      setQrToken('');
      fetchQueue();
    } catch (err: any) {
      setMessage(`Error: ${err.response?.data?.message || 'Check-in failed'}`);
    }
  };

  const handleCallNext = async () => {
    try {
      await callNextTicket(SERVICE_ID, COUNTER_ID);
      setMessage('Next ticket called successfully!');
      fetchQueue();
    } catch (err: any) {
      setMessage(`Error: ${err.response?.data?.message || 'Call next failed'}`);
    }
  };

  const handleStart = async (id: string) => {
    await startService(id);
    fetchQueue();
  };

  const handleFinish = async (id: string) => {
    await finishService(id);
    fetchQueue();
  };

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Agent Dashboard</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">1. Check-in User (Scan QR / Paste Token)</h3>
          <div className="flex gap-4">
            <input 
              type="text" 
              value={qrToken} 
              onChange={(e) => setQrToken(e.target.value)}
              placeholder="Paste QR Token here..." 
              className="flex-1 border rounded p-2"
            />
            <button onClick={handleCheckIn} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
              Check In
            </button>
          </div>
          {message && <p className="mt-3 text-sm text-blue-600 font-medium">{message}</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-center">
          <h3 className="text-lg font-semibold mb-4">2. Call Next Ticket</h3>
          <button onClick={handleCallNext} className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 text-lg font-bold">
            Call Next
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">Today's Queue</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {queue.length === 0 && <p className="text-gray-500">No one is in the queue.</p>}
          {queue.map((entry) => (
            <div key={entry._id} className={`p-4 rounded-lg border-l-4 ${
              entry.status === 'WAITING' ? 'bg-yellow-50 border-yellow-500' : 
              entry.status === 'CALLED' ? 'bg-blue-50 border-blue-500' : 
              entry.status === 'IN_PROGRESS' ? 'bg-purple-50 border-purple-500' : 'bg-green-50 border-green-500'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold text-gray-800">#{entry.position}</span>
                <span className="px-2 py-1 text-xs font-bold rounded-full bg-white shadow-sm">
                  {entry.status}
                </span>
              </div>
              <p className="font-medium text-gray-700">{entry.appointmentId?.ticketNumber}</p>
              <p className="text-sm text-gray-500 mb-3">User: {entry.appointmentId?.userId?.firstName}</p>
              
              <div className="flex gap-2">
                {entry.status === 'WAITING' && (
                  <span className="text-xs text-gray-400 italic">Waiting to be called...</span>
                )}
                {entry.status === 'CALLED' && (
                  <button onClick={() => handleStart(entry._id)} className="flex-1 bg-purple-600 text-white text-sm py-1 rounded hover:bg-purple-700">
                    Start Service
                  </button>
                )}
                {entry.status === 'IN_PROGRESS' && (
                  <button onClick={() => handleFinish(entry._id)} className="flex-1 bg-green-600 text-white text-sm py-1 rounded hover:bg-green-700">
                    Finish
                  </button>
                )}
                {entry.status === 'FINISHED' && (
                  <span className="text-xs text-green-600 font-bold">Completed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}