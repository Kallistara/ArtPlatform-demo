import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { getArtworks, type Artwork } from '../../shared/api/artworks.api';
import { ARTWORK_CATEGORIES, ARTWORK_STYLES, ARTWORK_MATERIALS } from '../../shared/config/ArtworkOptions';
import { SearchBar } from '../../features/search-artwork/SearchBar';
import { ArtworkCard } from '../../entities/artwork/ArtworkCard';
import styles from './CatalogPage.module.css';

type SortMode = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'title-asc';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [style, setStyle] = useState(searchParams.get('style') ?? '');
  const [material, setMaterial] = useState(searchParams.get('material') ?? '');
  const [available, setAvailable] = useState(searchParams.get('available') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [minWidth, setMinWidth] = useState(searchParams.get('minWidth') ?? '');
  const [maxWidth, setMaxWidth] = useState(searchParams.get('maxWidth') ?? '');
  const [minHeight, setMinHeight] = useState(searchParams.get('minHeight') ?? '');
  const [maxHeight, setMaxHeight] = useState(searchParams.get('maxHeight') ?? '');
  const [sort, setSort] = useState<SortMode>((searchParams.get('sort') as SortMode) ?? 'newest');
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    const initialQuery = searchParams.get('query') ?? '';
    setQuery(initialQuery);
  }, [searchParams]);

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

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setCategory(searchParams.get('category') ?? '');
    setStyle(searchParams.get('style') ?? '');
    setMaterial(searchParams.get('material') ?? '');
    setAvailable(searchParams.get('available') ?? '');
    setMinPrice(searchParams.get('minPrice') ?? '');
    setMaxPrice(searchParams.get('maxPrice') ?? '');
    setMinWidth(searchParams.get('minWidth') ?? '');
    setMaxWidth(searchParams.get('maxWidth') ?? '');
    setMinHeight(searchParams.get('minHeight') ?? '');
    setMaxHeight(searchParams.get('maxHeight') ?? '');
    setSort((searchParams.get('sort') as SortMode) ?? 'newest');
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams();

    if (query.trim()) next.set('q', query.trim());
    if (category) next.set('category', category);
    if (style) next.set('style', style);
    if (material) next.set('material', material);
    if (available) next.set('available', available);
    if (minPrice) next.set('minPrice', minPrice);
    if (maxPrice) next.set('maxPrice', maxPrice);
    if (minWidth) next.set('minWidth', minWidth);
    if (maxWidth) next.set('maxWidth', maxWidth);
    if (minHeight) next.set('minHeight', minHeight);
    if (maxHeight) next.set('maxHeight', maxHeight);
    if (sort) next.set('sort', sort);

    setSearchParams(next, { replace: true });
  }, [
    query,
    category,
    style,
    material,
    available,
    minPrice,
    maxPrice,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    sort,
    setSearchParams,
  ]);

  const resetFilters = () => {
    setCategory('');
    setStyle('');
    setMaterial('');
    setAvailable('');
    setMinPrice('');
    setMaxPrice('');
    setMinWidth('');
    setMaxWidth('');
    setMinHeight('');
    setMaxHeight('');
  };

  const handleSearchSubmit = () => {
    resetFilters();
    setFiltersOpen(true);
  };

  const filteredArtworks = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = artworks.filter((artwork) => {
      const searchable = `${artwork.title} ${artwork.artistName} ${artwork.category} ${artwork.style} ${artwork.material}`.toLowerCase();

      const matchesQuery = !q || searchable.includes(q);
      const matchesCategory = !category || artwork.category === category;
      const matchesStyle = !style || artwork.style === style;
      const matchesMaterial = !material || artwork.material === material;
      const matchesAvailable =
        !available
          ? true
          : available === 'yes'
            ? artwork.quantity > 0
            : artwork.quantity === 0;

      const minP = minPrice ? Number(minPrice) : null;
      const maxP = maxPrice ? Number(maxPrice) : null;
      const minW = minWidth ? Number(minWidth) : null;
      const maxW = maxWidth ? Number(maxWidth) : null;
      const minH = minHeight ? Number(minHeight) : null;
      const maxH = maxHeight ? Number(maxHeight) : null;

      const matchesMinPrice = minP === null || artwork.price >= minP;
      const matchesMaxPrice = maxP === null || artwork.price <= maxP;
      const matchesMinWidth = minW === null || artwork.width >= minW;
      const matchesMaxWidth = maxW === null || artwork.width <= maxW;
      const matchesMinHeight = minH === null || artwork.height >= minH;
      const matchesMaxHeight = maxH === null || artwork.height <= maxH;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesStyle &&
        matchesMaterial &&
        matchesAvailable &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesMinWidth &&
        matchesMaxWidth &&
        matchesMinHeight &&
        matchesMaxHeight
      );
    });

    const sorted = [...filtered];

    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return sorted;
  }, [
    artworks,
    query,
    category,
    style,
    material,
    available,
    minPrice,
    maxPrice,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    sort,
  ]);

  return (
    <section className={styles.page}>
      <Container>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Каталог</h1>
            <p className={styles.subtitle}>Поиск, сортировка и фильтры по картинам, авторам и категориям.</p>
          </div>

          <div className={styles.counter}>
            Найдено: <strong>{filteredArtworks.length}</strong>
          </div>
        </div>

        <div className={styles.searchRow}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Поиск по картинам, авторам, категориям..."
            onSubmit={handleSearchSubmit}
          />
        </div>

        <div className={styles.topControls}>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            {filtersOpen ? 'Скрыть фильтры' : 'Показать фильтры'}
          </button>

          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="price-asc">Цена: по возрастанию</option>
            <option value="price-desc">Цена: по убыванию</option>
            <option value="title-asc">По названию</option>
          </select>
        </div>

        <div className={styles.divider} />

        <div className={`${styles.layout} ${filtersOpen ? styles.layoutOpen : styles.layoutClosed}`}>
          {filtersOpen ? (
            <aside className={styles.sidebar}>
              <div className={styles.sidebarHead}>
                <h2 className={styles.sidebarTitle}>Фильтры</h2>
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    resetFilters();
                    setSort('newest');
                  }}
                >
                  Сбросить
                </button>
              </div>

              <div className={styles.filtersColumn}>
                <div className={styles.filterGroup}>
                  <div className={styles.groupTitle}>Основное</div>

                  <label className={styles.field}>
                    <span>Категория</span>
                    <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="">Все</option>
                      {ARTWORK_CATEGORIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>Стиль</span>
                    <select className={styles.select} value={style} onChange={(e) => setStyle(e.target.value)}>
                      <option value="">Все</option>
                      {ARTWORK_STYLES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>Материал</span>
                    <select className={styles.select} value={material} onChange={(e) => setMaterial(e.target.value)}>
                      <option value="">Все</option>
                      {ARTWORK_MATERIALS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>Доступность</span>
                    <select className={styles.select} value={available} onChange={(e) => setAvailable(e.target.value)}>
                      <option value="">Любая</option>
                      <option value="yes">В наличии</option>
                      <option value="no">Нет в наличии</option>
                    </select>
                  </label>
                </div>

                <div className={styles.filterGroup}>
                  <div className={styles.groupTitle}>Цена</div>

                  <label className={styles.field}>
                    <span>Цена от</span>
                    <input className={styles.input} type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                  </label>

                  <label className={styles.field}>
                    <span>Цена до</span>
                    <input className={styles.input} type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                  </label>
                </div>

                <div className={styles.filterGroup}>
                  <div className={styles.groupTitle}>Размеры</div>

                  <label className={styles.field}>
                    <span>Ширина от</span>
                    <input className={styles.input} type="number" value={minWidth} onChange={(e) => setMinWidth(e.target.value)} />
                  </label>

                  <label className={styles.field}>
                    <span>Ширина до</span>
                    <input className={styles.input} type="number" value={maxWidth} onChange={(e) => setMaxWidth(e.target.value)} />
                  </label>

                  <label className={styles.field}>
                    <span>Высота от</span>
                    <input className={styles.input} type="number" value={minHeight} onChange={(e) => setMinHeight(e.target.value)} />
                  </label>

                  <label className={styles.field}>
                    <span>Высота до</span>
                    <input className={styles.input} type="number" value={maxHeight} onChange={(e) => setMaxHeight(e.target.value)} />
                  </label>
                </div>
              </div>
            </aside>
          ) : null}

          <div className={styles.content}>
            {loading ? <StateMessage title="Загрузка каталога..." /> : null}
            {error ? <StateMessage title="Ошибка" description={error} /> : null}

            {!loading && !error && filteredArtworks.length === 0 ? (
              <StateMessage title="Ничего не найдено" description="Попробуйте изменить поисковый запрос или фильтры." />
            ) : null}

            {!loading && !error && filteredArtworks.length > 0 ? (
              <div className={`${styles.cardsGrid} ${filtersOpen ? styles.cardsOpen : styles.cardsClosed}`}>
                {filteredArtworks.map((artwork) => (
                  <ArtworkCard key={artwork.id} artwork={artwork} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}