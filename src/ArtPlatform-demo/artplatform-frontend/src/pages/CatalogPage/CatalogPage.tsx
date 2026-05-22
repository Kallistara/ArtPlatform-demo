import { Container } from '../../shared/ui/Container/Container';
import { ArtworkCard } from '../../entities/artwork/ArtworkCard';
import styles from './CatalogPage.module.css';

const mockArtworks = [
  {
    id: '1',
    title: 'Golden Silence',
    artistName: 'Anna Petrov',
    price: 1200,
    imageUrl: '/src/shared/assets/placeholders/artwork-1.jpg',
    category: 'Abstract',
  },
  {
    id: '2',
    title: 'Blue Horizon',
    artistName: 'Mark Lewis',
    price: 980,
    imageUrl: '/src/shared/assets/placeholders/artwork-2.jpg',
    category: 'Landscape',
  },
  {
    id: '3',
    title: 'Stillness',
    artistName: 'Julia White',
    price: 1500,
    imageUrl: '/src/shared/assets/placeholders/artwork-3.jpg',
    category: 'Minimalism',
  },
];

export function CatalogPage() {
  return (
    <section className={styles.page}>
      <Container>
        <div className={styles.header}>
          <h1 className={styles.title}>Каталог</h1>
          <p className={styles.subtitle}>Здесь будут фильтры, поиск и сетка картин.</p>
        </div>

        <div className={styles.layout}>
          <aside className={styles.filters}>
            <h2 className={styles.filtersTitle}>Фильтры</h2>
            <div className={styles.filterBox}>Категория</div>
            <div className={styles.filterBox}>Стиль</div>
            <div className={styles.filterBox}>Материал</div>
            <div className={styles.filterBox}>Цена</div>
          </aside>

          <div className={styles.grid}>
            {mockArtworks.map((artwork) => (
              <ArtworkCard key={artwork.id} {...artwork} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}