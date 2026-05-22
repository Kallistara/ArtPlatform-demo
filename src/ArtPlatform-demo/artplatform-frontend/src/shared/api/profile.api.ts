// src/shared/api/profile.api.ts
import { request } from './client';

export type ContactInfo = {
  email?: string | null;
  website?: string | null;
  telegram?: string | null;
  otherContact?: string | null;
};

export type UserProfile = {
  id: string;
  userId: string;
  userName: string;
  displayName: string;
  bio: string;
  contact: ContactInfo;
  createdAt: string;
  updatedAt: string;
  role: 'Unauthorized' | 'User' | 'Artist' | 'Admin';
};

export type UpdateProfileRequest = {
  displayName?: string;
  bio?: string;
  contact?: ContactInfo;
};

export function getMyProfile() {
  return request<UserProfile>('/api/profile/me');
}

export function updateMyProfile(payload: UpdateProfileRequest) {
  return request<{ profile: UserProfile; message: string }>('/api/profile/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function searchProfiles(query: string) {
  return request<UserProfile[]>(`/api/profile/search?query=${encodeURIComponent(query)}`);
}

export function getProfileByUserId(userId: string) {
  return request<UserProfile>(`/api/profile/${userId}`);
}

export function deleteProfileByAdmin(userId: string) {
  return request<void>(`/api/profile/admin/${userId}`, {
    method: 'DELETE',
  });
}