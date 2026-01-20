import api from './axios';

// DTO для входа в ситему (логин) 
export interface LoginRequest {
  username: string;
  password: string;
}

// DTO для регистрации 
export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string; 
}

// DTO для сброса и смены пароля 
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Набор функций, инкапсулирующих HTTP-запросы 
export const authApi = {
  login: (data: LoginRequest) => api.post('/auth/login', data),
  register: (data: RegisterRequest) => api.post('/auth/register', data),
  changePassword: (data: ChangePasswordRequest) =>
    api.post('/auth/change-password', data)
};
