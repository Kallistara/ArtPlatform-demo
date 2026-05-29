import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './PopularArtworks.module.css';
import { getArtworks, type Artwork } from '../../shared/api/artworks.api';
import { ArtworkCard } from '../../entities/artwork/ArtworkCard';

export function PopularArtworks() {
  const [items, setItems] = useState<Artwork[]>([]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await getArtworks();
        if (!ignore) setItems(data.slice(0, 8));
      } catch {
        if (!ignore) setItems([]);
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
          <h2 className={styles.title}>Новые и популярные картины</h2>
          <Link to="/catalog" className={styles.link}>Перейти в каталог</Link>
        </div>

        {items.length > 0 ? (
          <div className={styles.grid}>
            {items.map((item) => (
              <ArtworkCard
                key={item.id}
                id={item.id}
                title={item.title}
                artistName={item.artistName}
                price={item.price}
                imageUrl={item.mainImageUrl}
                category={item.category}
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>Пока нет картин для отображения.</div>
        )}
      </div>
    </section>
  );
}