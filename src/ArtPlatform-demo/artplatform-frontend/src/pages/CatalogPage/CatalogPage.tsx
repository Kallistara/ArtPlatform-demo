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

type SelectOption = {
  value: string;
  label: string;
};

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => decodeURIComponent(item).trim())
    .filter(Boolean);
}

function encodeList(values: string[]): string {
  return values.map((item) => encodeURIComponent(item)).join(',');
}

function getAvailabilityLabel(value: string) {
  if (value === 'yes') return 'В наличии';
  if (value === 'no') return 'Нет в наличии';
  return 'Любая';
}

type SingleSelectDropdownProps = {
  title: string;
  options: readonly SelectOption[];
  value: string;
  valueLabel: string;
  open: boolean;
  onToggleOpen: () => void;
  onSelect: (value: string) => void;
};

function SingleSelectDropdown({
  title,
  options,
  value,
  valueLabel,
  open,
  onToggleOpen,
  onSelect,
}: SingleSelectDropdownProps) {
  return (
    <div className={styles.filterDropdown}>
      <button
        type="button"
        className={`${styles.filterTrigger} ${open ? styles.filterTriggerActive : ''}`}
        onClick={onToggleOpen}
        aria-expanded={open}
      >
        <span className={styles.filterTriggerTitle}>{title}</span>
        <span className={styles.filterValue}>{valueLabel}</span>
      </button>

      {open ? (
        <div className={styles.dropdownPanel}>
          <div className={styles.dropdownList}>
            {options.map((item) => {
              const active = value === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  className={`${styles.dropdownChoiceButton} ${active ? styles.dropdownChoiceActive : ''}`}
                  onClick={() => onSelect(item.value)}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type MultiSelectDropdownProps = {
  title: string;
  options: readonly SelectOption[];
  committedValue: string[];
  draftValue: string[];
  open: boolean;
  onToggleOpen: () => void;
  onToggleDraftValue: (value: string) => void;
  onClearDraft: () => void;
  onCommit: () => void;
};

function MultiSelectDropdown({
  title,
  options,
  committedValue,
  draftValue,
  open,
  onToggleOpen,
  onToggleDraftValue,
  onClearDraft,
  onCommit,
}: MultiSelectDropdownProps) {
  const counterLabel = committedValue.length > 0 ? `${committedValue.length}` : 'Все';

  return (
    <div className={styles.filterDropdown}>
      <button
        type="button"
        className={`${styles.filterTrigger} ${open ? styles.filterTriggerActive : ''}`}
        onClick={onToggleOpen}
        aria-expanded={open}
      >
        <span className={styles.filterTriggerTitle}>{title}</span>
        <span className={styles.filterValue}>{counterLabel}</span>
      </button>

      {open ? (
        <div className={styles.dropdownPanel}>
          <div className={styles.dropdownList}>
            {options.map((item) => {
              const checked = draftValue.includes(item.value);

              return (
                <label
                  key={item.value}
                  className={`${styles.dropdownChoiceRow} ${checked ? styles.dropdownChoiceActive : ''}`}
                >
                  <input
                    type="checkbox"
                    className={styles.dropdownCheckbox}
                    checked={checked}
                    onChange={() => onToggleDraftValue(item.value)}
                  />
                  <span>{item.label}</span>
                </label>
              );
            })}
          </div>

          <div className={styles.dropdownActions}>
            <button type="button" className={styles.dropdownActionButton} onClick={onClearDraft}>
              Сбросить
            </button>
            <button type="button" className={styles.dropdownActionPrimary} onClick={onCommit}>
              Готово
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [stylesSelected, setStylesSelected] = useState<string[]>(parseList(searchParams.get('style')));
  const [materialsSelected, setMaterialsSelected] = useState<string[]>(parseList(searchParams.get('material')));
  const [available, setAvailable] = useState(searchParams.get('available') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [minWidth, setMinWidth] = useState(searchParams.get('minWidth') ?? '');
  const [maxWidth, setMaxWidth] = useState(searchParams.get('maxWidth') ?? '');
  const [minHeight, setMinHeight] = useState(searchParams.get('minHeight') ?? '');
  const [maxHeight, setMaxHeight] = useState(searchParams.get('maxHeight') ?? '');
  const [sort, setSort] = useState<SortMode>((searchParams.get('sort') as SortMode) ?? 'newest');
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [availabilityMenuOpen, setAvailabilityMenuOpen] = useState(false);
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const [materialMenuOpen, setMaterialMenuOpen] = useState(false);

  const [stylesDraft, setStylesDraft] = useState<string[]>(stylesSelected);
  const [materialsDraft, setMaterialsDraft] = useState<string[]>(materialsSelected);

  const categoryOptions: SelectOption[] = [
    { value: '', label: 'Все категории' },
    ...ARTWORK_CATEGORIES.map((item) => ({ value: item, label: item })),
  ];

  const availabilityOptions: SelectOption[] = [
    { value: '', label: 'Любая' },
    { value: 'yes', label: 'В наличии' },
    { value: 'no', label: 'Нет в наличии' },
  ];

  const styleOptions: SelectOption[] = ARTWORK_STYLES.map((item) => ({ value: item, label: item }));
  const materialOptions: SelectOption[] = ARTWORK_MATERIALS.map((item) => ({ value: item, label: item }));

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setCategory(searchParams.get('category') ?? '');
    setStylesSelected(parseList(searchParams.get('style')));
    setMaterialsSelected(parseList(searchParams.get('material')));
    setAvailable(searchParams.get('available') ?? '');
    setMinPrice(searchParams.get('minPrice') ?? '');
    setMaxPrice(searchParams.get('maxPrice') ?? '');
    setMinWidth(searchParams.get('minWidth') ?? '');
    setMaxWidth(searchParams.get('maxWidth') ?? '');
    setMinHeight(searchParams.get('minHeight') ?? '');
    setMaxHeight(searchParams.get('maxHeight') ?? '');
    setSort((searchParams.get('sort') as SortMode) ?? 'newest');

    setCategoryMenuOpen(false);
    setAvailabilityMenuOpen(false);
    setStyleMenuOpen(false);
    setMaterialMenuOpen(false);
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
    const next = new URLSearchParams();

    if (query.trim()) next.set('q', query.trim());
    if (category) next.set('category', category);
    if (stylesSelected.length > 0) next.set('style', encodeList(stylesSelected));
    if (materialsSelected.length > 0) next.set('material', encodeList(materialsSelected));
    if (available) next.set('available', available);
    if (minPrice) next.set('minPrice', minPrice);
    if (maxPrice) next.set('maxPrice', maxPrice);
    if (minWidth) next.set('minWidth', minWidth);
    if (maxWidth) next.set('maxWidth', maxWidth);
    if (minHeight) next.set('minHeight', minHeight);
    if (maxHeight) next.set('maxHeight', maxHeight);
    if (sort) next.set('sort', sort);

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    query,
    category,
    stylesSelected,
    materialsSelected,
    available,
    minPrice,
    maxPrice,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    sort,
    searchParams,
    setSearchParams,
  ]);

  const toggleDraftValue = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const resetFilters = () => {
    setCategory('');
    setStylesSelected([]);
    setMaterialsSelected([]);
    setAvailable('');
    setMinPrice('');
    setMaxPrice('');
    setMinWidth('');
    setMaxWidth('');
    setMinHeight('');
    setMaxHeight('');
    setStylesDraft([]);
    setMaterialsDraft([]);
    setCategoryMenuOpen(false);
    setAvailabilityMenuOpen(false);
    setStyleMenuOpen(false);
    setMaterialMenuOpen(false);
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
      const matchesStyle = stylesSelected.length === 0 || stylesSelected.includes(artwork.style);
      const matchesMaterial = materialsSelected.length === 0 || materialsSelected.includes(artwork.material);
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
    stylesSelected,
    materialsSelected,
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
            <p className={styles.subtitle}>
              Поиск, фильтрация и сортировка по стилям, материалам, авторам и категориям.
            </p>
          </div>

          <div className={styles.counter}>
            Найдено: <strong>{filteredArtworks.length}</strong>
          </div>
        </div>

        <div className={styles.searchRow}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Поиск по картинам, художникам, категориям..."
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
            <option value="title-asc">В алфавитном порядке</option>
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
                  onClick={resetFilters}
                >
                  Сбросить
                </button>
              </div>

              <div className={styles.filtersColumn}>
                <div className={styles.filterGroup}>
                  <div className={styles.groupTitle}>Основное</div>

                  <SingleSelectDropdown
                    title="Категория"
                    options={categoryOptions}
                    value={category}
                    valueLabel={category || 'Все категории'}
                    open={categoryMenuOpen}
                    onToggleOpen={() => {
                      setStyleMenuOpen(false);
                      setMaterialMenuOpen(false);
                      setAvailabilityMenuOpen(false);
                      setCategoryMenuOpen((prev) => !prev);
                    }}
                    onSelect={(value) => {
                      setCategory(value);
                      setCategoryMenuOpen(false);
                    }}
                  />

                  <MultiSelectDropdown
                    title="Стиль"
                    options={styleOptions}
                    committedValue={stylesSelected}
                    draftValue={stylesDraft}
                    open={styleMenuOpen}
                    onToggleOpen={() => {
                      setCategoryMenuOpen(false);
                      setAvailabilityMenuOpen(false);
                      setMaterialMenuOpen(false);

                      setStyleMenuOpen((prev) => {
                        if (!prev) setStylesDraft(stylesSelected);
                        return !prev;
                      });
                    }}
                    onToggleDraftValue={(value) => toggleDraftValue(value, setStylesDraft)}
                    onClearDraft={() => setStylesDraft([])}
                    onCommit={() => {
                      setStylesSelected(stylesDraft);
                      setStyleMenuOpen(false);
                    }}
                  />

                  <MultiSelectDropdown
                    title="Материал"
                    options={materialOptions}
                    committedValue={materialsSelected}
                    draftValue={materialsDraft}
                    open={materialMenuOpen}
                    onToggleOpen={() => {
                      setCategoryMenuOpen(false);
                      setAvailabilityMenuOpen(false);
                      setStyleMenuOpen(false);

                      setMaterialMenuOpen((prev) => {
                        if (!prev) setMaterialsDraft(materialsSelected);
                        return !prev;
                      });
                    }}
                    onToggleDraftValue={(value) => toggleDraftValue(value, setMaterialsDraft)}
                    onClearDraft={() => setMaterialsDraft([])}
                    onCommit={() => {
                      setMaterialsSelected(materialsDraft);
                      setMaterialMenuOpen(false);
                    }}
                  />

                  <SingleSelectDropdown
                    title="Доступность"
                    options={availabilityOptions}
                    value={available}
                    valueLabel={getAvailabilityLabel(available)}
                    open={availabilityMenuOpen}
                    onToggleOpen={() => {
                      setCategoryMenuOpen(false);
                      setStyleMenuOpen(false);
                      setMaterialMenuOpen(false);
                      setAvailabilityMenuOpen((prev) => !prev);
                    }}
                    onSelect={(value) => {
                      setAvailable(value);
                      setAvailabilityMenuOpen(false);
                    }}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <div className={styles.groupTitle}>Цена</div>

                  <label className={styles.field}>
                    <span>Цена от (₽)</span>
                    <input
                      className={styles.input}
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Цена до (₽)</span>
                    <input
                      className={styles.input}
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </label>
                </div>

                <div className={styles.filterGroup}>
                  <div className={styles.groupTitle}>Размеры</div>

                  <label className={styles.field}>
                    <span>Ширина от (см)</span>
                    <input
                      className={styles.input}
                      type="number"
                      value={minWidth}
                      onChange={(e) => setMinWidth(e.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Ширина до (см)</span>
                    <input
                      className={styles.input}
                      type="number"
                      value={maxWidth}
                      onChange={(e) => setMaxWidth(e.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Высота от (см)</span>
                    <input
                      className={styles.input}
                      type="number"
                      value={minHeight}
                      onChange={(e) => setMinHeight(e.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Высота до (см)</span>
                    <input
                      className={styles.input}
                      type="number"
                      value={maxHeight}
                      onChange={(e) => setMaxHeight(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </aside>
          ) : null}

          <div className={styles.content}>
            {loading ? <StateMessage title="Загрузка каталога..." /> : null}
            {error ? <StateMessage title="Ошибка" description={error} /> : null}

            {!loading && !error && filteredArtworks.length === 0 ? (
              <StateMessage
                title="Ничего не найдено"
                description="Попробуйте изменить запрос или убрать фильтры."
              />
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