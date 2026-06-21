import api from './axios';

export interface Service {
  _id: string;
  name: string;
  description: string;
  avgDuration: number;
  slotDuration: number;
  maxCapacityPerSlot: number;
  isActive: boolean;
}

export const getServices = async (): Promise<Service[]> => {
  const { data } = await api.get('/services');
  return data;
};