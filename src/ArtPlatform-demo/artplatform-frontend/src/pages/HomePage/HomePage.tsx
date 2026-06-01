import { Hero } from '../../widgets/hero/Hero';
import { HomeShowcase } from '../../widgets/home/HomeShowcase';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.page}>
      <Hero />
      <HomeShowcase />
    </div>
  );
}