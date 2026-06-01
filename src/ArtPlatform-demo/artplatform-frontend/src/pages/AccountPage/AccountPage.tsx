import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog/ConfirmDialog';
import { useToast } from '../../shared/ui/Notifications/ToastProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import { changePassword } from '../../shared/api/auth.api';
import {
  deleteMyProfile,
  getMyProfile,
  updateMyProfile,
  type ContactInfo,
  type UserProfile,
} from '../../shared/api/profile.api';
import { deleteArtwork, getArtworksByArtistId, type Artwork } from '../../shared/api/artworks.api';
import { toImageUrl } from '../../shared/lib/image';
import styles from './AccountPage.module.css';

type ProfileDraft = {
  displayName: string;
  bio: string;
  email: string;
  webSite: string;
  otherContacts: string;
};

type ProfileErrors = Partial<Record<keyof ProfileDraft, string>>;

type PasswordDraft = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PasswordErrors = Partial<Record<keyof PasswordDraft, string>>;

const emptyDraft: ProfileDraft = {
  displayName: '',
  bio: '',
  email: '',
  webSite: '',
  otherContacts: '',
};

const emptyPassword: PasswordDraft = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(date);
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

function validateProfile(draft: ProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {};
  const displayName = draft.displayName.trim();
  const bio = draft.bio.trim();
  const email = draft.email.trim();
  const webSite = draft.webSite.trim();
  const otherContacts = draft.otherContacts.trim();

  if (!displayName) {
    errors.displayName = 'Укажите имя.';
  } else if (displayName.length < 3) {
    errors.displayName = 'Минимум 3 символа.';
  } else if (displayName.length > 50) {
    errors.displayName = 'Максимум 50 символов.';
  } else if (!/^[a-zA-Zа-яА-ЯёЁ0-9_ ]+$/.test(displayName)) {
    errors.displayName = 'Только буквы, цифры и подчеркивание.';
  }

  if (bio.length > 500) {
    errors.bio = 'Максимум 500 символов.';
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Введите корректный email.';
  }

  if (webSite) {
    try {
      new URL(webSite.startsWith('http') ? webSite : `https://${webSite}`);
    } catch {
      errors.webSite = 'Введите корректный URL.';
    }
  }

  if (otherContacts.length > 120) {
    errors.otherContacts = 'Максимум 120 символов.';
  }

  return errors;
}

function validatePassword(draft: PasswordDraft): PasswordErrors {
  const errors: PasswordErrors = {};

  if (!draft.currentPassword.trim()) {
    errors.currentPassword = 'Введите текущий пароль.';
  }

  if (!draft.newPassword.trim()) {
    errors.newPassword = 'Введите новый пароль.';
  } else if (draft.newPassword.length < 6) {
    errors.newPassword = 'Пароль должен содержать минимум 6 символов.';
  }

  if (!draft.confirmPassword.trim()) {
    errors.confirmPassword = 'Подтвердите новый пароль.';
  } else if (draft.confirmPassword !== draft.newPassword) {
    errors.confirmPassword = 'Пароли не совпадают.';
  }

  return errors;
}

