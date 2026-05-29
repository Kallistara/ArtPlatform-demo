import styles from './AboutBlock.module.css';

export function AboutBlock() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Как работает платформа</h2>
        <p className={styles.text}>
          Авторы публикуют работы, посетители ищут картины по стилям, материалам и категориям,
          сохраняют избранное и собирают корзину, а администратор управляет ролями и контентом.
        </p>
      </div>
    </section>
  );
}