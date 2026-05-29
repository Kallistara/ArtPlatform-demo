import { Outlet } from 'react-router-dom';
import { Header } from '../../../widgets/header/Header';
import styles from './AuthLayout.module.css';

export function AuthLayout() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <div className={styles.card}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}