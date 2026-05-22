// src/widgets/header/Header.tsx
import { Link, NavLink, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { useScrollDirection } from '../../shared/hooks/UseScrollDirection';
import { useAuth } from '../../app/providers/AuthProvider';

export function Header() {
  const direction = useScrollDirection();
  const hidden = direction === 'down';
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.active : ''}`;

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className={`${styles.header} ${hidden ? styles.hidden : ''}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>ArtPlatform</Link>

        <nav className={styles.nav}>
          <NavLink to="/catalog" className={linkClass} end>Каталог</NavLink>
          <NavLink to="/about" className={linkClass}>О нас</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/favorites" className={linkClass}>Избранное</NavLink>
              <NavLink to="/cart" className={linkClass}>Корзина</NavLink>
              <NavLink to="/account" className={linkClass}>Аккаунт</NavLink>
              {isAdmin ? <NavLink to="/admin" className={linkClass}>Админка</NavLink> : null}
              <span className={styles.userBadge}>{user?.username || user?.userId}</span>
              <button type="button" className={styles.logoutButton} onClick={handleLogout}>Выйти</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Вход</NavLink>
              <NavLink to="/register" className={linkClass}>Регистрация</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}