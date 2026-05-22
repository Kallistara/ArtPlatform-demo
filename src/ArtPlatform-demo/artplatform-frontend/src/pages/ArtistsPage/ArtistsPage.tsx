import { useEffect, useState } from 'react';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { getUsersByRole, type RoleEntry } from '../../shared/api/roles.api';

export function ArtistsPage() {
  const [artists, setArtists] = useState<RoleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsersByRole('Artist').then(setArtists).catch(() => setArtists([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Container><StateMessage title="Загрузка художников..." /></Container>;

  return (
    <section style={{ padding: '48px 24px 80px' }}>
      <Container>
        <h1>Художники</h1>
        {artists.length === 0 ? (
          <StateMessage title="Художники не найдены" />
        ) : (
          artists.map((a) => (
            <div key={a.id}>
              {a.userId} — {a.role}
            </div>
          ))
        )}
      </Container>
    </section>
  );
}