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
  serviceId: string;
  counterId?: {
    _id: string;
    name: string;
    number: number;
  } | null;
  appointmentId: {
    timeSlot: string;
    ticketNumber: string;
    userId: { firstName: string; lastName?: string };
  };
}

export interface PublicQueueEntry {
  _id: string;
  position: number;
  status: 'WAITING' | 'CALLED' | 'IN_PROGRESS';
  ticketNumber: string;
  counterNumber: number | null;
  counterName: string | null;
}

export const getAppointments = async (): Promise<Appointment[]> => {
  const { data } = await api.get('/appointments');
  return data;
};

export const getTodayQueue = async (serviceId: string): Promise<QueueEntry[]> => {
  const { data } = await api.get(`/queue/today?serviceId=${serviceId}`);
  return data;
};

export const getPublicQueueDisplay = async (
  serviceId: string,
): Promise<PublicQueueEntry[]> => {
  const { data } = await api.get(`/queue/display?serviceId=${serviceId}`);
  return data;
};

export interface TicketPreview {
  appointmentId: string;
  ticketNumber: string;
  userName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  status: string;
}

export const checkInUser = async (identifier: {
  qrToken?: string;
  ticketNumber?: string;
}): Promise<QueueEntry> => {
  const { data } = await api.post('/queue/checkin', identifier);
  return data;
};

export const lookupTicket = async (ticketNumber: string): Promise<TicketPreview> => {
  const { data } = await api.post('/queue/ticket-lookup', { ticketNumber });
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
