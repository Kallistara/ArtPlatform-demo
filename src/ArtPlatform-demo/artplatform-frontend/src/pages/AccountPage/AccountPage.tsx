// src/pages/AccountPage/AccountPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog/ConfirmDialog';
import { changePassword } from '../../shared/api/auth.api';
import { getMyProfile, updateMyProfile, type UserProfile } from '../../shared/api/profile.api';
import { useAuth } from '../../app/providers/AuthProvider';
import styles from './AccountPage.module.css';

const emptyContact = { email: '', website: '', telegram: '', otherContact: '' };

export function AccountPage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [contact, setContact] = useState(emptyContact);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoadingProfile(true);
        const data = await getMyProfile();
        if (ignore) return;
        setProfile(data);
        setDisplayName(data.displayName ?? '');
        setBio(data.bio ?? '');
        setContact({
          email: data.contact?.email ?? '',
          website: data.contact?.website ?? '',
          telegram: data.contact?.telegram ?? '',
          otherContact: data.contact?.otherContact ?? '',
        });
      } catch (e) {
        if (!ignore) setProfileError(e instanceof Error ? e.message : 'Ошибка загрузки профиля');
      } finally {
        if (!ignore) setLoadingProfile(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const filledContact = useMemo(
    () => Object.entries(contact).filter(([, v]) => String(v ?? '').trim() !== ''),
    [contact]
  );

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSavingProfile(true);
    try {
      const res = await updateMyProfile({
        displayName,
        bio,
        contact: {
          email: contact.email || null,
          website: contact.website || null,
          telegram: contact.telegram || null,
          otherContact: contact.otherContact || null,
        },
      });
      setProfile(res.profile);
      setMessage(res.message);
      setEditMode(false);
      await refreshUser();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения профиля');
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('Новый пароль и подтверждение не совпадают');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await changePassword({ currentPassword, newPassword });
      setMessage(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMode(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка смены пароля');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadingProfile) {
    return <section className={styles.page}><Container><StateMessage title="Загрузка профиля..." /></Container></section>;
  }

  if (profileError) {
    return <section className={styles.page}><Container><StateMessage title="Ошибка" description={profileError} /></Container></section>;
  }

  return (
    <section className={styles.page}>
      <Container>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Аккаунт</h1>
            <p className={styles.subtitle}>Профиль пользователя и настройки безопасности</p>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.actionButton} onClick={() => setEditMode((v) => !v)}>
              {editMode ? 'Скрыть редактирование' : 'Редактировать профиль'}
            </button>
            <button type="button" className={styles.actionButton} onClick={() => setPasswordMode((v) => !v)}>
              {passwordMode ? 'Скрыть смену пароля' : 'Сменить пароль'}
            </button>
          </div>
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryItem}><span>Username</span><strong>{profile?.userName || '—'}</strong></div>
          <div className={styles.summaryItem}><span>Display name</span><strong>{profile?.displayName || '—'}</strong></div>
          <div className={styles.summaryItem}><span>Role</span><strong>{profile?.role || '—'}</strong></div>
          <div className={styles.summaryItem}><span>Created</span><strong>{profile?.createdAt || '—'}</strong></div>
          <div className={styles.summaryItem}><span>Updated</span><strong>{profile?.updatedAt || '—'}</strong></div>
          <div className={styles.summaryItem}><span>User ID</span><strong>{user?.userId || '—'}</strong></div>
        </div>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>О себе</h2>
            <p className={styles.text}>{profile?.bio?.trim() ? profile.bio : '—'}</p>
          </section>

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Контакты</h2>
            <div className={styles.contactList}>
              <div className={styles.contactRow}><span>Email</span><strong>{profile?.contact?.email || '—'}</strong></div>
              <div className={styles.contactRow}><span>Website</span><strong>{profile?.contact?.website || '—'}</strong></div>
              <div className={styles.contactRow}><span>Telegram</span><strong>{profile?.contact?.telegram || '—'}</strong></div>
              <div className={styles.contactRow}><span>Other</span><strong>{profile?.contact?.otherContact || '—'}</strong></div>
            </div>
          </section>
        </div>

        {editMode && (
          <form className={styles.form} onSubmit={onSaveProfile}>
            <h2 className={styles.sectionTitle}>Редактирование профиля</h2>
            <label className={styles.label}>
              Display name
              <input className={styles.input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </label>
            <label className={styles.label}>
              Bio
              <textarea className={styles.textarea} value={bio} onChange={(e) => setBio(e.target.value)} />
            </label>
            <div className={styles.contactGrid}>
              <label className={styles.label}>
                Email
                <input className={styles.input} value={contact.email} onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))} />
              </label>
              <label className={styles.label}>
                Website
                <input className={styles.input} value={contact.website} onChange={(e) => setContact((p) => ({ ...p, website: e.target.value }))} />
              </label>
              <label className={styles.label}>
                Telegram
                <input className={styles.input} value={contact.telegram} onChange={(e) => setContact((p) => ({ ...p, telegram: e.target.value }))} />
              </label>
              <label className={styles.label}>
                Other
                <input className={styles.input} value={contact.otherContact} onChange={(e) => setContact((p) => ({ ...p, otherContact: e.target.value }))} />
              </label>
            </div>
            <button className={styles.button} type="submit" disabled={savingProfile}>
              {savingProfile ? 'Сохранение...' : 'Сохранить профиль'}
            </button>
          </form>
        )}

        {passwordMode && (
          <form className={styles.form} onSubmit={onChangePassword}>
            <h2 className={styles.sectionTitle}>Смена пароля</h2>
            <label className={styles.label}>
              Текущий пароль
              <input className={styles.input} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </label>
            <label className={styles.label}>
              Новый пароль
              <input className={styles.input} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </label>
            <label className={styles.label}>
              Повтор нового пароля
              <input className={styles.input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </label>
            <button className={styles.button} type="submit" disabled={savingPassword}>
              {savingPassword ? 'Сохранение...' : 'Сменить пароль'}
            </button>
          </form>
        )}

        {message ? <StateMessage title="Успех" description={message} /> : null}
        {error ? <StateMessage title="Ошибка" description={error} /> : null}

        <div className={styles.adminOnly}>
          <button type="button" className={styles.dangerButton} onClick={() => setDeleteOpen(true)}>
            Удалить мой профиль
          </button>
        </div>

        <ConfirmDialog
          open={deleteOpen}
          title="Удалить профиль?"
          message="Это действие удалит ваш профиль без возможности восстановления."
          confirmText="Удалить"
          onCancel={() => setDeleteOpen(false)}
          onConfirm={async () => {}}
        />

        <p className={styles.metaLine}>Заполненные контакты: {filledContact.length}</p>
      </Container>
    </section>
  );
}