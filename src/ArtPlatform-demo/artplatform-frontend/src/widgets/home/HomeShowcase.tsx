import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getArtworks, type Artwork } from '../../shared/api/artworks.api';
import { getProfileByUserId, type UserProfile } from '../../shared/api/profile.api';
import { ArtworkCard } from '../../entities/artwork/ArtworkCard';
import { ARTWORK_CATEGORIES } from '../../shared/config/ArtworkOptions';
import styles from './HomeShowcase.module.css';

import abstractImg from '../../shared/assets/home/collections/abstract_1.jpg';
import landscapeImg from '../../shared/assets/home/collections/landcsape_1.jpg';
import animalImg from '../../shared/assets/home/collections/animal_1.jpg';
import minimalImg from '../../shared/assets/home/collections/min_1.jpg';
import newImg from '../../shared/assets/home/collections/new_1.jpg';

type CollectionTile = {
  title: string;
  subtitle: string;
  to: string;
  className: string;
  image: string;
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
      title: 'Абстракционизм',
      subtitle: 'Отвлеченное искусство',
      to: '/catalog?style=Абстракционизм',
      className: styles.tileWide,
      image: abstractImg,
    },
    {
      title: 'Современное',
      subtitle: 'Концептуальность, новаторство, перфоманс',
      to: '/catalog?style=Современный',
      className: styles.tileTall,
      image: newImg,
    },
    {
      title: 'Пейзажи',
      subtitle: 'Природа - первозданая и измененная',
      to: '/catalog?style=Пейзаж',
      className: styles.tileWide,
      image: landscapeImg,
    },
    {
      title: 'Минимализм',
      subtitle: 'Простота и объективность',
      to: '/catalog?style=Минимализм',
      className: styles.tileSmall,
      image: minimalImg,
    },
    {
      title: 'Животные',
      subtitle: 'Домашние и дикие животные',
      to: '/catalog?style=Анималистика',
      className: styles.tileSmall,
      image: animalImg,
    },
  ];

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.heading}>
            <p className={styles.kicker}>Популярные коллекции</p>
            <h2 className={styles.title}>Подборки, которые помогают быстро найти подходящую картину</h2>
          </div>
          <Link to="/catalog" className={styles.sectionLink}>Смотреть все</Link>
        </div>

        <div className={styles.collectionsGrid}>
          {collections.map((item) => (
            <Link key={item.title} to={item.to} className={`${styles.collectionTile} ${item.className}`}>
              <img src={item.image} alt={item.title} className={styles.collectionImage} />
              <span className={styles.collectionOverlay} />
              <span className={styles.collectionTitle}>{item.title}</span>
              <span className={styles.collectionSubtitle}>{item.subtitle}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>Популярные работы</p>
            <h2 className={styles.title}>Картины, на которые стоит обратить внимание</h2>
          </div>
          <Link to="/catalog" className={styles.sectionLink}>В каталог</Link>
        </div>

        <div className={styles.worksGrid}>
          {featuredWorks.map((work) => (
            <div key={work.id} className={styles.featuredItem}>
              <ArtworkCard artwork={work} />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>Молодые художники</p>
            <h2 className={styles.title}>Авторы, стремительно набирающие популярность</h2>
          </div>
          <Link to="/catalog" className={styles.sectionLink}>К художникам</Link>
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
          <p className={styles.kicker}>Для коллекционеров</p>
          <h2 className={styles.storyTitle}>Популярные работы, новые художники, разные стили в одном месте</h2>
          <p className={styles.storyText}>
            Платформа предлагает возможность поиска подходящей работы, а также быстрое и простое оформления заказа из своего аккаунта.
          </p>
          <div className={styles.storyActions}>
            <Link to="/catalog" className={styles.primaryBtn}>Открыть каталог</Link>
            <Link to="/register" className={styles.secondaryBtn}>Создать аккаунт</Link>
          </div>
        </div>

        <div className={styles.storyStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{ARTWORK_CATEGORIES.length}</span>
            <span className={styles.statLabel}>основных категорий</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{artists.length || 0}</span>
            <span className={styles.statLabel}>проверенных художников</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{featuredWorks.length}</span>
            <span className={styles.statLabel}>картин на платформе</span>
          </div>
        </div>
      </section>

      <section className={styles.bottomStrip}>
        <div className={styles.bottomItem}>
          <strong>Удобный поиск</strong>
          <span>Картины, художники, категории, стили и материалы</span>
        </div>
        <div className={styles.bottomItem}>
          <strong>Избранное и корзина</strong>
          <span>Сохранение понравившихся работ</span>
        </div>
        <div className={styles.bottomItem}>
          <strong>Публичные профили</strong>
          <span>Просмотр профиля художника и возможность написать ему</span>
        </div>
      </section>
    </div>
  );
}