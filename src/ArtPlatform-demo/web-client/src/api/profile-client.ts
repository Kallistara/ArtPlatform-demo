import api from './axios';

export interface ContactInfo {
  email?: string;
  website?: string;
  telegram?: string;
  otherContact?: string;
}

export interface UserProfile {
  userId: string;
  userName?: string;
  displayName?: string;
  bio?: string;
  contact?: ContactInfo | string;

  creatorStats?: {
    artworksCount?: number;
    totalLikes?: number;
    averageRating?: number;
  };

  userStats?: {
    collectionsCount?: number;
    followingCount?: number;
    followersCount?: number;
  };

  socialStats?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  contact?: ContactInfo | string; 
}

export const profileApi = {
  // --- current user (convenience "me" endpoints) ---
  getMyProfile: () => api.get<UserProfile>('/profile/me'),
  updateMyProfile: (data: UpdateProfileRequest) => api.put('/profile/me', data),
  deleteMyProfile: () => api.delete('/profile/me'),
  patchMyCreatorStats: (stats: any) => api.patch('/profile/me/creator-stats', stats),
  patchMyUserStats: (stats: any) => api.patch('/profile/me/user-stats', stats),
  patchMySocialStats: (stats: any) => api.patch('/profile/me/social-stats', stats),

  // --- by userId (for public profiles / admin) ---
  getProfile: (userId: string) => api.get<UserProfile>(`/profile/${userId}`),
  
  updateProfile: (userId: string, data: UpdateProfileRequest) =>
    api.put(`/profile/${userId}`, data),

  deleteProfile: (userId: string) => api.delete(`/profile/${userId}`),

  searchProfiles: (query: string) =>
    api.get<UserProfile[]>(`/profile/search?query=${encodeURIComponent(query)}`),

  checkUsername: (username: string) =>
    api.get(`/profile/check-username/${username}`),

  updateCreatorStats: (userId: string, stats: any) =>
    api.patch(`/profile/${userId}/creator-stats`, stats),

  updateUserStats: (userId: string, stats: any) =>
    api.patch(`/profile/${userId}/user-stats`, stats),

  updateSocialStats: (userId: string, stats: any) =>
    api.patch(`/profile/${userId}/social-stats`, stats),

  changePassword: (data: { CurrentPassword: string; NewPassword: string }) => 
    api.post('/auth/change-password', data)
};
