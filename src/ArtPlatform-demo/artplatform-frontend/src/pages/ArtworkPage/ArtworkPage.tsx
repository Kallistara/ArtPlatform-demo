import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { toImageUrl } from '../../shared/ib/image';
import { getArtworkById, getArtworksByArtistId, getSimilarArtworks, type Artwork } from '../../shared/api/artworks.api';
import { getProfileByUserId, type UserProfile } from '../../shared/api/profile.api';
import { addToFavorites, removeFromFavorites, isFavorite } from '../../shared/api/favorites.api';
import { addToCart, removeFromCart, isInCart } from '../../shared/api/cart.api';
import { ArtworkCard } from '../../entities/artwork/ArtworkCard';
import styles from './ArtworkPage.module.css';

export function ArtworkPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [author, setAuthor] = useState<UserProfile | null>(null);
  const [artistWorks, setArtistWorks] = useState<Artwork[]>([]);
  const [similarWorks, setSimilarWorks] = useState<Artwork[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [favorite, setFavorite] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [busyFavorite, setBusyFavorite] = useState(false);
  const [busyCart, setBusyCart] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const galleryImages = useMemo(() => {
    if (!artwork) return [];
    return [artwork.mainImageUrl, ...(artwork.additionaImageUrls ?? [])].filter(Boolean);
  }, [artwork]);

  useEffect(() => {
    const artworkId = id;

    if (!artworkId) {
      setError('Некорректный id картины');
      setLoading(false);
      return;
    }

    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const art = await getArtworkById(artworkId);
        if (ignore) return;

        setArtwork(art);
        setSelectedImageIndex(0);

        const [favRes, cartRes, authorRes, artistWorksRes, similarRes] = await Promise.all([
          isAuthenticated ? isFavorite(artworkId).catch(() => ({ isFavorite: false })) : Promise.resolve({ isFavorite: false }),
          isAuthenticated ? isInCart(artworkId).catch(() => ({ isInCart: false })) : Promise.resolve({ isInCart: false }),
          getProfileByUserId(art.artistId).catch(() => null),
          getArtworksByArtistId(art.artistId).catch(() => [] as Artwork[]),
          getSimilarArtworks(artworkId, 6).catch(() => [] as Artwork[]),
        ]);

        if (ignore) return;

        setFavorite(Boolean(favRes.isFavorite));
        setInCart(Boolean(cartRes.isInCart));
        setAuthor(authorRes);
        setArtistWorks(artistWorksRes.filter((x) => x.id !== art.id));
        setSimilarWorks(similarRes.filter((x) => x.id !== art.id));
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : 'Ошибка загрузки картины');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [id, isAuthenticated]);

  const currentImage = galleryImages[selectedImageIndex] ?? artwork?.mainImageUrl ?? '';

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
          <div className={styles.gallery}>
            <div className={styles.imageWrap}>
              <img className={styles.image} src={toImageUrl(currentImage)} alt={artwork.title} />
            </div>

            {galleryImages.length > 1 ? (
              <div className={styles.thumbs}>
                {galleryImages.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    className={`${styles.thumbButton} ${selectedImageIndex === index ? styles.thumbActive : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img className={styles.thumbImage} src={toImageUrl(img)} alt={`${artwork.title} ${index + 1}`} />
                  </button>
                ))}
              </div>
            ) : null}
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
              <div>Доступно: {artwork.quantity > 0 ? 'Да' : 'Нет'}</div>
            </div>

            {author ? (
              <div className={styles.authorBlock}>
                <div className={styles.authorAvatar}>
                  {author.avatarUrl ? (
                    <img src={toImageUrl(author.avatarUrl)} alt={author.displayName || author.userName} />
                  ) : (
                    <span>{(author.displayName || author.userName || 'A').slice(0, 1).toUpperCase()}</span>
                  )}
                </div>

                <div className={styles.authorInfo}>
                  <p className={styles.authorLabel}>Автор</p>
                  <Link to={`/artists/${author.userId}`} className={styles.authorLink}>
                    {author.displayName || author.userName}
                  </Link>
                  <p className={styles.authorBio}>{author.bio || '—'}</p>
                </div>
              </div>
            ) : (
              <div className={styles.authorBlock}>
                <div className={styles.authorAvatar}>
                  <span>{artwork.artistName.slice(0, 1).toUpperCase()}</span>
                </div>
                <div className={styles.authorInfo}>
                  <p className={styles.authorLabel}>Автор</p>
                  <Link to={`/artists/${artwork.artistId}`} className={styles.authorLink}>
                    {artwork.artistName}
                  </Link>
                </div>
              </div>
            )}

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

        <div className={styles.sections}>
          <details className={styles.collapse} open>
            <summary className={styles.collapseSummary}>
              Другие картины этого автора
            </summary>

            {artistWorks.length > 0 ? (
              <div className={styles.cardsRow}>
                {artistWorks.map((item) => (
                  <div key={item.id} className={styles.cardItem}>
                    <ArtworkCard
                      id={item.id}
                      title={item.title}
                      artistName={item.artistName}
                      price={item.price}
                      imageUrl={item.mainImageUrl}
                      category={item.category}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>У автора пока нет других работ.</p>
            )}
          </details>

          <details className={styles.collapse}>
            <summary className={styles.collapseSummary}>
              Похожие картины
            </summary>

            {similarWorks.length > 0 ? (
              <div className={styles.cardsRow}>
                {similarWorks.map((item) => (
                  <div key={item.id} className={styles.cardItem}>
                    <ArtworkCard
                      id={item.id}
                      title={item.title}
                      artistName={item.artistName}
                      price={item.price}
                      imageUrl={item.mainImageUrl}
                      category={item.category}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>Пока нет похожих картин.</p>
            )}
          </details>
        </div>
      </Container>
    </section>
  );
}