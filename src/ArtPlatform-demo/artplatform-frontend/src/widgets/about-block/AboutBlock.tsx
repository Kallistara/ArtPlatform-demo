import styles from './AboutBlock.module.css';

export function AboutBlock() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.title}>О сайте</h2>
        <p className={styles.text}>
          ArtPlatform — пространство для открытия, выбора и покупки картин от авторов разных стилей.
        </p>
      </div>
    </section>
  );
}