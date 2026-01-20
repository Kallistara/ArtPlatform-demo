import api from './axios';

export interface UserRole {
  userId: string;
  role: 'Admin' | 'ContentCreator' | 'User';
  assignedBy?: string;
  assignedAt: string;
}

export interface AssignRoleRequest {
  role: string;
  assignedBy?: string;
}

export const roleApi = {
  getRole: (userId: string) => api.get<UserRole>(`/role/${userId}`),
  assignRole: (userId: string, data: AssignRoleRequest) =>
    api.post(`/role/${userId}/assign`, data),
  removeRole: (userId: string, removedBy?: string) =>
    api.delete(`/role/${userId}`, { params: { removedBy } }),
  getByRole: (role: string) => api.get<UserRole[]>(`/role/by-role/${role}`)
};
