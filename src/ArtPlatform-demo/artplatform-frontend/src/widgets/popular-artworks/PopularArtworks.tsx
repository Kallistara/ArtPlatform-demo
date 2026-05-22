import styles from './PopularArtworks.module.css';

export function PopularArtworks() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Популярные картины</h2>
        <div className={styles.grid}>
          <div className={styles.card}>Artwork card</div>
          <div className={styles.card}>Artwork card</div>
          <div className={styles.card}>Artwork card</div>
          <div className={styles.card}>Artwork card</div>
        </div>
      </div>
    </section>
  );
}