import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Container } from '../../shared/ui/Container/Container';
import { useToast } from '../../shared/ui/Notifications/ToastProvider';
import { getArtworkById, updateArtwork } from '../../shared/api/artworks.api';
import { ARTWORK_CATEGORIES, ARTWORK_STYLES, ARTWORK_MATERIALS } from '../../shared/config/ArtworkOptions';
import styles from './EditArtworkPage.module.css';

const editArtworkSchema = z.object({
  title: z.string().trim().min(3, 'Минимум 3 символа').max(50, 'Максимум 50 символов'),
  description: z.string().trim().min(1, 'Описание обязательно').max(500, 'Максимум 500 символов'),
  category: z.enum(ARTWORK_CATEGORIES, { message: 'Выберите категорию' }),
  style: z.enum(ARTWORK_STYLES, { message: 'Выберите стиль' }),
  material: z.enum(ARTWORK_MATERIALS, { message: 'Выберите материалы' }),
  price: z.coerce.number().min(0, 'Цена не может быть отрицательной'),
  quantity: z.coerce.number().int().min(0, 'Количество не может быть отрицательным'),
  width: z.coerce.number().min(1, 'Ширина должна быть больше 0'),
  height: z.coerce.number().min(1, 'Высота должна быть больше 0'),
  mainImage: z.custom<FileList | undefined>().optional(),
  additionalImages: z.custom<FileList | undefined>().optional(),
});

type EditArtworkFormValues = z.infer<typeof editArtworkSchema>;

export function EditArtworkPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
    watch,
  } = useForm<EditArtworkFormValues>({
    resolver: zodResolver(editArtworkSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      category: ARTWORK_CATEGORIES[0],
      style: ARTWORK_STYLES[0],
      material: ARTWORK_MATERIALS[0],
      price: 0,
      quantity: 1,
      width: 40,
      height: 50,
    },
  });

  useEffect(() => {
    if (!id) return;

    let ignore = false;

    async function load() {
      try {
        const artwork = await getArtworkById(id);
        if (ignore) return;

        reset({
          title: artwork.title,
          description: artwork.description,
          category: artwork.category as (typeof ARTWORK_CATEGORIES)[number],
          style: artwork.style as (typeof ARTWORK_STYLES)[number],
          material: artwork.material as (typeof ARTWORK_MATERIALS)[number],
          price: artwork.price,
          quantity: artwork.quantity,
          width: artwork.width,
          height: artwork.height,
        });
      } catch (err) {
        toastError('Ошибка', err instanceof Error ? err.message : 'Не удалось загрузить картину');
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [id, reset, toastError]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const handleClose = () => {
    if (isDirty && !window.confirm('Данные не сохранятся. Выйти из формы?')) {
      return;
    }

    navigate('/account', { replace: true });
  };

  const onSubmit: SubmitHandler<EditArtworkFormValues> = async (data) => {
    if (!id) return;

    try {
      const formData = new FormData();
      formData.append('Title', data.title.trim());
      formData.append('Description', data.description.trim());
      formData.append('Category', data.category);
      formData.append('Style', data.style);
      formData.append('Material', data.material);
      formData.append('Price', String(data.price));
      formData.append('Quantity', String(data.quantity));
      formData.append('Width', String(data.width));
      formData.append('Height', String(data.height));

      if (data.mainImage?.[0]) {
        formData.append('MainImage', data.mainImage[0]);
      }

      Array.from(data.additionalImages ?? []).forEach((file) => {
        formData.append('AdditionalImages', file);
      });

      await updateArtwork(id, formData);
      success('Картина', 'Изменения сохранены');
      navigate(`/artworks/${id}`, { replace: true });
    } catch (err) {
      toastError('Ошибка', err instanceof Error ? err.message : 'Не удалось сохранить изменения');
    }
  };

  const titleValue = watch('title');

  return (
    <section className={styles.page}>
      <Container>
        <div className={styles.topBar}>
          <div>
            <p className={styles.label}>Редактирование</p>
            <h1 className={styles.title}>Изменение картины</h1>
            <p className={styles.subtitle}>
              Можно поменять описание, параметры и главное и дополнительные изображения.
            </p>
          </div>

          <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Закрыть форму">
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Название</span>
              <input className={styles.input} {...register('title')} />
              {errors.title ? <div className={styles.error}>{errors.title.message}</div> : null}
            </label>

            <label className={styles.field}>
              <span>Категория</span>
              <select className={styles.input} {...register('category')}>
                {ARTWORK_CATEGORIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {errors.category ? <div className={styles.error}>{errors.category.message}</div> : null}
            </label>

            <label className={styles.field}>
              <span>Стиль</span>
              <select className={styles.input} {...register('style')}>
                {ARTWORK_STYLES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {errors.style ? <div className={styles.error}>{errors.style.message}</div> : null}
            </label>

            <label className={styles.field}>
              <span>Материал</span>
              <select className={styles.input} {...register('material')}>
                {ARTWORK_MATERIALS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {errors.material ? <div className={styles.error}>{errors.material.message}</div> : null}
            </label>

            <label className={styles.field}>
              <span>Цена</span>
              <input className={styles.input} type="number" step="0.01" min="0" {...register('price')} />
              {errors.price ? <div className={styles.error}>{errors.price.message}</div> : null}
            </label>

            <label className={styles.field}>
              <span>Количество</span>
              <input className={styles.input} type="number" step="1" min="0" {...register('quantity')} />
              {errors.quantity ? <div className={styles.error}>{errors.quantity.message}</div> : null}
            </label>

            <label className={styles.field}>
              <span>Ширина</span>
              <input className={styles.input} type="number" step="0.1" min="1" {...register('width')} />
              {errors.width ? <div className={styles.error}>{errors.width.message}</div> : null}
            </label>

            <label className={styles.field}>
              <span>Высота</span>
              <input className={styles.input} type="number" step="0.1" min="1" {...register('height')} />
              {errors.height ? <div className={styles.error}>{errors.height.message}</div> : null}
            </label>
          </div>

          <label className={styles.field}>
            <span>Описание</span>
            <textarea className={styles.textarea} {...register('description')} />
            {errors.description ? <div className={styles.error}>{errors.description.message}</div> : null}
          </label>

          <div className={styles.uploadGrid}>
            <label className={styles.field}>
              <span>Главное изображение</span>
              <input className={styles.fileInput} type="file" accept="image/*" {...register('mainImage')} />
              {errors.mainImage ? <div className={styles.error}>{String(errors.mainImage.message ?? '')}</div> : null}
            </label>

            <label className={styles.field}>
              <span>Дополнительные изображения</span>
              <input className={styles.fileInput} type="file" accept="image/*" multiple {...register('additionalImages')} />
            </label>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleClose}>
              Отмена
            </button>
          </div>

          {titleValue ? <p className={styles.hint}>Черновик: {titleValue}</p> : null}
        </form>
      </Container>
    </section>
  );
}