import { Navigate } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { useAuth } from '../../app/providers/AuthProvider';

export function FavoritesPage() {
  const { isAuthenticated, isAdmin } = useAuth();

  if (isAdmin) {
    return <Navigate to="/account" replace />;
  }

  if (!isAuthenticated) {
    return (
      <section style={{ padding: '48px 24px 80px' }}>
        <Container>
          <StateMessage title="Требуется вход" description="Чтобы открыть избранное, войдите в аккаунт." />
        </Container>
      </section>
    );
  }

  return (
    <section style={{ padding: '48px 24px 80px' }}>
      <Container>
        <h1 style={{ margin: '0 0 16px', fontSize: 40 }}>Избранное</h1>
        <StateMessage title="Функционал уже подключен" description="Здесь будет список избранных картин." />
      </Container>
    </section>
  );
}