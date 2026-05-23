import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { getArtworkById, updateArtwork, type Artwork } from '../../shared/api/artworks.api';
import { toImageUrl } from '../../shared/ib/image';
import { ArtworkEditorForm, type ArtworkFormValues } from '../../features/artwork-editor/ArtworkEditorForm';

export function EditArtworkPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    const artworkId = id;
    if (!artworkId) {
      setError('Некорректный id картины');
      setLoading(false);
      return;
    }

    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        const data = await getArtworkById(artworkId);
        if (!ignore) setArtwork(data);
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : 'Ошибка загрузки картины');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [id]);

  const onSubmit = async (values: ArtworkFormValues) => {
    if (!id) return;

    setSubmitError('');
    setSubmitSuccess('');

    try {
      const formData = new FormData();

      if (values.title) formData.append('Title', values.title);
      if (values.description) formData.append('Description', values.description);
      if (values.category) formData.append('Category', values.category);
      if (values.style) formData.append('Style', values.style);
      if (values.material) formData.append('Material', values.material);
      if (values.price !== undefined) formData.append('Price', String(values.price));
      if (values.quantity !== undefined) formData.append('Quantity', String(values.quantity));
      if (values.width !== undefined) formData.append('Width', String(values.width));
      if (values.height !== undefined) formData.append('Height', String(values.height));

      if (values.mainImage && values.mainImage.length > 0) {
        formData.append('MainImage', values.mainImage[0]);
      }

      if (values.additionalImages && values.additionalImages.length > 0) {
        Array.from(values.additionalImages).forEach((file) => {
          formData.append('AdditionalImages', file);
        });
      }

      const result = await updateArtwork(id, formData);
      setSubmitSuccess(result.message);
      navigate(`/artworks/${result.artwork.id}`, { replace: true });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Ошибка обновления картины');
    }
  };

  if (loading) {
    return (
      <section style={{ padding: '48px 24px 80px' }}>
        <Container>
          <StateMessage title="Загрузка картины..." />
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section style={{ padding: '48px 24px 80px' }}>
        <Container>
          <StateMessage title="Ошибка" description={error} />
        </Container>
      </section>
    );
  }

  if (!artwork) {
    return (
      <section style={{ padding: '48px 24px 80px' }}>
        <Container>
          <StateMessage title="Картина не найдена" />
        </Container>
      </section>
    );
  }

  return (
    <section style={{ padding: '48px 24px 80px' }}>
      <Container>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 40 }}>Редактирование картины</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, marginBottom: 20 }}>
            <img
              src={toImageUrl(artwork.mainImageUrl)}
              alt={artwork.title}
              style={{ width: 140, height: 105, objectFit: 'cover', borderRadius: 14 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{artwork.title}</div>
              <div style={{ opacity: 0.75 }}>{artwork.artistName}</div>
              <div style={{ opacity: 0.75 }}>{artwork.category}</div>
            </div>
          </div>

          <ArtworkEditorForm
            mode="edit"
            submitLabel="Сохранить изменения"
            initialValues={{
              title: artwork.title,
              description: artwork.description,
              category: artwork.category as any,
              style: artwork.style as any,
              material: artwork.material as any,
              price: artwork.price,
              quantity: artwork.quantity,
              width: artwork.width,
              height: artwork.height,
            }}
            onSubmit={onSubmit}
          />

          {submitSuccess ? <StateMessage title="Успешно" description={submitSuccess} /> : null}
          {submitError ? <StateMessage title="Ошибка" description={submitError} /> : null}
        </div>
      </Container>
    </section>
  );
}