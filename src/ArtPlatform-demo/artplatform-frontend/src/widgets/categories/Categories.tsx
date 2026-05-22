import styles from './Categories.module.css';

export function Categories() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Категории</h2>
        <div className={styles.grid}>
          <div className={styles.item}>Абстракция</div>
          <div className={styles.item}>Пейзажи</div>
          <div className={styles.item}>Портреты</div>
          <div className={styles.item}>Минимализм</div>
        </div>
      </div>
    </section>
  );
}