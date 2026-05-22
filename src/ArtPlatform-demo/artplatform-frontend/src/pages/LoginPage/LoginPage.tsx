import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password);
      navigate('/account', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink} aria-label="Назад на главную">
        ←
      </Link>

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