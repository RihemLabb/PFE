import api from './axios';

export type StaffRole = 'AGENT' | 'SUPERVISOR';

export interface StaffUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateStaffPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: StaffRole;
}

export const getStaff = async (): Promise<StaffUser[]> => {
  const { data } = await api.get('/users/staff');
  return data;
};

export const getAgents = async (): Promise<StaffUser[]> => {
  const { data } = await api.get('/users/agents');
  return data;
};

export const createStaff = async (
  payload: CreateStaffPayload,
): Promise<StaffUser> => {
  const { data } = await api.post('/users/staff', payload);
  return data;
};

export const setStaffActive = async (
  id: string,
  isActive: boolean,
): Promise<StaffUser> => {
  const { data } = await api.patch(`/users/${id}/status`, { isActive });
  return data;
};
