import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import styles from './RegisterPage.module.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      await register(username.trim(), password, confirmPassword);
      navigate('/account', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to="/login" className={styles.backLink} aria-label="Назад ко входу">
        ←
      </Link>

      <h1 className={styles.title}>Регистрация</h1>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Повтор пароля
          <input
            className={styles.input}
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        {error ? <StateMessage title="Ошибка регистрации" description={error} /> : null}

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Регистрация...' : 'Создать аккаунт'}
        </button>
      </form>

      <p className={styles.linkRow}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}