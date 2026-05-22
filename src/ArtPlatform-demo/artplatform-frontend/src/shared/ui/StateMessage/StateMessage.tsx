import styles from './StateMessage.module.css';

type StateMessageProps = {
  title: string;
  description?: string;
};

export function StateMessage({ title, description }: StateMessageProps) {
  return (
    <div className={styles.state}>
      <h2 className={styles.title}>{title}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
    </div>
  );
}