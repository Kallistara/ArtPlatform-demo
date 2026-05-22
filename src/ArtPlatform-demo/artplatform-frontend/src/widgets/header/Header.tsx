import { Link, NavLink } from 'react-router-dom';
import styles from './Header.module.css';
import { useScrollDirection } from '../../shared/hooks/UseScrollDirection';

export function Header() {
  const direction = useScrollDirection();
  const hidden = direction === 'down';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.active : ''}`;

  return (
    <header className={`${styles.header} ${hidden ? styles.hidden : ''}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          ArtPlatform
        </Link>

        <nav className={styles.nav}>
          <NavLink to="/catalog" className={linkClass} end>
            Каталог
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            О нас
          </NavLink>
          <NavLink to="/favorites" className={linkClass}>
            Избранное
          </NavLink>
          <NavLink to="/cart" className={linkClass}>
            Корзина
          </NavLink>
          <NavLink to="/account" className={linkClass}>
            Аккаунт
          </NavLink>
          <NavLink to="/login" className={linkClass}>
            Вход
          </NavLink>
        </nav>
      </div>
    </header>
  );
}