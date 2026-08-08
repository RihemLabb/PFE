import api from './axios';

export interface CounterServiceRef {
  _id: string;
  name: string;
}

export type CounterStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export interface Counter {
  _id: string;
  name: string;
  number: number;
  status: CounterStatus;
  serviceId: CounterServiceRef | string;
}

export interface CounterPayload {
  name: string;
  number: number;
  serviceId: string;
}

export const getCounters = async (): Promise<Counter[]> => {
  const { data } = await api.get('/counters');
  return data;
};

export const createCounter = async (
  payload: CounterPayload,
): Promise<Counter> => {
  const { data } = await api.post('/counters', payload);
  return data;
};

export const updateCounter = async (
  id: string,
  payload: Partial<Pick<Counter, 'name' | 'status'>> & { serviceId?: string },
): Promise<Counter> => {
  const { data } = await api.put(`/counters/${id}`, payload);
  return data;
};

export const deleteCounter = async (id: string) => {
  const { data } = await api.delete(`/counters/${id}`);
  return data;
};
