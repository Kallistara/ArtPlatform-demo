import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getArtworks, type Artwork } from '../../shared/api/artworks.api';
import { getProfileByUserId, type UserProfile } from '../../shared/api/profile.api';
import { ArtworkCard } from '../../entities/artwork/ArtworkCard';
import { ARTWORK_CATEGORIES } from '../../shared/config/ArtworkOptions';
//import { toImageUrl } from '../../shared/lib/image';
import styles from './HomeShowcase.module.css';

type CollectionTile = {
  title: string;
  subtitle: string;
  to: string;
  className: string;
};

export function HomeShowcase() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [artists, setArtists] = useState<UserProfile[]>([]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await getArtworks();
        if (ignore) return;

        setArtworks(data);

        const uniqueArtistIds = Array.from(new Set(data.map((item) => item.artistId))).slice(0, 6);
        const profiles = await Promise.all(
          uniqueArtistIds.map((artistId) => getProfileByUserId(artistId).catch(() => null))
        );

        if (!ignore) {
          setArtists(profiles.filter(Boolean) as UserProfile[]);
        }
      } catch {
        if (!ignore) {
          setArtworks([]);
          setArtists([]);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  const featuredWorks = useMemo(() => artworks.slice(0, 8), [artworks]);

  const collections: CollectionTile[] = [
    {
      title: 'Абстракция',
      subtitle: 'Смелые формы и цвет',
      to: '/catalog?category=Абстракция',
      className: styles.tileWide,
    },
    {
      title: 'Портреты',
      subtitle: 'Личность, взгляд, настроение',
      to: '/catalog?category=Портрет',
      className: styles.tileTall,
    },
    {
      title: 'Пейзажи',
      subtitle: 'Тишина пространства',
      to: '/catalog?category=Пейзаж',
      className: styles.tileWide,
    },
    {
      title: 'Натюрморт',
      subtitle: 'Собранная композиция',
      to: '/catalog?category=Натюрморт',
      className: styles.tileSmall,
    },
    {
      title: 'До $500',
      subtitle: 'Коллекции для старта',
      to: '/catalog?maxPrice=500',
      className: styles.tileSmall,
    },
  ];

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>Curated collections</p>
            <h2 className={styles.title}>Подборки, которые помогают быстро найти нужное</h2>
          </div>
          <Link to="/catalog" className={styles.link}>Смотреть все</Link>
        </div>

        <div className={styles.collectionsGrid}>
          {collections.map((item) => (
            <Link key={item.title} to={item.to} className={`${styles.collectionTile} ${item.className}`}>
              <span className={styles.collectionTitle}>{item.title}</span>
              <span className={styles.collectionSubtitle}>{item.subtitle}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>Featured works</p>
            <h2 className={styles.title}>Картины, на которые стоит обратить внимание</h2>
          </div>
          <Link to="/catalog" className={styles.link}>В каталог</Link>
        </div>

        <div className={styles.worksGrid}>
          {featuredWorks.map((work) => (
            <ArtworkCard
              key={work.id}
              id={work.id}
              title={work.title}
              artistName={work.artistName}
              price={work.price}
              imageUrl={work.mainImageUrl}
              category={work.category}
            />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>Meet the artists</p>
            <h2 className={styles.title}>Авторы, которых уже стоит открыть</h2>
          </div>
          <Link to="/catalog" className={styles.link}>Все авторы</Link>
        </div>

        <div className={styles.artistsGrid}>
          {artists.map((artist) => (
            <Link key={artist.userId} to={`/artists/${artist.userId}`} className={styles.artistCard}>
              <div className={styles.artistAvatar}>
                <span>{(artist.displayName || artist.userName).slice(0, 1).toUpperCase()}</span>
              </div>
              <div className={styles.artistName}>{artist.displayName || artist.userName}</div>
              <div className={styles.artistHandle}>@{artist.userName}</div>
              <div className={styles.artistBio}>{artist.bio || 'Автор платформы'}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.storySection}>
        <div className={styles.storyCard}>
          <p className={styles.kicker}>For collectors</p>
          <h2 className={styles.storyTitle}>Подобранные работы, авторы и коллекции в одном месте</h2>
          <p className={styles.storyText}>
            Главная должна не просто показывать работы, а помогать быстро переходить к нужному маршруту:
            коллекция, автор, конкретная картина или каталог с фильтрами.
          </p>
          <div className={styles.storyActions}>
            <Link to="/catalog" className={styles.primaryBtn}>Открыть каталог</Link>
            <Link to="/register" className={styles.secondaryBtn}>Создать аккаунт</Link>
          </div>
        </div>

        <div className={styles.storyStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{ARTWORK_CATEGORIES.length}</span>
            <span className={styles.statLabel}>основных направлений</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{artists.length || 0}</span>
            <span className={styles.statLabel}>авторов на витрине</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{featuredWorks.length}</span>
            <span className={styles.statLabel}>картин в подборке</span>
          </div>
        </div>
      </section>

      <section className={styles.bottomStrip}>
        <div className={styles.bottomItem}>
          <strong>Удобный поиск</strong>
          <span>Картины, авторы, категории, стили и материалы</span>
        </div>
        <div className={styles.bottomItem}>
          <strong>Избранное и корзина</strong>
          <span>Сохраняй и собирай работы для возвращения позже</span>
        </div>
        <div className={styles.bottomItem}>
          <strong>Публичные профили</strong>
          <span>Быстрый переход к автору и его работам</span>
        </div>
      </section>
    </div>
  );
}