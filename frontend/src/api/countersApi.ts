import api from './axios';

export interface CounterServiceRef {
  _id: string;
  name: string;
}

export interface Counter {
  _id: string;
  name: string;
  number: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  serviceId: CounterServiceRef | string;
}

export const getCounters = async (): Promise<Counter[]> => {
  const { data } = await api.get('/counters');
  return data;
};
