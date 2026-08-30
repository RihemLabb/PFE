import api from './axios';

export interface Service {
  _id: string;
  name: string;
  description: string;
  avgDuration: number;
  slotDuration: number;
  maxCapacityPerSlot: number;
  absenceDelayMinutes: number;
  requiredDocs: string[];
  openingTime: string;
  closingTime: string;
  workingDays: number[];
  isActive: boolean;
}

export interface ServicePayload {
  name: string;
  description?: string;
  avgDuration: number;
  slotDuration: number;
  maxCapacityPerSlot: number;
  absenceDelayMinutes?: number;
  requiredDocs?: string[];
  openingTime?: string;
  closingTime?: string;
  workingDays?: number[];
  isActive?: boolean;
}

export const getServices = async (): Promise<Service[]> => {
  const { data } = await api.get('/services');
  return data;
};

export const createService = async (payload: ServicePayload): Promise<Service> => {
  const { data } = await api.post('/services', payload);
  return data;
};

export const updateService = async (
  id: string,
  payload: Partial<ServicePayload>,
): Promise<Service> => {
  const { data } = await api.put(`/services/${id}`, payload);
  return data;
};

export const deleteService = async (id: string) => {
  const { data } = await api.delete(`/services/${id}`);
  return data;
};
