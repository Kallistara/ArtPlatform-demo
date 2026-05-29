import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { addToCart, removeFromCart, isInCart } from '../../shared/api/cart.api';
import { addToFavorites, removeFromFavorites, isFavorite } from '../../shared/api/favorites.api';
import {
  getArtworkById,
  getArtworksByArtistId,
  getSimilarArtworks,
  type Artwork,
} from '../../shared/api/artworks.api';
import { getProfileByUserId, type UserProfile } from '../../shared/api/profile.api';
import { ArtworkCard } from '../../entities/artwork/ArtworkCard';
import { toImageUrl } from '../../shared/lib/image';
import styles from './ArtworkPage.module.css';

function getInitials(name?: string, fallback = '?') {
  const source = (name ?? '').trim();
  if (!source) return fallback;

  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return letters || fallback;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(date);
}

export function ArtworkPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const canUsePersonalActions = isAuthenticated && !isAdmin;

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [artistProfile, setArtistProfile] = useState<UserProfile | null>(null);
  const [artistWorks, setArtistWorks] = useState<Artwork[]>([]);
  const [similarWorks, setSimilarWorks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingArtist, setLoadingArtist] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [error, setError] = useState('');

  const [favorite, setFavorite] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [busyFavorite, setBusyFavorite] = useState(false);
  const [busyCart, setBusyCart] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const from = (location.state as { from?: string } | null)?.from;

  const handleBack = () => {
    if (from) {
      navigate(from);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/catalog', { replace: true });
  };

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

    void load();

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [artwork?.id]);

  useEffect(() => {
    if (!id || !isAuthenticated || isAdmin) return;

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

    void loadFlags();

    return () => {
      ignore = true;
    };
  }, [id, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!artwork?.artistId) return;

    let ignore = false;

    async function loadArtist() {
      try {
        setLoadingArtist(true);
        const [profileData, worksData] = await Promise.all([
          getProfileByUserId(artwork.artistId),
          getArtworksByArtistId(artwork.artistId),
        ]);

        if (ignore) return;

        setArtistProfile(profileData);
        setArtistWorks(worksData.filter((item) => item.id !== artwork.id));
      } catch {
        if (!ignore) {
          setArtistProfile(null);
          setArtistWorks([]);
        }
      } finally {
        if (!ignore) setLoadingArtist(false);
      }
    }

    void loadArtist();

    return () => {
      ignore = true;
    };
  }, [artwork?.artistId, artwork?.id]);

  useEffect(() => {
    if (!artwork?.id) return;

    let ignore = false;

    async function loadSimilar() {
      try {
        setLoadingSimilar(true);
        const data = await getSimilarArtworks(artwork.id, 6);
        if (!ignore) {
          setSimilarWorks(
            data.filter(
              (item) => item.id !== artwork.id && item.artistId !== artwork.artistId
            )
          );
        }
      } catch {
        if (!ignore) setSimilarWorks([]);
      } finally {
        if (!ignore) setLoadingSimilar(false);
      }
    }

    void loadSimilar();

    return () => {
      ignore = true;
    };
  }, [artwork?.id, artwork?.artistId]);

  const images = useMemo(() => {
    if (!artwork) return [];
    return [artwork.mainImageUrl, ...(artwork.additionaImageUrls ?? [])].filter(Boolean);
  }, [artwork]);

  const currentImage = images[activeImageIndex] ?? artwork?.mainImageUrl ?? '';

  const artistName =
    artistProfile?.displayName || artistProfile?.userName || artwork?.artistName || 'Автор';
  const artistHandle = artistProfile?.userName || artwork?.artistName || 'artist';
  const artistInitials = getInitials(artistName, 'A');

  const onPrevImage = () => {
    setActiveImageIndex((prev) => (images.length === 0 ? 0 : (prev - 1 + images.length) % images.length));
  };

  const onNextImage = () => {
    setActiveImageIndex((prev) => (images.length === 0 ? 0 : (prev + 1) % images.length));
  };

  const onToggleFavorite = async () => {
    if (!id || !canUsePersonalActions) return;
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
    if (!id || !canUsePersonalActions) return;
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
        <button type="button" className={styles.backButton} onClick={handleBack}>
          ← Назад
        </button>

        <div className={styles.layout}>
          <div className={styles.imageBlock}>
            <div className={styles.imageStage}>
              {images.length > 1 ? (
                <button
                  type="button"
                  className={styles.imageArrowLeft}
                  onClick={onPrevImage}
                  aria-label="Предыдущее фото"
                >
                  ‹
                </button>
              ) : null}

              <img className={styles.image} src={toImageUrl(currentImage)} alt={artwork.title} />

              {images.length > 1 ? (
                <button
                  type="button"
                  className={styles.imageArrowRight}
                  onClick={onNextImage}
                  aria-label="Следующее фото"
                >
                  ›
                </button>
              ) : null}
            </div>

            {images.length > 1 ? (
              <div className={styles.thumbs}>
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`${styles.thumbButton} ${index === activeImageIndex ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`Фото ${index + 1}`}
                  >
                    <img className={styles.thumbImage} src={toImageUrl(image)} alt={`${artwork.title} ${index + 1}`} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.info}>
            <h1 className={styles.title}>{artwork.title}</h1>
            <p className={styles.price}>${artwork.price.toFixed(2)}</p>
            <p className={styles.description}>{artwork.description}</p>

            <div className={styles.meta}>
              <div>Категория: {artwork.category}</div>
              <div>Стиль: {artwork.style}</div>
              <div>Материал: {artwork.material}</div>
              <div>Размер: {artwork.width} × {artwork.height}</div>
              <div>Есть в наличии: {artwork.quantity > 0 ? 'Да' : 'Нет'}</div>
            </div>

            {canUsePersonalActions ? (
              <div className={styles.actions}>
                <button type="button" className={styles.favoriteButton} onClick={onToggleFavorite} disabled={busyFavorite}>
                  {busyFavorite ? '...' : favorite ? '♥ В избранном' : '♡ В избранное'}
                </button>
                <button type="button" className={styles.cartButton} onClick={onToggleCart} disabled={busyCart}>
                  {busyCart ? '...' : inCart ? 'Убрать из корзины' : 'В корзину'}
                </button>
              </div>
            ) : (
              <p className={styles.viewerNote}>Только просмотр.</p>
            )}

            <Link to={`/artists/${artwork.artistId}`} state={{ from: `${location.pathname}${location.search}` }} className={styles.artistCard}>
              <div className={styles.artistAvatar}>{artistInitials}</div>
              <div className={styles.artistText}>
                <div className={styles.artistLabel}>Автор</div>
                <div className={styles.artistName}>{artistName}</div>
                <div className={styles.artistHandle}>@{artistHandle}</div>
                {artistProfile?.bio ? <p className={styles.artistBio}>{artistProfile.bio}</p> : null}
                <div className={styles.artistMeta}>На сайте с {formatDate(artistProfile?.createdAt)}</div>
              </div>
            </Link>

            {actionMessage ? <StateMessage title="Готово" description={actionMessage} /> : null}
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Другие работы автора</h2>
            <span className={styles.sectionHint}>{loadingArtist ? 'Загрузка...' : `${artistWorks.length} работ`}</span>
          </div>

          {artistWorks.length > 0 ? (
            <div className={styles.relatedGrid}>
              {artistWorks.map((item) => (
                <ArtworkCard key={item.id} artwork={item} showFavorite={false} />
              ))}
            </div>
          ) : (
            <StateMessage
              title="Других работ пока нет"
              description="У автора пока нет опубликованных картин помимо этой."
            />
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Похожие картины</h2>
            <span className={styles.sectionHint}>{loadingSimilar ? 'Загрузка...' : `${similarWorks.length} картин`}</span>
          </div>

          {similarWorks.length > 0 ? (
            <div className={styles.relatedGrid}>
              {similarWorks.map((item) => (
                <ArtworkCard key={item.id} artwork={item} />
              ))}
            </div>
          ) : (
            <StateMessage
              title="Похожих картин нет"
              description="Пока не найдено других работ с похожими характеристиками."
            />
          )}
        </section>
      </Container>
    </section>
  );
}