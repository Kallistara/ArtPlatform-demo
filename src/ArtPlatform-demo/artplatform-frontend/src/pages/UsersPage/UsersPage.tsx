import { useEffect, useState } from 'react';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { searchProfiles, type UserProfile } from '../../shared/api/profile.api';

export function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchProfiles('').then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Container><StateMessage title="Загрузка пользователей..." /></Container>;

  return (
    <section style={{ padding: '48px 24px 80px' }}>
      <Container>
        <h1>Пользователи</h1>
        {users.length === 0 ? (
          <StateMessage title="Пользователи не найдены" />
        ) : (
          users.map((u) => (
            <div key={u.userId}>
              {u.displayName} — {u.role}
            </div>
          ))
        )}
      </Container>
    </section>
  );
}