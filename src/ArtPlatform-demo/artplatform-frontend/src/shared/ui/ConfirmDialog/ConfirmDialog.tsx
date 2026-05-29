import styles from './ConfirmDialog.module.css';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Удалить',
  cancelText = 'Отмена',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onCancel}
          aria-label="Закрыть"
        >
          ×
        </button>

        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button className={styles.secondary} onClick={onCancel} type="button">
            {cancelText}
          </button>
          <button className={styles.primary} onClick={onConfirm} type="button" disabled={loading}>
            {loading ? '...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}