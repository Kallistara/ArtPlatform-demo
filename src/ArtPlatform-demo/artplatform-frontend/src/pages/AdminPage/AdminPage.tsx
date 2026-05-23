import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog/ConfirmDialog';
import {
  assignRole,
  getUsersByRole,
  type UserRole,
  type RoleEntry,
} from '../../shared/api/roles.api';
import {
  deleteProfileByAdmin,
  getProfileByUserId,
  searchProfiles,
  type UserProfile,
} from '../../shared/api/profile.api';
import {
  deleteArtwork,
  getArtworks,
  type Artwork,
} from '../../shared/api/artworks.api';
//import { toImageUrl } from '../../shared/ib/image';
import styles from './AdminPage.module.css';

const ROLE_OPTIONS: UserRole[] = ['Unauthorized', 'User', 'Artist', 'Admin'];

type AdminUserRow = {
  userId: string;
  userName?: string;
  displayName?: string;
  role: UserRole;
  avatarUrl?: string | null;
};

async function loadAllUsers(): Promise<AdminUserRow[]> {
  const roleBuckets = await Promise.all(ROLE_OPTIONS.map((role) => getUsersByRole(role)));
  const entries = roleBuckets.flat();

  const unique = new Map<string, RoleEntry>();
  entries.forEach((entry) => unique.set(entry.userId, entry));

  const rows = await Promise.all(
    Array.from(unique.values()).map(async (entry) => {
      const profile = await getProfileByUserId(entry.userId).catch(() => null);
      return {
        userId: entry.userId,
        userName: profile?.userName,
        displayName: profile?.displayName,
        role: entry.role,
        avatarUrl: profile?.avatarUrl ?? null,
      } satisfies AdminUserRow;
    })
  );

  return rows.sort((a, b) => (a.displayName || a.userName || a.userId).localeCompare(b.displayName || b.userName || b.userId));
}

