import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { createArtwork } from '../../shared/api/artworks.api';
import { ArtworkEditorForm, type ArtworkFormValues } from '../../features/artwork-editor/ArtworkEditorForm';

export function CreateArtworkPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const onSubmit = async (values: ArtworkFormValues) => {
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const formData = new FormData();

      formData.append('Title', values.title);
      formData.append('Description', values.description);
      formData.append('Category', values.category);
      formData.append('Style', values.style);
      formData.append('Material', values.material);
      formData.append('Price', String(values.price));
      formData.append('Quantity', String(values.quantity));
      formData.append('Width', String(values.width));
      formData.append('Height', String(values.height));

      if (values.mainImage && values.mainImage.length > 0) {
        formData.append('MainImage', values.mainImage[0]);
      }

      if (values.additionalImages && values.additionalImages.length > 0) {
        Array.from(values.additionalImages).forEach((file) => {
          formData.append('AdditionalImages', file);
        });
      }

      const result = await createArtwork(formData);
      setSubmitSuccess(result.message);
      navigate(`/artworks/${result.artwork.id}`, { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Ошибка создания картины');
    }
  };

  return (
    <section style={{ padding: '48px 24px 80px' }}>
      <Container>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 40 }}>Создание картины</h1>
          <p style={{ margin: '0 0 24px', opacity: 0.75 }}>
            Доступно для Artist.
          </p>

          <ArtworkEditorForm mode="create" submitLabel="Создать картину" onSubmit={onSubmit} />

          {submitSuccess ? <StateMessage title="Успешно" description={submitSuccess} /> : null}
          {submitError ? <StateMessage title="Ошибка" description={submitError} /> : null}
        </div>
      </Container>
    </section>
  );
}