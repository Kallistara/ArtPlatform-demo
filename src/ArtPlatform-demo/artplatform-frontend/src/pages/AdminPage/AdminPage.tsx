// src/pages/AdminPage/AdminPage.tsx
import { useEffect, useState } from 'react';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog/ConfirmDialog';
import { assignRole, deleteRole, getUsersByRole, type UserRole, type RoleEntry } from '../../shared/api/roles.api';
import { deleteProfileByAdmin, searchProfiles, type UserProfile } from '../../shared/api/profile.api';
import styles from './AdminPage.module.css';

export function AdminPage() {
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('User');
  const [roleRows, setRoleRows] = useState<RoleEntry[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ userId: string; name: string } | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ userId: string; role: UserRole } | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (query.trim().length < 2) {
        setProfiles([]);
        return;
      }
      const data = await searchProfiles(query.trim());
      if (!ignore) setProfiles(data);
    }
    load().catch(() => setProfiles([]));
    return () => {
      ignore = true;
    };
  }, [query]);

  const loadByRole = async (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    try {
      const data = await getUsersByRole(role);
      setRoleRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки по роли');
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

  const onDelete = async () => {
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

  return (
    <section className={styles.page}>
      <Container>
        <h1 className={styles.title}>Админка</h1>

        <div className={styles.block}>
          <h2 className={styles.subtitle}>Поиск пользователей</h2>
          <input className={styles.input} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="username / display name" />
          <div className={styles.table}>
            {profiles.map((p) => (
              <div key={p.userId} className={styles.row}>
                <div className={styles.main}>
                  <strong>{p.displayName || '—'}</strong>
                  <div className={styles.muted}>{p.userName}</div>
                  <div className={styles.muted}>{p.role}</div>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.smallButton}
                    onClick={() => setRoleTarget({ userId: p.userId, role: selectedRole })}
                  >
                    Назначить роль
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
          <h2 className={styles.subtitle}>Пользователи по роли</h2>
          <div className={styles.roleButtons}>
            {(['User', 'Artist', 'Admin', 'Unauthorized'] as UserRole[]).map((r) => (
              <button key={r} type="button" className={styles.smallButton} onClick={() => loadByRole(r)}>
                {r}
              </button>
            ))}
          </div>

          <div className={styles.table}>
            {roleRows.map((r) => (
              <div key={r.id} className={styles.row}>
                <div className={styles.main}>
                  <strong>{r.userId}</strong>
                  <div className={styles.muted}>{r.role}</div>
                  <div className={styles.muted}>{r.assignedBy || 'system'}</div>
                </div>
                <div className={styles.actions}>
                  <button type="button" className={styles.smallDanger} onClick={() => setDeleteTarget({ userId: r.userId, name: r.userId })}>
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
          onConfirm={onDelete}
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