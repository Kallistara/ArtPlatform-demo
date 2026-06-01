import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { useToast } from '../../shared/ui/Notifications/ToastProvider';
import {
  getMyFavorites,
  removeFromFavorites,
  type FavoriteItem,
} from '../../shared/api/favorites.api';
import { toImageUrl } from '../../shared/lib/image';
import styles from './FavoritesPage.module.css';

export function FavoritesPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const isAdmin = user?.role === 'Admin';

  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      setLoading(false);
      return;
    }

    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await getMyFavorites();
        if (!ignore) setItems(data);
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : 'Ошибка загрузки избранного');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [isAdmin]);

  const handleRemove = async (artworkId: string) => {
    try {
      setRemovingId(artworkId);
      await removeFromFavorites(artworkId);
      setItems((prev) => prev.filter((item) => item.artworkId !== artworkId));
      success('Избранное', 'Картина удалена из избранного');
    } catch (e) {
      toastError('Ошибка', e instanceof Error ? e.message : 'Не удалось удалить из избранного');
    } finally {
      setRemovingId(null);
    }
  };

  if (isAdmin) {
    return (
      <section className={styles.page}>
        <Container>
          <StateMessage
            title="Раздел недоступен"
            description="Избранное не используется для администратора."
          />
        </Container>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <Container>
        <div className={styles.header}>
          <h1 className={styles.title}>Избранное</h1>
          <p className={styles.subtitle}>Картины, которые Вам понравились.</p>
        </div>

        {loading ? <StateMessage title="Загрузка избранного..." /> : null}
        {error ? <StateMessage title="Ошибка" description={error} /> : null}

        {!loading && !error && items.length === 0 ? (
          <StateMessage title="В избранном пока ничего нет." description="Нажмите на сердечко, чтобы добавить картину в избранное." />
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className={styles.grid}>
            {items.map((item) => (
              <article key={item.id} className={styles.card}>
                <Link to={`/artworks/${item.artworkId}`} className={styles.link}>
                  <div className={styles.imageWrap}>
                    <img className={styles.image} src={toImageUrl(item.mainImageUrl)} alt={item.artworkTitle} />
                  </div>

                  <div className={styles.body}>
                    <div className={styles.topRow}>
                      <p className={styles.category}>{item.category}</p>
                      <p className={styles.price}>{item.price.toFixed(2)} ₽</p>
                    </div>

                    <h3 className={styles.titleCard}>{item.artworkTitle}</h3>
                    <p className={styles.artist}>{item.artistName}</p>
                  </div>
                </Link>

                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemove(item.artworkId)}
                  disabled={removingId === item.artworkId}
                >
                  {removingId === item.artworkId ? '...' : 'Убрать'}
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}