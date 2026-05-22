import { request } from './client';

export type UserRole = 'Unauthorized' | 'User' | 'Artist' | 'Admin';

export type RoleEntry = {
  id: string;
  userId: string;
  role: UserRole;
  assignedBy?: string | null;
  assignedAt: string;
};

export type AssignRoleRequest = {
  role: UserRole;
  assignedBy?: string | null;
};

export function getRoleByUserId(userId: string) {
  return request<RoleEntry>(`/api/role/${userId}`);
}

export function assignRole(userId: string, payload: AssignRoleRequest) {
  return request<RoleEntry>(`/api/role/${userId}/assign`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteRole(userId: string) {
  return request<void>(`/api/role/${userId}`, {
    method: 'DELETE',
  });
}

export function getUsersByRole(role: UserRole) {
  return request<RoleEntry[]>(`/api/role/by-role/${role}`);
}