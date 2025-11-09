import api from '@/lib/api';
import { Group, PaginatedResponse } from '@/types';

export const groupService = {
  async create(data: { name: string; description?: string; parentGroupId?: string }) {
    const response = await api.post('/groups', data);
    return response.data.group as Group;
  },

  async list(params?: { page?: number; limit?: number; search?: string }) {
    const response = await api.get<PaginatedResponse<Group>>('/groups', { params });
    return response.data;
  },

  async get(id: string) {
    const response = await api.get(`/groups/${id}`);
    return response.data.group as Group;
  },

  async update(id: string, data: { name?: string; description?: string }) {
    const response = await api.patch(`/groups/${id}`, data);
    return response.data.group as Group;
  },

  async delete(id: string) {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  },

  async addMember(groupId: string, userId: string) {
    const response = await api.post(`/groups/${groupId}/members`, { userId });
    return response.data.group as Group;
  },

  async removeMember(groupId: string, userId: string) {
    const response = await api.delete(`/groups/${groupId}/members`, { data: { userId } });
    return response.data.group as Group;
  },

  async inviteMembers(groupId: string, emails: string[]) {
    const response = await api.post(`/groups/${groupId}/invite`, { emails });
    return response.data;
  },

  async getSubgroups(parentId: string) {
    const response = await api.get(`/groups/${parentId}/subgroups`);
    return response.data.subgroups as Group[];
  }
};
