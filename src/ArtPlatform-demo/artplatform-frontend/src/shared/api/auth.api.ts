import { request } from './client';

export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  password: string;
  confirmPassword: string;
};

export type AuthResponse = {
  userId: string;
  accessToken: string;
  tokenType: string;
};

export type RegisterResponse = {
  userId: string;
  message: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export function login(payload: LoginRequest) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterRequest) {
  return request<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function changePassword(payload: ChangePasswordRequest) {
  return request<ChangePasswordResponse>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}