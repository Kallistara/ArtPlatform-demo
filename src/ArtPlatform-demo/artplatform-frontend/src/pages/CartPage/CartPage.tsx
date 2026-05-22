import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { useAuth } from '../../app/providers/AuthProvider';
import {
  addToCart,
  clearCart,
  decreaseCartItem,
  getMyCart,
  removeFromCart,
  type CartItem,
} from '../../shared/api/cart.api';

export function CartPage() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await getMyCart();
        if (!ignore) setItems(data);
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : 'Ошибка загрузки корзины');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const onRemoveOne = async (artworkId: string) => {
    await decreaseCartItem(artworkId);

    setItems((prev) =>
      prev
        .map((item) =>
          item.artworkId === artworkId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const onRemoveAll = async (artworkId: string) => {
    await removeFromCart(artworkId);
    setItems((prev) => prev.filter((item) => item.artworkId !== artworkId));
  };

  const onClear = async () => {
    await clearCart();
    setItems([]);
  };

  if (!isAuthenticated) {
    return (
      <section style={{ padding: '48px 24px 80px' }}>
        <Container>
          <StateMessage title="Требуется вход" description="Чтобы открыть корзину, войдите в аккаунт." />
        </Container>
      </section>
    );
  }

  return (
    <section style={{ padding: '48px 24px 80px' }}>
      <Container>
        <h1 style={{ margin: '0 0 16px', fontSize: 40 }}>Корзина</h1>

        {loading ? <StateMessage title="Загрузка корзины..." /> : null}
        {error ? <StateMessage title="Ошибка" description={error} /> : null}

        {!loading && !error && items.length === 0 ? (
          <StateMessage title="Корзина пока пустая" description="Добавьте картины, чтобы собрать заказ." />
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
                <div>Цена: ${item.price.toFixed(2)}</div>
                <div>Количество: {item.quantity}</div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <button type="button" onClick={() => onRemoveOne(item.artworkId)}>
                  -1
                </button>
                <button type="button" onClick={() => onRemoveAll(item.artworkId)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 ? (
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Итого: ${total.toFixed(2)}</strong>
            <button type="button" onClick={onClear}>
              Очистить корзину
            </button>
          </div>
        ) : null}
      </Container>
    </section>
  );
}