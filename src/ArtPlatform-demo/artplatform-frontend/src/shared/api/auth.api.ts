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
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    data: payload,
  });
}

export function register(payload: RegisterRequest) {
  return request<RegisterResponse>('/auth/register', {
    method: 'POST',
    data: payload,
  });
}

export function changePassword(payload: ChangePasswordRequest) {
  return request<ChangePasswordResponse>('/auth/change-password', {
    method: 'POST',
    data: payload,
  });
}