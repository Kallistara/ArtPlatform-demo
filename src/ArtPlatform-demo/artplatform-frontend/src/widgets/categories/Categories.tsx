import { Link } from 'react-router-dom';
import { ARTWORK_CATEGORIES } from '../../shared/config/ArtworkOptions';
import styles from './Categories.module.css';

export function Categories() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h2 className={styles.title}>Категории</h2>
          <Link to="/catalog" className={styles.link}>Все картины</Link>
        </div>

        <div className={styles.grid}>
          {ARTWORK_CATEGORIES.map((category) => (
            <Link key={category} to={`/catalog?category=${encodeURIComponent(category)}`} className={styles.item}>
              {category}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}