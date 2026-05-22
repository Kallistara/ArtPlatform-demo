import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { getArtworkById, type Artwork } from '../../shared/api/artworks.api';
import { addToFavorites, removeFromFavorites, isFavorite } from '../../shared/api/favorites.api';
import { addToCart, removeFromCart, isInCart } from '../../shared/api/cart.api';
import styles from './ArtworkPage.module.css';

export function ArtworkPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [favorite, setFavorite] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [busyFavorite, setBusyFavorite] = useState(false);
  const [busyCart, setBusyCart] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

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
        if (!ignore) setError(e instanceof Error ? e.message : 'Ошибка загрузки картины');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;

    let ignore = false;

    async function loadFlags() {
      try {
        const [fav, cart] = await Promise.all([isFavorite(id), isInCart(id)]);
        if (!ignore) {
          setFavorite(fav.isFavorite);
          setInCart(cart.isInCart);
        }
      } catch {
        if (!ignore) {
          setFavorite(false);
          setInCart(false);
        }
      }
    }

    loadFlags();

    return () => {
      ignore = true;
    };
  }, [id, isAuthenticated]);

  const onToggleFavorite = async () => {
    if (!id) return;
    setBusyFavorite(true);
    setActionMessage('');

    try {
      if (favorite) {
        await removeFromFavorites(id);
        setFavorite(false);
        setActionMessage('Удалено из избранного');
      } else {
        await addToFavorites(id);
        setFavorite(true);
        setActionMessage('Добавлено в избранное');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка операции с избранным');
    } finally {
      setBusyFavorite(false);
    }
  };

  const onToggleCart = async () => {
    if (!id) return;
    setBusyCart(true);
    setActionMessage('');

    try {
      if (inCart) {
        await removeFromCart(id);
        setInCart(false);
        setActionMessage('Удалено из корзины');
      } else {
        await addToCart(id);
        setInCart(true);
        setActionMessage('Добавлено в корзину');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка операции с корзиной');
    } finally {
      setBusyCart(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <Container>
          <StateMessage title="Загрузка картины..." />
        </Container>
      </section>
    );
  }

  if (error) {
    const isNotFound = error.toLowerCase().includes('404') || error.toLowerCase().includes('not found');

    return (
      <section className={styles.page}>
        <Container>
          <StateMessage
            title={isNotFound ? 'Картина не найдена' : 'Ошибка загрузки'}
            description={isNotFound ? 'Возможно, ссылка устарела или картина была удалена.' : error}
          />
        </Container>
      </section>
    );
  }

  if (!artwork) {
    return (
      <section className={styles.page}>
        <Container>
          <StateMessage title="Картина не найдена" />
        </Container>
      </section>
    );
  }

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

            <div className={styles.meta}>
              <div>Категория: {artwork.category}</div>
              <div>Стиль: {artwork.style}</div>
              <div>Материал: {artwork.material}</div>
              <div>Размер: {artwork.width} × {artwork.height}</div>
              <div>Доступно: {artwork.isAvailable ? 'Да' : 'Нет'}</div>
            </div>

            {isAuthenticated ? (
              <div className={styles.actions}>
                <button type="button" onClick={onToggleFavorite} disabled={busyFavorite}>
                  {busyFavorite ? '...' : favorite ? 'Убрать из избранного' : 'В избранное'}
                </button>
                <button type="button" onClick={onToggleCart} disabled={busyCart}>
                  {busyCart ? '...' : inCart ? 'Убрать из корзины' : 'В корзину'}
                </button>
              </div>
            ) : (
              <p className={styles.description}>Войдите, чтобы добавлять в избранное и корзину.</p>
            )}

            {actionMessage ? <StateMessage title="Готово" description={actionMessage} /> : null}
          </div>
        </div>
      </Container>
    </section>
  );
}