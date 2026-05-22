import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';

export function CartPage() {
  return (
    <section style={{ padding: '48px 24px 80px' }}>
      <Container>
        <h1 style={{ margin: '0 0 16px', fontSize: 40 }}>Корзина</h1>
        <StateMessage
          title="Корзина пока пустая"
          description="Здесь будут товары, их количество и итоговая сумма."
        />
      </Container>
    </section>
  );
}