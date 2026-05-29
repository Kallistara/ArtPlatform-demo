import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getArtworks } from '../../shared/api/artworks.api';
import { getProfileByUserId, type UserProfile } from '../../shared/api/profile.api';
import { toImageUrl } from '../../shared/lib/image';
import styles from './FeaturedArtists.module.css';

type ArtistCard = {
  userId: string;
  displayName: string;
  userName: string;
  avatarUrl?: string | null;
  bio?: string;
};

export function FeaturedArtists() {
  const [artists, setArtists] = useState<ArtistCard[]>([]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const artworks = await getArtworks();
        const uniqueIds = Array.from(new Set(artworks.map((item) => item.artistId))).slice(0, 6);

        const profiles = await Promise.all(
          uniqueIds.map((artistId) => getProfileByUserId(artistId).catch(() => null))
        );

        const cards = profiles
          .filter(Boolean)
          .map((profile) => profile as UserProfile)
          .map((profile) => ({
            userId: profile.userId,
            displayName: profile.displayName || profile.userName,
            userName: profile.userName,
            avatarUrl: profile.avatarUrl ?? null,
            bio: profile.bio,
          }));

        if (!ignore) setArtists(cards);
      } catch {
        if (!ignore) setArtists([]);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h2 className={styles.title}>Авторы</h2>
          <Link to="/catalog" className={styles.link}>Смотреть все</Link>
        </div>

        {artists.length > 0 ? (
          <div className={styles.grid}>
            {artists.map((artist) => (
              <Link key={artist.userId} to={`/artists/${artist.userId}`} className={styles.card}>
                <div className={styles.avatar}>
                  {artist.avatarUrl ? (
                    <img src={toImageUrl(artist.avatarUrl)} alt={artist.displayName} />
                  ) : (
                    <span>{artist.displayName.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>

                <div className={styles.name}>{artist.displayName}</div>
                <div className={styles.handle}>@{artist.userName}</div>
                <div className={styles.bio}>{artist.bio || 'Автор платформы'}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>Пока нет авторов для отображения.</div>
        )}
      </div>
    </section>
  );
}