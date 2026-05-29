import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { getProfileByUserId, type UserProfile } from '../../shared/api/profile.api';
import { getArtworksByArtistId, type Artwork } from '../../shared/api/artworks.api';
import { ArtworkCard } from '../../entities/artwork/ArtworkCard';
import styles from './ArtistPage.module.css';

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

export function ArtistPage() {
  const { userId } = useParams<{ userId: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const [profileData, artworksData] = await Promise.all([
          getProfileByUserId(userId),
          getArtworksByArtistId(userId),
        ]);

        if (ignore) return;

        setProfile(profileData);
        setArtworks(artworksData);
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : 'Ошибка загрузки страницы автора');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [userId]);

  const roleLabel = useMemo(() => {
    const role = profile?.role;
    if (role === 'Admin') return 'Администратор';
    if (role === 'Artist') return 'Художник';
    return '';
  }, [profile?.role]);

  const initials = useMemo(() => {
    return getInitials(profile?.displayName || profile?.userName, 'A');
  }, [profile?.displayName, profile?.userName]);

  if (loading) {
    return (
      <section className={styles.page}>
        <Container>
          <StateMessage title="Загрузка автора..." />
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.page}>
        <Container>
          <StateMessage title="Ошибка" description={error} />
        </Container>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className={styles.page}>
        <Container>
          <StateMessage title="Автор не найден" />
        </Container>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <Container>
        <div className={styles.hero}>
          <div className={styles.avatar}>{initials}</div>

          <div className={styles.heroBody}>
            <div className={styles.topLine}>
              <div>
                <div className={styles.handle}>@{profile.userName}</div>
                <h1 className={styles.title}>{profile.displayName || profile.userName}</h1>
              </div>

              {roleLabel ? <span className={styles.roleBadge}>{roleLabel}</span> : null}
            </div>

            <p className={styles.bio}>
              {profile.bio?.trim() ? profile.bio : 'Пока автор ничего о себе не рассказал.'}
            </p>

            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <span>На сайте с</span>
                <strong>{formatDate(profile.createdAt)}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Работ</span>
                <strong>{artworks.length}</strong>
              </div>
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Работы автора</h2>
            <span className={styles.sectionHint}>Все картины этого профиля</span>
          </div>

          {artworks.length > 0 ? (
            <div className={styles.grid}>
              {artworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          ) : (
            <StateMessage
              title="Работ пока нет"
              description="У этого автора ещё не опубликовано ни одной картины."
            />
          )}
        </section>
      </Container>
    </section>
  );
}