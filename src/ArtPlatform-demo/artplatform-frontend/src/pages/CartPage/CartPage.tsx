import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { useToast } from '../../shared/ui/Notifications/ToastProvider';
import {
  addToCart,
  clearCart,
  decreaseCartItem,
  getMyCart,
  removeFromCart,
  type CartItem,
} from '../../shared/api/cart.api';
import { getArtworkById, type Artwork } from '../../shared/api/artworks.api';
import { toImageUrl } from '../../shared/lib/image';
import styles from './CartPage.module.css';

type CartItemWithStock = CartItem & {
  availableQuantity: number;
};

async function hydrateCartItems(cart: CartItem[]): Promise<CartItemWithStock[]> {
  return Promise.all(
    cart.map(async (item) => {
      const base = {
        ...item,
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
      };

      try {
        const artwork: Artwork = await getArtworkById(item.artworkId);
        return {
          ...base,
          availableQuantity: Math.max(0, Number(artwork.quantity) || 0),
        };
      } catch {
        return {
          ...base,
          availableQuantity: Math.max(0, Number(item.quantity) || 0),
        };
      }
    })
  );
}

export function CartPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const isAdmin = user?.role === 'Admin';

  const [items, setItems] = useState<CartItemWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

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
        const cart = await getMyCart();
        const hydrated = await hydrateCartItems(cart);
        if (!ignore) setItems(hydrated);
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : 'Ошибка загрузки корзины');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [isAdmin]);

  const totals = useMemo(() => {
    const count = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const sum = items.reduce(
      (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );

    return { count, sum };
  }, [items]);

  const onDecrease = async (item: CartItemWithStock) => {
    try {
      setBusyKey(`dec:${item.artworkId}`);
      await decreaseCartItem(item.artworkId);

      if (item.quantity <= 1) {
        setItems((prev) => prev.filter((x) => x.artworkId !== item.artworkId));
      } else {
        setItems((prev) =>
          prev.map((x) =>
            x.artworkId === item.artworkId ? { ...x, quantity: x.quantity - 1 } : x
          )
        );
      }

      success('Корзина', 'Количество уменьшено');
    } catch (e) {
      toastError('Ошибка', e instanceof Error ? e.message : 'Не удалось уменьшить количество');
    } finally {
      setBusyKey(null);
    }
  };

  const onIncrease = async (item: CartItemWithStock) => {
    if (item.quantity >= item.availableQuantity) {
      toastError(
        'Корзина',
        `Нельзя добавить больше: доступно только ${item.availableQuantity} экземпляров`
      );
      return;
    }

    try {
      setBusyKey(`inc:${item.artworkId}`);
      const updated = await addToCart(item.artworkId);

      if (updated && typeof updated.quantity === 'number') {
        setItems((prev) =>
          prev.map((x) =>
            x.artworkId === item.artworkId
              ? { ...x, quantity: Number(updated.quantity) || x.quantity + 1 }
              : x
          )
        );
      } else {
        setItems((prev) =>
          prev.map((x) =>
            x.artworkId === item.artworkId ? { ...x, quantity: x.quantity + 1 } : x
          )
        );
      }

      success('Корзина', 'Количество увеличено');
    } catch (e) {
      toastError('Ошибка', e instanceof Error ? e.message : 'Не удалось увеличить количество');
    } finally {
      setBusyKey(null);
    }
  };

  const onRemoveAll = async (item: CartItemWithStock) => {
    try {
      setBusyKey(`rm:${item.artworkId}`);
      await removeFromCart(item.artworkId);
      setItems((prev) => prev.filter((x) => x.artworkId !== item.artworkId));
      success('Корзина', 'Позиция удалена');
    } catch (e) {
      toastError('Ошибка', e instanceof Error ? e.message : 'Не удалось удалить позицию');
    } finally {
      setBusyKey(null);
    }
  };

  const onClearCart = async () => {
    try {
      setClearing(true);
      const res = await clearCart();
      setItems([]);
      success('Корзина', `Корзина очищена. Удалено позиций: ${res.result}`);
    } catch (e) {
      toastError('Ошибка', e instanceof Error ? e.message : 'Не удалось очистить корзину');
    } finally {
      setClearing(false);
    }
  };

  if (isAdmin) {
    return (
      <section className={styles.page}>
        <Container>
          <StateMessage
            title="Раздел недоступен"
            description="Корзина не используется для администратора."
          />
        </Container>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <Container>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Корзина</h1>
            <p className={styles.subtitle}>
              Позиций: {items.length} · Экземпляров: {totals.count}
            </p>
          </div>

          {items.length > 0 ? (
            <button type="button" className={styles.clearButton} onClick={onClearCart} disabled={clearing}>
              {clearing ? 'Очистка...' : 'Очистить корзину'}
            </button>
          ) : null}
        </div>

        {loading ? <StateMessage title="Загрузка корзины..." /> : null}
        {error ? <StateMessage title="Ошибка" description={error} /> : null}

        {!loading && !error && items.length === 0 ? (
          <StateMessage
            title="Корзина пустая."
            description="Добавьте картины из каталога, чтобы оформить заказ."
          />
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className={styles.layout}>
            <div className={styles.items}>
              {items.map((item) => {
                const canIncrease = item.quantity < item.availableQuantity;

                return (
                  <article key={item.id} className={styles.item}>
                    <Link to={`/artworks/${item.artworkId}`} className={styles.link}>
                      <div className={styles.imageWrap}>
                        <img
                          className={styles.image}
                          src={toImageUrl(item.mainImageUrl)}
                          alt={item.artworkTitle}
                        />
                      </div>

                      <div className={styles.body}>
                        <div className={styles.topRow}>
                          <div>
                            <p className={styles.category}>{item.category}</p>
                            <h3 className={styles.titleCard}>{item.artworkTitle}</h3>
                            <p className={styles.artist}>{item.artistName}</p>
                          </div>

                          <div className={styles.priceBlock}>
                            <div className={styles.price}>{(item.price * item.quantity).toFixed(2)} ₽</div>
                            <div className={styles.unitPrice}>{item.price.toFixed(2)} ₽ за шт.</div>
                            <div className={styles.stock}>
                              Доступно: {item.availableQuantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>

                    <div className={styles.controls}>
                      <div className={styles.quantityBox}>
                        <button
                          type="button"
                          className={styles.qtyButton}
                          onClick={() => onDecrease(item)}
                          disabled={busyKey === `dec:${item.artworkId}`}
                          aria-label="Уменьшить количество"
                        >
                          −
                        </button>

                        <span className={styles.quantity}>{item.quantity}</span>

                        <button
                          type="button"
                          className={styles.qtyButton}
                          onClick={() => onIncrease(item)}
                          disabled={!canIncrease || busyKey === `inc:${item.artworkId}`}
                          aria-label="Увеличить количество"
                          title={canIncrease ? 'Увеличить количество' : 'Экземпляров картины в наличии больше нет'}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => onRemoveAll(item)}
                        disabled={busyKey === `rm:${item.artworkId}`}
                      >
                        {busyKey === `rm:${item.artworkId}` ? '...' : 'Удалить позицию'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className={styles.summary}>
              <h2 className={styles.summaryTitle}>Итого</h2>

              <div className={styles.summaryRow}>
                <span>Позиции</span>
                <strong>{items.length}</strong>
              </div>

              <div className={styles.summaryRow}>
                <span>Экземпляры</span>
                <strong>{totals.count}</strong>
              </div>

              <div className={styles.summaryRowTotal}>
                <span>Сумма</span>
                <strong>{totals.sum.toFixed(2)} ₽</strong>
              </div>

              <Link to="/checkout" className={styles.backLink}>
                Оформить заказ
              </Link>
            </aside>
          </div>
        ) : null}
      </Container>
    </section>
  );
}