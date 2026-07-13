import api from './axios';

export interface Appointment {
  _id: string;
  ticketNumber: string;
  date: string;
  timeSlot: string;
  status: string;
  serviceId: { name: string };
  userId: { firstName: string; lastName: string };
}

export interface QueueEntry {
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

export const getAppointments = async (): Promise<Appointment[]> => {
  const { data } = await api.get('/appointments');
  return data;
};

export const getTodayQueue = async (serviceId: string): Promise<QueueEntry[]> => {
  const { data } = await api.get(`/queue/today?serviceId=${serviceId}`);
  return data;
};

export const checkInUser = async (qrToken: string) => {
  const { data } = await api.post('/queue/checkin', { qrToken });
  return data;
};

export const callNextTicket = async (serviceId: string, counterId: string) => {
  const { data } = await api.post('/queue/next', { serviceId, counterId });
  return data;
};

export const startService = async (queueEntryId: string) => {
  const { data } = await api.post(`/queue/${queueEntryId}/start`);
  return data;
};

export const finishService = async (queueEntryId: string) => {
  const { data } = await api.post(`/queue/${queueEntryId}/finish`);
  return data;
};

export const markAbsent = async (queueEntryId: string) => {
  const { data } = await api.post(`/queue/${queueEntryId}/absent`);
  return data;
};