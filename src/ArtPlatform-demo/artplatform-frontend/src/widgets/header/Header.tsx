import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import { useScrollDirection } from '../../shared/hooks/UseScrollDirection';
import { useAuth } from '../../app/providers/AuthProvider';

function getInitials(name?: string, fallback = '?') {
  const source = (name ?? '').trim();
  if (!source) return fallback;

  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return letters || fallback;
}

export function Header() {
  const direction = useScrollDirection();
  const hidden = direction === 'down';
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [query, setQuery] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.active : ''}`;

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setSearchSubmitted(true);
    navigate(q ? `/catalog?query=${encodeURIComponent(q)}` : '/catalog');
  };

  // Сброс запроса, если мы ушли со страницы каталога и не на странице картины
  useEffect(() => {
    const path = location.pathname;
    const isCatalog = path === '/catalog';
    const isArtwork = /^\/artworks\/[^/]+$/.test(path);

    if (!isCatalog && !isArtwork) {
      // Ушли со страницы каталога и не на странице картины
      setQuery('');
      setSearchSubmitted(false);
    } else if (isCatalog) {
      // Если мы на каталоге, но query в URL есть, можно подтянуть его в инпут
      const params = new URLSearchParams(location.search);
      const qFromUrl = params.get('query');
      if (qFromUrl !== null) {
        setQuery(qFromUrl);
        setSearchSubmitted(true);
      } else if (!searchSubmitted) {
        // Если пришли на каталог без query и запрос ещё не был отправлен — очищаем
        setQuery('');
        setSearchSubmitted(false);
      }
    }
  }, [location.pathname, location.search]);

  const displayName = user?.displayName || user?.username || user?.userId;
  const initials = getInitials(displayName, 'U');
  const showPersonalLinks = isAuthenticated && !isAdmin;
  const showCreateButton = isAuthenticated && user?.role === 'Artist';

  return (
    <header className={`${styles.header} ${hidden ? styles.hidden : ''}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>ArtPlatform</Link>

        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск картин, авторов, категорий"
          />
          <button type="submit" className={styles.searchButton}>
            Найти
          </button>
        </form>

        <nav className={styles.nav}>
          <NavLink to="/catalog" className={linkClass} end>Каталог</NavLink>

          {showPersonalLinks ? (
            <>
              <NavLink to="/favorites" className={linkClass}>Избранное</NavLink>
              <NavLink to="/cart" className={linkClass}>Корзина</NavLink>
            </>
          ) : null}

          {isAuthenticated ? (
            <>
              {isAdmin ? <NavLink to="/admin" className={linkClass}>Админ-панель</NavLink> : null}

              {showCreateButton ? (
                <Link
                  to="/artworks/create"
                  className={styles.createButton}
                  title="Опубликовать новую картину"
                  aria-label="Опубликовать новую картину"
                >
                  +
                </Link>
              ) : null}

              <Link
                to="/account"
                className={styles.userChip}
                title={user?.username ? `@${user.username}` : displayName}
                aria-label="Открыть аккаунт"
              >
                <span className={styles.userAvatar}>{initials}</span>
                <span className={styles.userName}>{displayName}</span>
              </Link>

              <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                Выйти
              </button>
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