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
  avatarUrl?: string | null;
};

export type UpdateProfileRequest = {
  displayName?: string;
  bio?: string;
  contact?: ContactInfo;
};

export function getMyProfile(authToken?: string) {
  return request<UserProfile>('/profile/me', {
    authToken,
  });
}

export function updateMyProfile(payload: UpdateProfileRequest) {
  return request<{ profile: UserProfile; message: string }>('/profile/me', {
    method: 'PUT',
    data: payload,
  });
}

export function searchProfiles(query: string) {
  return request<UserProfile[]>(`/profile/search?query=${encodeURIComponent(query)}`);
}

export function getProfileByUserId(userId: string) {
  return request<UserProfile>(`/profile/${userId}`);
}

export function deleteProfileByAdmin(userId: string) {
  return request<void>(`/profile/admin/${userId}`, {
    method: 'DELETE',
  });
}

export function deleteMyProfile() {
  return request<void>('/profile/me', {
    method: 'DELETE',
  });
}