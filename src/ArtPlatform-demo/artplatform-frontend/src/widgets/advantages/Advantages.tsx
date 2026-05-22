import styles from './Advantages.module.css';

export function Advantages() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Преимущества</h2>
        <div className={styles.grid}>
          <div className={styles.item}>Удобный каталог</div>
          <div className={styles.item}>Избранное и корзина</div>
          <div className={styles.item}>Работы от авторов</div>
          <div className={styles.item}>Минималистичная подача</div>
        </div>
      </div>
    </section>
  );
}