import api from './axios';

export interface Holiday {
  _id: string;
  name: string;
  date: string;
  serviceId?: string | { _id: string; name: string } | null;
  isClosed: boolean;
  openingTime?: string;
  closingTime?: string;
}

export interface HolidayPayload {
  name: string;
  date: string;
  serviceId?: string | null;
  isClosed?: boolean;
  openingTime?: string;
  closingTime?: string;
}

export const getHolidays = async (): Promise<Holiday[]> => {
  const { data } = await api.get('/holidays');
  return data;
};

export const createHoliday = async (
  payload: HolidayPayload,
): Promise<Holiday> => {
  const { data } = await api.post('/holidays', payload);
  return data;
};

export const updateHoliday = async (
  id: string,
  payload: Partial<HolidayPayload>,
): Promise<Holiday> => {
  const { data } = await api.put(`/holidays/${id}`, payload);
  return data;
};

export const deleteHoliday = async (id: string) => {
  const { data } = await api.delete(`/holidays/${id}`);
  return data;
};
