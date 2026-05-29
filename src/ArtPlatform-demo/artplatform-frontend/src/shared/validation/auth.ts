import { z } from 'zod';

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Логин должен содержать минимум 3 символа')
  .max(30, 'Логин не должен превышать 30 символов')
  .regex(/^[a-zA-Z0-9_]+$/, 'Только буквы, цифры и подчеркивание');

export const passwordSchema = z
  .string()
  .min(6, 'Пароль должен содержать минимум 6 символов')
  .max(64, 'Пароль не должен превышать 64 символа');

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Пароли не совпадают',
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Пароль обязателен'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Пароли не совпадают',
});