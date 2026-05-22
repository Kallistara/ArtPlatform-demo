import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { useAuth } from '../../app/providers/AuthProvider';
import {
  getMyFavorites,
  removeFromFavorites,
  type FavoriteItem,
} from '../../shared/api/favorites.api';

export function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

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

    load();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  const onRemove = async (artworkId: string) => {
    await removeFromFavorites(artworkId);
    setItems((prev) => prev.filter((item) => item.artworkId !== artworkId));
  };

  if (!isAuthenticated) {
    return (
      <section style={{ padding: '48px 24px 80px' }}>
        <Container>
          <StateMessage title="Требуется вход" description="Чтобы открыть избранное, войдите в аккаунт." />
        </Container>
      </section>
    );
  }

  return (
    <section style={{ padding: '48px 24px 80px' }}>
      <Container>
        <h1 style={{ margin: '0 0 16px', fontSize: 40 }}>Избранное</h1>

        {loading ? <StateMessage title="Загрузка избранного..." /> : null}
        {error ? <StateMessage title="Ошибка" description={error} /> : null}

        {!loading && !error && items.length === 0 ? (
          <StateMessage title="Избранное пусто" description="Добавьте картины, чтобы собрать свою подборку." />
        ) : null}

        <div style={{ display: 'grid', gap: 16 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: 16, alignItems: 'center' }}>
              <Link to={`/artworks/${item.artworkId}`}>
                <img src={item.mainImageUrl} alt={item.artworkTitle} style={{ width: 96, height: 96, objectFit: 'cover' }} />
              </Link>

              <div>
                <div style={{ fontWeight: 700 }}>{item.artworkTitle}</div>
                <div>{item.artistName}</div>
                <div>{item.category}</div>
                <div>${item.price.toFixed(2)}</div>
              </div>

              <button type="button" onClick={() => onRemove(item.artworkId)}>
                Удалить
              </button>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}