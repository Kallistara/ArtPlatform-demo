import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../shared/ui/Notifications/ToastProvider';
import { addToFavorites, isFavorite, removeFromFavorites } from '../../shared/api/favorites.api';
import type { Artwork } from '../../shared/api/artworks.api';
import { toImageUrl } from '../../shared/lib/image';
import styles from './ArtworkCard.module.css';

type ArtworkCardProps = {
  artwork?: Artwork | null;
  showFavorite?: boolean;
};

export function ArtworkCard({ artwork, showFavorite = true }: ArtworkCardProps) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { success, error: toastError } = useToast();
  const canFavorite = Boolean(showFavorite && isAuthenticated && user?.role !== 'Admin' && artwork?.id);

  const [favorite, setFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!canFavorite || !artwork?.id) {
        setFavorite(false);
        return;
      }

      try {
        const res = await isFavorite(artwork.id);
        if (!ignore) setFavorite(res.isFavorite);
      } catch {
        if (!ignore) setFavorite(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [artwork?.id, canFavorite]);

  const onToggleFavorite = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canFavorite || !artwork?.id) return;

    try {
      setLoadingFavorite(true);

      if (favorite) {
        await removeFromFavorites(artwork.id);
        setFavorite(false);
        success('Избранное', 'Удалено из избранного');
      } else {
        await addToFavorites(artwork.id);
        setFavorite(true);
        success('Избранное', 'Добавлено в избранное');
      }
    } catch (err) {
      toastError('Ошибка', err instanceof Error ? err.message : 'Не удалось изменить избранное');
    } finally {
      setLoadingFavorite(false);
    }
  };

  if (!artwork) return null;

  return (
    <article className={styles.card}>
      {canFavorite ? (
        <button
          type="button"
          className={styles.favoriteButton}
          onClick={onToggleFavorite}
          aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          disabled={loadingFavorite}
        >
          {favorite ? '♥' : '♡'}
        </button>
      ) : null}

      <Link
        to={`/artworks/${artwork.id}`}
        state={{ from: `${location.pathname}${location.search}` }}
        className={styles.link}
      >
        <div className={styles.imageWrap}>
          <img className={styles.image} src={toImageUrl(artwork.mainImageUrl)} alt={artwork.title} />
        </div>

        <div className={styles.body}>
          <div className={styles.topRow}>
            <p className={styles.category}>{artwork.category}</p>
            <p className={styles.price}>${artwork.price.toFixed(2)}</p>
          </div>

          <h3 className={styles.title}>{artwork.title}</h3>
          <p className={styles.artist}>{artwork.artistName}</p>

          <div className={styles.availability}>
            {artwork.quantity > 0 ? 'В наличии' : 'Нет в наличии'}
          </div>
        </div>
      </Link>
    </article>
  );
}