import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (searchParams.get('sessionExpired') === '1') {
      setSessionExpired(true);
    }
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setError('Заполните логин и пароль');
      return;
    }

    setLoading(true);

    try {
      await login(trimmedUsername, password);
      navigate('/account', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка входа';

      if (message.toLowerCase().includes('неверный логин или пароль')) {
        setError('Неверный логин или пароль');
      } else if (message.toLowerCase().includes('session') || message.toLowerCase().includes('сессия')) {
        setError('Сессия истекла. Войдите снова.');
      } else {
        setError('Ошибка входа');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {sessionExpired ? (
        <StateMessage
          title="Сессия истекла"
          description="Ваш вход устарел. Пожалуйста, войдите в аккаунт снова."
        />
      ) : null}

      <h1 className={styles.title}>Вход</h1>

      <form className={styles.form} onSubmit={onSubmit} autoComplete="on">
        <label className={styles.label}>
          Логин
          <input
            className={styles.input}
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Пароль
          <input
            className={styles.input}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? <StateMessage title="Ошибка входа" description={error} /> : null}

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p className={styles.linkRow}>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}