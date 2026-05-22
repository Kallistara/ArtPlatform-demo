import { useEffect, useState } from 'react';
import { Container } from '../../shared/ui/Container/Container';
import { SearchBar } from '../../features/search-artwork/SearchBar';
import { ArtworkCard } from '../../entities/artwork/ArtworkCard';
import { getArtworks, type Artwork } from '../../shared/api/artworks.api';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import styles from './CatalogPage.module.css';

export function CatalogPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await getArtworks();
        if (!ignore) setArtworks(data);
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : 'Ошибка загрузки каталога');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredArtworks = artworks.filter((artwork) => {
    const text = `${artwork.title} ${artwork.artistName} ${artwork.category} ${artwork.style} ${artwork.material}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  return (
    <section className={styles.page}>
      <Container>
        <div className={styles.header}>
          <h1 className={styles.title}>Каталог</h1>
          <p className={styles.subtitle}>Здесь будет поиск, фильтры и сетка картин.</p>
        </div>

        <div className={styles.searchRow}>
          <SearchBar value={query} onChange={setQuery} placeholder="Поиск по каталогу..." />
        </div>

        {loading ? <StateMessage title="Загрузка каталога..." /> : null}
        {error ? <StateMessage title="Ошибка" description={error} /> : null}

        {!loading && !error && filteredArtworks.length === 0 ? (
          <StateMessage title="Ничего не найдено" description="Попробуйте изменить запрос поиска." />
        ) : null}

        {!loading && !error && filteredArtworks.length > 0 ? (
          <div className={styles.grid}>
            {filteredArtworks.map((artwork) => (
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
        ) : null}
      </Container>
    </section>
  );
}