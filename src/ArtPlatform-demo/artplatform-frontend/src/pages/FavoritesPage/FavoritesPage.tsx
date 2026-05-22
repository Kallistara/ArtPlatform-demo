import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';

export function FavoritesPage() {
  return (
    <section style={{ padding: '48px 24px 80px' }}>
      <Container>
        <h1 style={{ margin: '0 0 16px', fontSize: 40 }}>Избранное</h1>
        <StateMessage
          title="Здесь пока пусто"
          description="После подключения логики сюда будут попадать сохранённые картины."
        />
      </Container>
    </section>
  );
}