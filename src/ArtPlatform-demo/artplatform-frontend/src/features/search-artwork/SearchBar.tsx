import styles from './SearchBar.module.css';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
};

export function SearchBar({ value, onChange, placeholder = 'Поиск картин...', onSubmit }: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <form className={styles.search} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {onSubmit ? (
        <button type="submit" className={styles.button}>
          Найти
        </button>
      ) : null}
    </form>
  );
}