function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{title}</h3>
            {subtitle ? <p className={styles.modalSubtitle}>{subtitle}</p> : null}
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AccountPage() {
  const navigate = useNavigate();
  const { refreshUser, logout, user } = useAuth();
  const { success, error: toastError } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');

  const [artistWorks, setArtistWorks] = useState<Artwork[]>([]);
  const [loadingWorks, setLoadingWorks] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteProfileOpen, setDeleteProfileOpen] = useState(false);
  const [deleteArtworkTarget, setDeleteArtworkTarget] = useState<Artwork | null>(null);

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyDraft);
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [profileTouched, setProfileTouched] = useState<Record<keyof ProfileDraft, boolean>>({
    displayName: false,
    bio: false,
    email: false,
    webSite: false,
    otherContacts: false,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordDraft, setPasswordDraft] = useState<PasswordDraft>(emptyPassword);
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [passwordTouched, setPasswordTouched] = useState<Record<keyof PasswordDraft, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const handleBack = () => {
    if (from) {
      navigate(from);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/catalog', { replace: true });
  };

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoadingProfile(true);
        setProfileError('');
        const data = await getMyProfile();
        if (ignore) return;
        setProfile(data);
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
    if (!profile || profile.role !== 'Artist') return;

    let ignore = false;

    async function loadWorks() {
      try {
        setLoadingWorks(true);
        const works = await getArtworksByArtistId(profile.userId);
        if (!ignore) setArtistWorks(works);
      } catch {
        if (!ignore) setArtistWorks([]);
      } finally {
        if (!ignore) setLoadingWorks(false);
      }
    }

    void loadWorks();

    return () => {
      ignore = true;
    };
  }, [profile]);

  const isArtist = profile?.role === 'Artist';
  const isAdmin = profile?.role === 'Admin';

  const roleLabel = useMemo(() => {
    const role = profile?.role;
    if (role === 'Admin') return 'Администратор';
    if (role === 'Artist') return 'Художник';
    return '';
  }, [profile?.role]);

  const initials = useMemo(() => {
    return getInitials(profile?.displayName || profile?.userName, 'U');
  }, [profile?.displayName, profile?.userName]);

  const contactItems = useMemo(
    () =>
      [
        profile?.contact?.email ? { label: 'Email', value: profile.contact.email } : null,
        profile?.contact?.website ? { label: 'Web-сайт', value: profile.contact.website } : null,
        profile?.contact?.otherContact
          ? { label: 'Другие контакты', value: profile.contact.otherContact }
          : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>,
    [profile]
  );

  const openEdit = () => {
    if (!profile) return;

    setProfileDraft({
      displayName: profile.displayName ?? '',
      bio: profile.bio ?? '',
      email: profile.contact?.email ?? '',
      webSite: profile.contact?.website ?? '',
      otherContacts: profile.contact?.otherContact ?? '',
    });

    setProfileErrors({});
    setProfileTouched({
      displayName: false,
      bio: false,
      email: false,
      webSite: false,
      otherContacts: false,
    });
    setEditOpen(true);
  };

  const openPassword = () => {
    setPasswordDraft(emptyPassword);
    setPasswordErrors({});
    setPasswordTouched({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
    setPasswordOpen(true);
  };

  const onProfileFieldChange = (field: keyof ProfileDraft, value: string) => {
    setProfileDraft((prev) => ({ ...prev, [field]: value }));
  };

  const onProfileFieldBlur = (field: keyof ProfileDraft) => {
    setProfileTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onPasswordFieldChange = (field: keyof PasswordDraft, value: string) => {
    setPasswordDraft((prev) => ({ ...prev, [field]: value }));
  };

  const onPasswordFieldBlur = (field: keyof PasswordDraft) => {
    setPasswordTouched((prev) => ({ ...prev, [field]: true }));
  };

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateProfile(profileDraft);
    setProfileErrors(nextErrors);
    setProfileTouched({
      displayName: true,
      bio: true,
      email: true,
      webSite: true,
      otherContacts: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      toastError('Ошибка', 'Проверьте поля профиля.');
      return;
    }

    try {
      setSavingProfile(true);

      const payload = {
        displayName: profileDraft.displayName.trim(),
        bio: profileDraft.bio.trim(),
        contact: {
          email: profileDraft.email.trim() || null,
          website: profileDraft.webSite.trim() || null,
          otherContact: profileDraft.otherContacts.trim() || null,
        } as ContactInfo,
      };

      const res = await updateMyProfile(payload);
      setProfile(res.profile);
      setEditOpen(false);
      success('Профиль', res.message);
      await refreshUser();
    } catch (err) {
      toastError('Ошибка', err instanceof Error ? err.message : 'Не удалось сохранить профиль');
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validatePassword(passwordDraft);
    setPasswordErrors(nextErrors);
    setPasswordTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      toastError('Ошибка', 'Проверьте поля смены пароля.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await changePassword({
        currentPassword: passwordDraft.currentPassword,
        newPassword: passwordDraft.newPassword,
      });

      success('Пароль', res.message);
      setPasswordOpen(false);
      setPasswordDraft(emptyPassword);
      setPasswordErrors({});
    } catch (err) {
      toastError('Ошибка', err instanceof Error ? err.message : 'Не удалось сменить пароль');
    } finally {
      setSavingPassword(false);
    }
  };

  const deleteProfile = async () => {
    try {
      await deleteMyProfile();
      logout();
      setDeleteProfileOpen(false);
      success('Профиль', 'Профиль удалён');
      navigate('/', { replace: true });
    } catch (err) {
      toastError('Ошибка', err instanceof Error ? err.message : 'Не удалось удалить профиль');
    }
  };

  const deleteArtworkConfirm = async () => {
    if (!deleteArtworkTarget) return;

    try {
      await deleteArtwork(deleteArtworkTarget.id);
      setArtistWorks((prev) => prev.filter((item) => item.id !== deleteArtworkTarget.id));
      success('Картина', 'Картина удалена');
      setDeleteArtworkTarget(null);
    } catch (err) {
      toastError('Ошибка', err instanceof Error ? err.message : 'Не удалось удалить картину');
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

  if (!profile) {
    return (
      <section className={styles.page}>
        <Container>
          <StateMessage title="Профиль не найден" />
        </Container>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <Container>
        <div className={styles.profileCard}>
          <div className={styles.avatar}>{initials}</div>

          <div className={styles.profileBody}>
            <div className={styles.profileTop}>
              <div>
                <div className={styles.handle}>@{profile.userName}</div>
                <h1 className={styles.name}>{profile.displayName || profile.userName}</h1>
                <div className={styles.metaLine}>На сайте с {formatDate(profile.createdAt)}</div>
              </div>

              {roleLabel ? <span className={styles.roleBadge}>{roleLabel}</span> : null}
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.primaryButton} onClick={openEdit}>
                Редактировать профиль
              </button>
              <button type="button" className={styles.secondaryButton} onClick={openPassword}>
                Сменить пароль
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => setDeleteProfileOpen(true)}>
                Удалить профиль
              </button>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>О себе</h2>
            <p className={styles.bio}>{profile.bio?.trim() ? profile.bio : 'Пока ничего не написано.'}</p>
          </section>

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Контакты</h2>

            {contactItems.length > 0 ? (
              <div className={styles.contacts}>
                {contactItems.map((item) => (
                  <div key={item.label} className={styles.contactRow}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>Контакты пока не заполнены.</p>
            )}
          </section>
        </div>

        {isArtist ? (
          <section className={styles.portfolio}>
            <div className={styles.portfolioHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Портфолио</h2>
                <p className={styles.portfolioHint}>
                  {loadingWorks ? 'Загрузка работ...' : `${artistWorks.length} работ`}
                </p>
              </div>
            </div>

            {artistWorks.length > 0 ? (
              <div className={styles.portfolioGrid}>
                {artistWorks.map((artwork) => (
                  <article key={artwork.id} className={styles.workCard}>
                    <Link to={`/artworks/${artwork.id}`} className={styles.workPreview}>
                      <div className={styles.workImageWrap}>
                        <img className={styles.workImage} src={toImageUrl(artwork.mainImageUrl)} alt={artwork.title} />
                      </div>

                      <div className={styles.workInfo}>
                        <div className={styles.workTopRow}>
                          <p className={styles.workCategory}>{artwork.category}</p>
                          <p className={styles.workPrice}>{artwork.price.toFixed(2)} ₽</p>
                        </div>
                        <h3 className={styles.workTitle}>{artwork.title}</h3>
                        <p className={styles.workMeta}>
                          {artwork.style} · {artwork.material}
                        </p>
                        <p className={styles.workMeta}>В наличии: {artwork.quantity > 0 ? 'Да' : 'Нет'}</p>
                      </div>
                    </Link>

                    <div className={styles.workActions}>
                      <Link to={`/artworks/edit/${artwork.id}`} className={styles.workEditButton}>
                        Редактировать
                      </Link>
                      <button
                        type="button"
                        className={styles.workDeleteButton}
                        onClick={() => setDeleteArtworkTarget(artwork)}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyPortfolio}>
                <StateMessage
                  title="Работ пока нет"
                  description="Создайте первую картину, чтобы она появилась в портфолио."
                />
              </div>
            )}
          </section>
        ) : null}

        <ModalShell
          open={editOpen}
          title="Редактирование профиля"
          subtitle="Обновите имя, описание и контакты."
          onClose={() => setEditOpen(false)}
        >
          <form className={styles.modalForm} onSubmit={submitProfile} noValidate>
            <label className={styles.field}>
              <span>Имя</span>
              <input
                className={styles.input}
                value={profileDraft.displayName}
                onChange={(e) => onProfileFieldChange('displayName', e.target.value)}
                onBlur={() => onProfileFieldBlur('displayName')}
              />
              {profileTouched.displayName && profileErrors.displayName ? (
                <div className={styles.error}>{profileErrors.displayName}</div>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>О себе</span>
              <textarea
                className={styles.textarea}
                value={profileDraft.bio}
                onChange={(e) => onProfileFieldChange('bio', e.target.value)}
                onBlur={() => onProfileFieldBlur('bio')}
              />
              {profileTouched.bio && profileErrors.bio ? (
                <div className={styles.error}>{profileErrors.bio}</div>
              ) : null}
            </label>

            <div className={styles.groupTitle}>Контакты</div>

            <label className={styles.field}>
              <span>Email</span>
              <input
                className={styles.input}
                value={profileDraft.email}
                onChange={(e) => onProfileFieldChange('email', e.target.value)}
                onBlur={() => onProfileFieldBlur('email')}
              />
              {profileTouched.email && profileErrors.email ? (
                <div className={styles.error}>{profileErrors.email}</div>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Web-сайт</span>
              <input
                className={styles.input}
                value={profileDraft.webSite}
                onChange={(e) => onProfileFieldChange('webSite', e.target.value)}
                onBlur={() => onProfileFieldBlur('webSite')}
              />
              {profileTouched.webSite && profileErrors.webSite ? (
                <div className={styles.error}>{profileErrors.webSite}</div>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Другие контакты</span>
              <input
                className={styles.input}
                value={profileDraft.otherContacts}
                onChange={(e) => onProfileFieldChange('otherContacts', e.target.value)}
                onBlur={() => onProfileFieldBlur('otherContacts')}
              />
              {profileTouched.otherContacts && profileErrors.otherContacts ? (
                <div className={styles.error}>{profileErrors.otherContacts}</div>
              ) : null}
            </label>

            <div className={styles.modalActions}>
              <button type="submit" className={styles.primaryButton} disabled={savingProfile}>
                {savingProfile ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => setEditOpen(false)}>
                Отмена
              </button>
            </div>
          </form>
        </ModalShell>

        <ModalShell
          open={passwordOpen}
          title="Смена пароля"
          subtitle="Введите текущий пароль и новый."
          onClose={() => setPasswordOpen(false)}
        >
          <form className={styles.modalForm} onSubmit={submitPassword} noValidate>
            <label className={styles.field}>
              <span>Текущий пароль</span>
              <input
                className={styles.input}
                type="password"
                value={passwordDraft.currentPassword}
                onChange={(e) => onPasswordFieldChange('currentPassword', e.target.value)}
                onBlur={() => onPasswordFieldBlur('currentPassword')}
              />
              {passwordTouched.currentPassword && passwordErrors.currentPassword ? (
                <div className={styles.error}>{passwordErrors.currentPassword}</div>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Новый пароль</span>
              <input
                className={styles.input}
                type="password"
                value={passwordDraft.newPassword}
                onChange={(e) => onPasswordFieldChange('newPassword', e.target.value)}
                onBlur={() => onPasswordFieldBlur('newPassword')}
              />
              {passwordTouched.newPassword && passwordErrors.newPassword ? (
                <div className={styles.error}>{passwordErrors.newPassword}</div>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Подтвердите новый пароль</span>
              <input
                className={styles.input}
                type="password"
                value={passwordDraft.confirmPassword}
                onChange={(e) => onPasswordFieldChange('confirmPassword', e.target.value)}
                onBlur={() => onPasswordFieldBlur('confirmPassword')}
              />
              {passwordTouched.confirmPassword && passwordErrors.confirmPassword ? (
                <div className={styles.error}>{passwordErrors.confirmPassword}</div>
              ) : null}
            </label>

            <div className={styles.modalActions}>
              <button type="submit" className={styles.primaryButton} disabled={savingPassword}>
                {savingPassword ? 'Сохранение...' : 'Сменить пароль'}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => setPasswordOpen(false)}>
                Отмена
              </button>
            </div>
          </form>
        </ModalShell>

        <ConfirmDialog
          open={deleteProfileOpen}
          title="Удалить профиль?"
          message="Это действие удалит ваш профиль без возможности восстановления."
          confirmText="Удалить"
          onCancel={() => setDeleteProfileOpen(false)}
          onConfirm={deleteProfile}
        />

        <ConfirmDialog
          open={!!deleteArtworkTarget}
          title="Удалить картину?"
          message={deleteArtworkTarget ? `Картина «${deleteArtworkTarget.title}» будет удалена.` : ''}
          confirmText="Удалить"
          onCancel={() => setDeleteArtworkTarget(null)}
          onConfirm={deleteArtworkConfirm}
        />
      </Container>
    </section>
  );
}