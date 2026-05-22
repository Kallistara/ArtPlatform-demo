import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <p className={styles.label}>Contemporary Art Platform</p>
        <h1 className={styles.title}>Искусство, которое хочется рассматривать.</h1>
        <p className={styles.text}>
          Открой подборку картин, авторов и коллекций, чтобы найти работу под настроение, интерьер или
          личную коллекцию.
        </p>
      </div>
    </section>
  );
}