import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { getArtworkById, type Artwork } from '../../shared/api/artworks.api';
import styles from './ArtworkPage.module.css';

export function ArtworkPage() {
  const { id } = useParams();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await getArtworkById(id);
        if (!ignore) setArtwork(data);
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) return <section className={styles.page}><Container>Загрузка...</Container></section>;
  if (error) return <section className={styles.page}><Container>{error}</Container></section>;
  if (!artwork) return <section className={styles.page}><Container>Картина не найдена</Container></section>;

  return (
    <section className={styles.page}>
      <Container>
        <div className={styles.layout}>
          <div className={styles.imageWrap}>
            <img className={styles.image} src={artwork.mainImageUrl} alt={artwork.title} />
          </div>

          <div className={styles.info}>
            <p className={styles.artist}>{artwork.artistName}</p>
            <h1 className={styles.title}>{artwork.title}</h1>
            <p className={styles.price}>${artwork.price.toFixed(2)}</p>
            <p className={styles.description}>{artwork.description}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}