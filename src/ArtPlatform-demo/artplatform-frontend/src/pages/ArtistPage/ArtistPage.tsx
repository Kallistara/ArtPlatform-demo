import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { ArtworkCard } from '../../entities/artwork/ArtworkCard';
import { toImageUrl } from '../../shared/ib/image';
import { getProfileByUserId, type UserProfile } from '../../shared/api/profile.api';
import { getArtworksByArtistId, type Artwork } from '../../shared/api/artworks.api';
import styles from './ArtistPage.module.css';

export function ArtistPage() {
  const { userId } = useParams<{ userId: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const artistId = userId;

    if (!artistId) {
      setError('Некорректный id автора');
      setLoading(false);
      return;
    }

    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const [profileData, artworksData] = await Promise.all([
          getProfileByUserId(artistId),
          getArtworksByArtistId(artistId),
        ]);

        if (ignore) return;

        setProfile(profileData);
        setArtworks(artworksData);
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : 'Ошибка загрузки автора');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [userId]);

  const avatarContent = useMemo(() => {
    const name = profile?.displayName || profile?.userName || 'A';
    return name.slice(0, 1).toUpperCase();
  }, [profile]);

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
        <div className={styles.header}>
          <div className={styles.avatar}>
            {profile.avatarUrl ? (
              <img src={toImageUrl(profile.avatarUrl)} alt={profile.displayName || profile.userName} />
            ) : (
              <span>{avatarContent}</span>
            )}
          </div>

          <div className={styles.info}>
            <p className={styles.label}>Автор</p>
            <h1 className={styles.title}>{profile.displayName || profile.userName}</h1>
            <p className={styles.subtitle}>@{profile.userName}</p>
            <p className={styles.bio}>{profile.bio || 'Пока без описания.'}</p>
          </div>
        </div>

        <div className={styles.meta}>
          <div>Роль: {profile.role}</div>
          <div>Создан: {profile.createdAt}</div>
          <div>Обновлён: {profile.updatedAt}</div>
        </div>

        <div className={styles.block}>
          <h2 className={styles.blockTitle}>Все работы автора</h2>

          {artworks.length > 0 ? (
            <div className={styles.grid}>
              {artworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  id={artwork.id}
                  title={artwork.title}
                  artistName={artwork.artistName}
                  price={artwork.price}
                  imageUrl={artwork.mainImageUrl}
                  category={artwork.category}
                />
              ))}
            </div>
          ) : (
            <StateMessage title="Пока нет работ" description="У этого автора ещё нет опубликованных картин." />
          )}
        </div>

        <div className={styles.actions}>
          <Link to="/catalog" className={styles.backLink}>
            Вернуться в каталог
          </Link>
        </div>
      </Container>
    </section>
  );
}