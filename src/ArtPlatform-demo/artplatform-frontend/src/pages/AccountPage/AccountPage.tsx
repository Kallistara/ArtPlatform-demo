import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog/ConfirmDialog';
import { changePassword } from '../../shared/api/auth.api';
import {
  deleteMyProfile,
  getMyProfile,
  updateMyProfile,
  type UserProfile,
} from '../../shared/api/profile.api';
import {
  deleteArtwork,
  getArtworksByArtistId,
  type Artwork,
} from '../../shared/api/artworks.api';
import { useAuth } from '../../app/providers/AuthProvider';
import { toImageUrl } from '../../shared/ib/image';
import styles from './AccountPage.module.css';

const emptyContact = { email: '', website: '', telegram: '', otherContact: '' };

export function AccountPage() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();

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
  const [deletingProfile, setDeletingProfile] = useState(false);

  const [myArtworks, setMyArtworks] = useState<Artwork[]>([]);
  const [loadingArtworks, setLoadingArtworks] = useState(false);
  const [artworkDeleteTarget, setArtworkDeleteTarget] = useState<Artwork | null>(null);
  const [deletingArtwork, setDeletingArtwork] = useState(false);

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
        if (!ignore) {
          setProfileError(e instanceof Error ? e.message : 'Ошибка загрузки профиля');
        }
      } finally {
        if (!ignore) setLoadingProfile(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadMyArtworks() {
      if (!profile || profile.role !== 'Artist') {
        setMyArtworks([]);
        return;
      }

      try {
        setLoadingArtworks(true);
        const items = await getArtworksByArtistId(profile.userId);
        if (!ignore) setMyArtworks(items);
      } catch {
        if (!ignore) setMyArtworks([]);
      } finally {
        if (!ignore) setLoadingArtworks(false);
      }
    }

    void loadMyArtworks();

    return () => {
      ignore = true;
    };
  }, [profile]);

  const filledContact = useMemo(
    () => Object.entries(contact).filter(([, v]) => String(v ?? '').trim() !== ''),
    [contact]
  );

  const isArtist = profile?.role === 'Artist' || user?.role === 'Artist';

  const refreshMyArtworks = async () => {
    if (!profile || profile.role !== 'Artist') return;
    const items = await getArtworksByArtistId(profile.userId);
    setMyArtworks(items);
  };

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

  const onDeleteProfile = async () => {
    setDeletingProfile(true);
    setError('');
    setMessage('');

    try {
      await deleteMyProfile();
      logout();
      navigate('/', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления профиля');
    } finally {
      setDeletingProfile(false);
      setDeleteOpen(false);
    }
  };

  const onDeleteArtwork = async () => {
    if (!artworkDeleteTarget) return;

    setDeletingArtwork(true);
    setError('');
    setMessage('');

    try {
      await deleteArtwork(artworkDeleteTarget.id);
      setMyArtworks((prev) => prev.filter((item) => item.id !== artworkDeleteTarget.id));
      setMessage(`Картина "${artworkDeleteTarget.title}" удалена`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления картины');
    } finally {
      setDeletingArtwork(false);
      setArtworkDeleteTarget(null);
    }
  };

  if (loadingProfile) {
    return (
      <section className={styles.page}>
        <Container>
          <StateMessage title="Загрузка профиля..." />
        </Container>
      </section>
    );
  }

  if (profileError) {
    return (
      <section className={styles.page}>
        <Container>
          <StateMessage title="Ошибка" description={profileError} />
        </Container>
      </section>
    );
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

        {isArtist ? (
          <section className={styles.form}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Мои работы</h2>
              <button type="button" className={styles.button} onClick={() => navigate('/artworks/create')}>
                Создать картину
              </button>
            </div>

            {loadingArtworks ? <StateMessage title="Загрузка работ..." /> : null}

            {!loadingArtworks && myArtworks.length === 0 ? (
              <StateMessage title="Пока нет работ" description="Создайте первую картину, чтобы она появилась здесь." />
            ) : null}

            <div style={{ display: 'grid', gap: 16 }}>
              {myArtworks.map((artwork) => (
                <div
                  key={artwork.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr auto',
                    gap: 16,
                    alignItems: 'center',
                    padding: 12,
                    border: '1px solid rgba(128,128,128,0.18)',
                    borderRadius: 16,
                  }}
                >
                  <Link to={`/artworks/${artwork.id}`}>
                    <img
                      src={toImageUrl(artwork.mainImageUrl)}
                      alt={artwork.title}
                      style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 12 }}
                    />
                  </Link>

                  <div>
                    <div style={{ fontWeight: 700 }}>{artwork.title}</div>
                    <div style={{ opacity: 0.75 }}>{artwork.category}</div>
                    <div>${artwork.price.toFixed(2)}</div>
                    <div>Количество: {artwork.quantity}</div>
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    <button type="button" className={styles.actionButton} onClick={() => navigate(`/artworks/${artwork.id}/edit`)}>
                      Редактировать
                    </button>
                    <button type="button" className={styles.actionButton} onClick={() => setArtworkDeleteTarget(artwork)}>
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className={styles.adminOnly}>
          <button type="button" className={styles.dangerButton} onClick={() => setDeleteOpen(true)}>
            Удалить мой профиль
          </button>
        </div>

        <ConfirmDialog
          open={deleteOpen}
          title="Удалить профиль?"
          message="Это действие удалит ваш профиль без возможности восстановления."
          confirmText={deletingProfile ? 'Удаление...' : 'Удалить'}
          loading={deletingProfile}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={onDeleteProfile}
        />

        <ConfirmDialog
          open={!!artworkDeleteTarget}
          title="Удалить картину?"
          message={artworkDeleteTarget ? `Удалить работу "${artworkDeleteTarget.title}"?` : ''}
          confirmText={deletingArtwork ? 'Удаление...' : 'Удалить'}
          loading={deletingArtwork}
          onCancel={() => setArtworkDeleteTarget(null)}
          onConfirm={onDeleteArtwork}
        />

        <p className={styles.metaLine}>Заполненные контакты: {filledContact.length}</p>
      </Container>
    </section>
  );
}