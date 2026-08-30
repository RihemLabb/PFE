import api from './axios';
import type { Counter } from './countersApi';
import type { StaffUser } from './staffApi';

export interface AgentAssignment {
  _id: string;
  agentId: StaffUser;
  counterId: Counter;
  date: string;
  isActive: boolean;
}

export const getAgentAssignments = async (): Promise<AgentAssignment[]> => {
  const { data } = await api.get('/agent-assignments');
  return data;
};

export const getMyAgentAssignment = async (): Promise<AgentAssignment | null> => {
  const { data } = await api.get('/agent-assignments/me');
  return data;
};

export const assignAgent = async (
  agentId: string,
  counterId: string,
): Promise<AgentAssignment> => {
  const { data } = await api.post('/agent-assignments', {
    agentId,
    counterId,
  });
  return data;
};

export const unassignAgent = async (id: string) => {
  const { data } = await api.delete(`/agent-assignments/${id}`);
  return data;
};
