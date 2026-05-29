import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../shared/validation/auth';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../shared/ui/Notifications/ToastProvider';
import styles from './RegisterPage.module.css';

type RegisterValues = {
  username: string;
  password: string;
  confirmPassword: string;
};

function getRegisterFieldError(message: string): 'username' | 'password' | 'confirmPassword' | null {
  const text = message.toLowerCase();

  if (text.includes('already') || text.includes('уже используется') || text.includes('занят')) {
    return 'username';
  }

  if (text.includes('парол') && text.includes('не совп')) {
    return 'confirmPassword';
  }

  if (text.includes('username') || text.includes('логин')) {
    return 'username';
  }

  if (text.includes('password') || text.includes('пароль')) {
    return 'password';
  }

  return null;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { error: toastError } = useToast();

  const [serverError, setServerError] = useState('');

  const {
    register: rhfRegister,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    setServerError('');
    clearErrors();

    try {
      await register(values.username.trim(), values.password, values.confirmPassword);
      navigate('/account', { replace: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ошибка регистрации';
      const field = getRegisterFieldError(message);

      if (field) {
        setError(field, {
          type: 'server',
          message:
            field === 'username'
              ? 'Пользователь с таким логином уже существует'
              : field === 'confirmPassword'
                ? 'Пароли не совпадают'
                : 'Некорректный пароль',
        });
        return;
      }

      setServerError('Ошибка регистрации');
      toastError('Ошибка регистрации', 'Ошибка регистрации');
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Регистрация</h1>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} autoComplete="on">
        <label className={styles.label}>
          Логин
          <input
            className={styles.input}
            name="username"
            autoComplete="username"
            {...rhfRegister('username')}
          />
          {errors.username ? <span className={styles.error}>{errors.username.message}</span> : null}
        </label>

        <label className={styles.label}>
          Пароль
          <input
            className={styles.input}
            type="password"
            name="password"
            autoComplete="new-password"
            {...rhfRegister('password')}
          />
          {errors.password ? <span className={styles.error}>{errors.password.message}</span> : null}
        </label>

        <label className={styles.label}>
          Повтор пароля
          <input
            className={styles.input}
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            {...rhfRegister('confirmPassword')}
          />
          {errors.confirmPassword ? <span className={styles.error}>{errors.confirmPassword.message}</span> : null}
        </label>

        <button className={styles.button} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Регистрация...' : 'Создать аккаунт'}
        </button>

        {serverError ? <div className={styles.errorBox}>{serverError}</div> : null}
      </form>

      <p className={styles.linkRow}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}