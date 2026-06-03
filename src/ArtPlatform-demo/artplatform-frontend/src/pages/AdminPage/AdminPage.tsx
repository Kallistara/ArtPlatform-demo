import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog/ConfirmDialog';
import { useToast } from '../../shared/ui/Notifications/ToastProvider';
import { getArtworks, deleteArtwork, type Artwork } from '../../shared/api/artworks.api';
import {
  assignRole,
  deleteRole,
  getUsersByRole,
  type RoleEntry,
  type UserRole,
} from '../../shared/api/roles.api';
import { deleteProfileByAdmin, searchProfiles, type UserProfile } from '../../shared/api/profile.api';
import { toImageUrl } from '../../shared/lib/image';
import styles from './AdminPage.module.css';

const roleOptions: Exclude<UserRole, 'Unauthorized'>[] = ['User', 'Artist', 'Admin'];

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(date);
}

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

export function AdminPage() {
  const { success, error: toastError } = useToast();

  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedRole, setSelectedRole] = useState<Exclude<UserRole, 'Unauthorized'>>('User');
  const [roleRows, setRoleRows] = useState<RoleEntry[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ userId: string; name: string } | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ userId: string; role: Exclude<UserRole, 'Unauthorized'> } | null>(null);
  const [artworkTarget, setArtworkTarget] = useState<Artwork | null>(null);

  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingArtworks, setLoadingArtworks] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (query.trim().length < 2) {
        setProfiles([]);
        return;
      }

      try {
        const data = await searchProfiles(query.trim());
        if (!ignore) setProfiles(data);
      } catch {
        if (!ignore) setProfiles([]);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [query]);

  useEffect(() => {
    let ignore = false;

    async function loadArtworks() {
      try {
        setLoadingArtworks(true);
        const data = await getArtworks();
        if (!ignore) setArtworks(data);
      } catch {
        if (!ignore) setArtworks([]);
      } finally {
        if (!ignore) setLoadingArtworks(false);
      }
    }

    void loadArtworks();

    return () => {
      ignore = true;
    };
  }, []);

  const loadByRole = async (role: Exclude<UserRole, 'Unauthorized'>) => {
    setSelectedRole(role);
    setError('');

    try {
      setLoadingRoles(true);
      const data = await getUsersByRole(role);
      setRoleRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoadingRoles(false);
    }
  };

  const onAssign = async () => {
    if (!roleTarget) return;
    setLoadingRole(true);
    setError('');
    setMessage('');

    try {
      const updated = await assignRole(roleTarget.userId, { role: roleTarget.role, assignedBy: 'admin' });
      setMessage(`Роль ${updated.role} назначена пользователю ${updated.userId}`);
      setRoleTarget(null);
      await loadByRole(selectedRole);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка назначения роли');
    } finally {
      setLoadingRole(false);
    }
  };

  const onDeleteProfile = async () => {
    if (!deleteTarget) return;
    setLoadingDelete(true);
    setError('');
    setMessage('');

    try {
      await deleteProfileByAdmin(deleteTarget.userId);
      await deleteRole(deleteTarget.userId);
      setMessage(`Пользователь ${deleteTarget.name} удалён`);
      setDeleteTarget(null);
      setProfiles((prev) => prev.filter((p) => p.userId !== deleteTarget.userId));
      setRoleRows((prev) => prev.filter((r) => r.userId !== deleteTarget.userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления пользователя');
    } finally {
      setLoadingDelete(false);
    }
  };

  const onDeleteArtwork = async () => {
    if (!artworkTarget) return;
    setLoadingDelete(true);
    setError('');
    setMessage('');

    try {
      await deleteArtwork(artworkTarget.id);
      setArtworks((prev) => prev.filter((a) => a.id !== artworkTarget.id));
      setMessage(`Картина «${artworkTarget.title}» удалена`);
      setArtworkTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления картины');
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <section className={styles.page}>
      <Container>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Админ-панель</h1>
            <p className={styles.subtitle}>Управление пользователями и работами.</p>
          </div>
        </div>

        <div className={styles.grid}>
          <details className={styles.block} open>
            <summary className={styles.summary}>
              <span>Пользователи</span>
              <span className={styles.counter}>{profiles.length}</span>
            </summary>

            <div className={styles.blockBody}>
              <div className={styles.toolbar}>
                <input
                  className={styles.input}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="username / display name / user id"
                />
              </div>

              <div className={styles.list}>
                {profiles.map((p) => (
                  <article key={p.userId} className={styles.userCard}>
                    <div className={styles.userAvatar}>{getInitials(p.displayName || p.userName)}</div>

                    <div className={styles.userMain}>
                      <div className={styles.userNameRow}>
                        <strong>{p.displayName || '—'}</strong>
                        <span className={styles.rolePill}>{p.role}</span>
                      </div>
                      <div className={styles.muted}>@{p.userName}</div>
                      <div className={styles.muted}>{p.userId}</div>
                      <div className={styles.muted}>Зарегистрирован: {formatDate(p.createdAt)}</div>

                      <div className={styles.userLinks}>
                        <Link to={`/artists/${p.userId}`} state={{ from: '/admin' }} className={styles.smallButton}>
                          Открыть профиль
                        </Link>
                      </div>

                      <div className={styles.roleButtonsInline}>
                        {roleOptions.map((role) => (
                          <button
                            key={role}
                            type="button"
                            className={`${styles.roleSwitchButton} ${p.role === role ? styles.roleSwitchActive : ''}`}
                            disabled={p.role === role}
                            onClick={() => setRoleTarget({ userId: p.userId, role })}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.userActions}>
                      <button
                        type="button"
                        className={styles.smallDanger}
                        onClick={() => setDeleteTarget({ userId: p.userId, name: p.displayName || p.userName })}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                ))}

                {query.trim().length >= 2 && profiles.length === 0 ? (
                  <StateMessage title="Ничего не найдено" description="Попробуйте другой запрос." />
                ) : null}
              </div>
            </div>
          </details>

          <details className={styles.block}>
            <summary className={styles.summary}>
              <span>Пользователи по ролям</span>
              <span className={styles.counter}>{roleRows.length}</span>
            </summary>

            <div className={styles.blockBody}>
              <div className={styles.roleButtons}>
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`${styles.smallButton} ${selectedRole === role ? styles.roleSwitchActive : ''}`}
                    onClick={() => loadByRole(role)}
                    disabled={loadingRoles && selectedRole === role}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div className={styles.list}>
                {roleRows.map((r) => (
                  <article key={r.id} className={styles.roleCard}>
                    <div>
                      <strong>{r.userId}</strong>
                      <div className={styles.muted}>Роль: {r.role}</div>
                      <div className={styles.muted}>Назначил: {r.assignedBy || 'system'}</div>
                      <div className={styles.muted}>Дата: {formatDate(r.assignedAt)}</div>
                      <div className={styles.userLinks}>
                        <Link to={`/artists/${r.userId}`} state={{ from: '/admin' }} className={styles.smallButton}>
                          Открыть профиль
                        </Link>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.smallDanger}
                      onClick={() => setDeleteTarget({ userId: r.userId, name: r.userId })}
                    >
                      Удалить
                    </button>
                  </article>
                ))}

                {loadingRoles ? <StateMessage title="Загрузка..." /> : null}
                {!loadingRoles && roleRows.length === 0 ? (
                  <StateMessage title="Нет данных" description="Выберите роль, чтобы просмотеть пользователей." />
                ) : null}
              </div>
            </div>
          </details>

          <details className={styles.block} open>
            <summary className={styles.summary}>
              <span>Картины</span>
              <span className={styles.counter}>{artworks.length}</span>
            </summary>

            <div className={styles.blockBody}>
              <div className={styles.list}>
                {artworks.map((artwork) => (
                  <article key={artwork.id} className={styles.artworkCard}>
                    <Link to={`/artworks/${artwork.id}`} state={{ from: '/admin' }} className={styles.artworkLink}>
                      <img
                        className={styles.artworkImage}
                        src={toImageUrl(artwork.mainImageUrl)}
                        alt={artwork.title}
                      />

                      <div className={styles.artworkMain}>
                        <div className={styles.artworkTopRow}>
                          <strong className={styles.artworkTitle}>{artwork.title}</strong>
                          <span className={styles.rolePill}>{artwork.price.toFixed(2)} ₽</span>
                        </div>

                        <div className={styles.muted}>Artwork ID: {artwork.id}</div>
                        <div className={styles.muted}>Artist ID: {artwork.artistId}</div>
                        <div className={styles.muted}>Художник: {artwork.artistName}</div>
                        <div className={styles.muted}>Категория: {artwork.category}</div>
                        <div className={styles.muted}>Есть в наличии: {artwork.quantity > 0 ? 'Да' : 'Нет'}</div>
                      </div>
                    </Link>

                    <div className={styles.artworkActions}>
                      <Link to={`/artworks/edit/${artwork.id}`} state={{ from: '/admin' }} className={styles.smallButton}>
                        Редактировать
                      </Link>
                      <button
                        type="button"
                        className={styles.smallDanger}
                        onClick={() => setArtworkTarget(artwork)}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                ))}

                {loadingArtworks ? <StateMessage title="Загрузка картин..." /> : null}
                {!loadingArtworks && artworks.length === 0 ? <StateMessage title="Картин пока нет" /> : null}
              </div>
            </div>
          </details>
        </div>

        {message ? <StateMessage title="Успех" description={message} /> : null}
        {error ? <StateMessage title="Ошибка" description={error} /> : null}

        <ConfirmDialog
          open={!!deleteTarget}
          title="Удалить пользователя?"
          message={deleteTarget ? `Пользователь ${deleteTarget.name} будет удалён.` : ''}
          confirmText="Удалить"
          loading={loadingDelete}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={onDeleteProfile}
        />

        <ConfirmDialog
          open={!!artworkTarget}
          title="Удалить картину?"
          message={artworkTarget ? `Картина «${artworkTarget.title}» будет удалена.` : ''}
          confirmText="Удалить"
          loading={loadingDelete}
          onCancel={() => setArtworkTarget(null)}
          onConfirm={onDeleteArtwork}
        />

        <ConfirmDialog
          open={!!roleTarget}
          title="Назначить роль?"
          message={roleTarget ? `Назначить роль ${roleTarget.role} пользователю ${roleTarget.userId}?` : ''}
          confirmText="Назначить"
          loading={loadingRole}
          onCancel={() => setRoleTarget(null)}
          onConfirm={onAssign}
        />
      </Container>
    </section>
  );
}