export function AdminPage() {
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUserRow[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('Artist');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ userId: string; name: string } | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ userId: string; role: UserRole } | null>(null);
  const [artworkDeleteTarget, setArtworkDeleteTarget] = useState<Artwork | null>(null);

  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingAllUsers, setLoadingAllUsers] = useState(true);
  const [loadingArtworks, setLoadingArtworks] = useState(true);

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

    async function loadUsers() {
      try {
        setLoadingAllUsers(true);
        const data = await loadAllUsers();
        if (!ignore) setAllUsers(data);
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : 'Ошибка загрузки пользователей');
      } finally {
        if (!ignore) setLoadingAllUsers(false);
      }
    }

    void loadUsers();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadWorks() {
      try {
        setLoadingArtworks(true);
        const data = await getArtworks();
        if (!ignore) setArtworks(data);
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : 'Ошибка загрузки работ');
      } finally {
        if (!ignore) setLoadingArtworks(false);
      }
    }

    void loadWorks();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredArtworks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return artworks;

    return artworks.filter((item) => {
      const text = `${item.title} ${item.artistName} ${item.category} ${item.style} ${item.material}`.toLowerCase();
      return text.includes(q);
    });
  }, [artworks, query]);

  const onAssign = async () => {
    if (!roleTarget) return;

    setLoadingRole(true);
    setError('');
    setMessage('');

    try {
      const updated = await assignRole(roleTarget.userId, {
        role: roleTarget.role,
        assignedBy: 'admin',
      });

      setMessage(`Роль ${updated.role} назначена пользователю ${updated.userId}`);
      setRoleTarget(null);

      setProfiles((prev) =>
        prev.map((p) => (p.userId === updated.userId ? { ...p, role: updated.role } : p))
      );

      setAllUsers((prev) =>
        prev.map((u) => (u.userId === updated.userId ? { ...u, role: updated.role } : u))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка назначения роли');
    } finally {
      setLoadingRole(false);
    }
  };

  const onDeleteUser = async () => {
    if (!deleteTarget) return;

    setLoadingDelete(true);
    setError('');
    setMessage('');

    try {
      await deleteProfileByAdmin(deleteTarget.userId);
      setMessage(`Пользователь ${deleteTarget.name} удалён`);
      setDeleteTarget(null);

      setProfiles((prev) => prev.filter((p) => p.userId !== deleteTarget.userId));
      setAllUsers((prev) => prev.filter((u) => u.userId !== deleteTarget.userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления пользователя');
    } finally {
      setLoadingDelete(false);
    }
  };

  const onDeleteArtwork = async () => {
    if (!artworkDeleteTarget) return;

    setLoadingDelete(true);
    setError('');
    setMessage('');

    try {
      await deleteArtwork(artworkDeleteTarget.id);
      setMessage(`Картина "${artworkDeleteTarget.title}" удалена`);
      setArtworkDeleteTarget(null);
      setArtworks((prev) => prev.filter((item) => item.id !== artworkDeleteTarget.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления картины');
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <section className={styles.page}>
      <Container>
        <h1 className={styles.title}>Админка</h1>

        <div className={styles.block}>
          <h2 className={styles.subtitle}>Поиск пользователей</h2>
          <p className={styles.muted}>
            Назначь роль <strong>Artist</strong>, чтобы пользователь получил доступ к созданию картин.
          </p>

          <input
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="username / display name"
          />

          <div className={styles.table}>
            {profiles.map((p) => (
              <div key={p.userId} className={styles.row}>
                <div className={styles.main}>
                  <strong>{p.displayName || '—'}</strong>
                  <div className={styles.muted}>{p.userName}</div>
                  <div className={styles.muted}>Текущая роль: {p.role}</div>
                </div>

                <div className={styles.actions}>
                  <select
                    className={styles.input}
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className={styles.smallButton}
                    onClick={() => setRoleTarget({ userId: p.userId, role: selectedRole })}
                  >
                    Назначить
                  </button>

                  <button
                    type="button"
                    className={styles.smallDanger}
                    onClick={() => setDeleteTarget({ userId: p.userId, name: p.displayName || p.userName })}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.block}>
          <h2 className={styles.subtitle}>Все пользователи</h2>

          {loadingAllUsers ? <StateMessage title="Загрузка пользователей..." /> : null}

          <div className={styles.table}>
            {allUsers.map((u) => (
              <div key={u.userId} className={styles.row}>
                <div className={styles.main}>
                  <strong>{u.displayName || u.userName || u.userId}</strong>
                  <div className={styles.muted}>{u.userName || '—'}</div>
                  <div className={styles.muted}>Роль: {u.role}</div>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.smallButton}
                    onClick={() => setRoleTarget({ userId: u.userId, role: 'Artist' })}
                  >
                    Сделать Artist
                  </button>
                  <button
                    type="button"
                    className={styles.smallDanger}
                    onClick={() => setDeleteTarget({ userId: u.userId, name: u.displayName || u.userName || u.userId })}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.block}>
          <h2 className={styles.subtitle}>Все работы</h2>

          {loadingArtworks ? <StateMessage title="Загрузка работ..." /> : null}

          <div className={styles.table}>
            {filteredArtworks.map((a) => (
              <div key={a.id} className={styles.row}>
                <div className={styles.main}>
                  <strong>{a.title}</strong>
                  <div className={styles.muted}>{a.artistName}</div>
                  <div className={styles.muted}>{a.category} / {a.style}</div>
                  <div className={styles.muted}>${a.price.toFixed(2)} | qty: {a.quantity}</div>
                </div>

                <div className={styles.actions}>
                  <Link to={`/artworks/${a.id}`} className={styles.smallButton}>
                    Смотреть
                  </Link>
                  <Link to={`/artworks/${a.id}/edit`} className={styles.smallButton}>
                    Редактировать
                  </Link>
                  <button
                    type="button"
                    className={styles.smallDanger}
                    onClick={() => setArtworkDeleteTarget(a)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
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
          onConfirm={onDeleteUser}
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

        <ConfirmDialog
          open={!!artworkDeleteTarget}
          title="Удалить картину?"
          message={artworkDeleteTarget ? `Удалить "${artworkDeleteTarget.title}"?` : ''}
          confirmText="Удалить"
          loading={loadingDelete}
          onCancel={() => setArtworkDeleteTarget(null)}
          onConfirm={onDeleteArtwork}
        />
      </Container>
    </section>
  );
}