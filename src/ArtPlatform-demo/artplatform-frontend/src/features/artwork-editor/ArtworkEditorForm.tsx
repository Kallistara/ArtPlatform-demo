import { useEffect, useMemo } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const CATEGORY_OPTIONS = ['Абстракция', 'Пейзаж', 'Портрет', 'Натюрморт', 'Фигуратив'] as const;
const STYLE_OPTIONS = ['Реализм', 'Импрессионизм', 'Сюрреализм', 'Минимализм', 'Современное искусство'] as const;
const MATERIAL_OPTIONS = ['Холст и масло', 'Акрил', 'Акварель', 'Пастель', 'Смешанная техника'] as const;

function createSchema(isCreate: boolean) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(3, 'Минимум 3 символа')
      .max(50, 'Максимум 50 символов')
      .regex(/^[a-zA-Z0-9_]+$/, 'Только буквы, цифры и подчеркивание'),
    description: z.string().trim().min(1, 'Описание обязательно').max(500, 'Максимум 500 символов'),
    category: z.enum(CATEGORY_OPTIONS, { message: 'Выберите категорию из списка' }),
    style: z.enum(STYLE_OPTIONS, { message: 'Выберите стиль из списка' }),
    material: z.enum(MATERIAL_OPTIONS, { message: 'Выберите материал из списка' }),
    price: z.coerce.number().min(0, 'Цена не может быть отрицательной'),
    quantity: z.coerce.number().int().min(0, 'Количество не может быть отрицательным'),
    width: z.coerce.number().positive('Ширина должна быть больше 0'),
    height: z.coerce.number().positive('Высота должна быть больше 0'),
    mainImage: z.any().refine(
      (value) => {
        if (isCreate) {
          return value instanceof FileList && value.length > 0;
        }
        return value === undefined || value instanceof FileList;
      },
      isCreate ? 'Главное изображение обязательно' : 'Некорректный файл'
    ),
    additionalImages: z.any().optional(),
  });
}

export type ArtworkFormValues = {
  title: string;
  description: string;
  category: (typeof CATEGORY_OPTIONS)[number];
  style: (typeof STYLE_OPTIONS)[number];
  material: (typeof MATERIAL_OPTIONS)[number];
  price: number;
  quantity: number;
  width: number;
  height: number;
  mainImage?: FileList;
  additionalImages?: FileList;
};

type Props = {
  mode: 'create' | 'edit';
  submitLabel: string;
  initialValues?: Partial<ArtworkFormValues>;
  onSubmit: (values: ArtworkFormValues) => Promise<void>;
};

export function ArtworkEditorForm({ mode, submitLabel, initialValues, onSubmit }: Props) {
  const schema = useMemo(() => createSchema(mode === 'create'), [mode]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ArtworkFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      category: CATEGORY_OPTIONS[0],
      style: STYLE_OPTIONS[0],
      material: MATERIAL_OPTIONS[0],
      price: 0,
      quantity: 1,
      width: 1,
      height: 1,
      ...initialValues,
    },
  });

  useEffect(() => {
    if (!initialValues) return;
    reset({
      title: initialValues.title ?? '',
      description: initialValues.description ?? '',
      category: initialValues.category ?? CATEGORY_OPTIONS[0],
      style: initialValues.style ?? STYLE_OPTIONS[0],
      material: initialValues.material ?? MATERIAL_OPTIONS[0],
      price: initialValues.price ?? 0,
      quantity: initialValues.quantity ?? 1,
      width: initialValues.width ?? 1,
      height: initialValues.height ?? 1,
      mainImage: undefined,
      additionalImages: undefined,
    });
  }, [initialValues, reset]);

  const mainImage = watch('mainImage');
  const additionalImages = watch('additionalImages');

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        display: 'grid',
        gap: 16,
        padding: 20,
        border: '1px solid rgba(128,128,128,0.18)',
        borderRadius: 20,
      }}
    >
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Название</span>
          <input {...register('title')} />
          {errors.title ? <small style={{ color: '#ef4444' }}>{errors.title.message}</small> : null}
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Категория</span>
          <select {...register('category')}>
            {CATEGORY_OPTIONS.map((option) => (
              <option value={option} key={option}>{option}</option>
            ))}
          </select>
          {errors.category ? <small style={{ color: '#ef4444' }}>{errors.category.message}</small> : null}
        </label>
      </div>

      <label style={{ display: 'grid', gap: 6 }}>
        <span>Описание</span>
        <textarea {...register('description')} style={{ minHeight: 110 }} />
        {errors.description ? <small style={{ color: '#ef4444' }}>{errors.description.message}</small> : null}
      </label>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Стиль</span>
          <select {...register('style')}>
            {STYLE_OPTIONS.map((option) => (
              <option value={option} key={option}>{option}</option>
            ))}
          </select>
          {errors.style ? <small style={{ color: '#ef4444' }}>{errors.style.message}</small> : null}
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Материал</span>
          <select {...register('material')}>
            {MATERIAL_OPTIONS.map((option) => (
              <option value={option} key={option}>{option}</option>
            ))}
          </select>
          {errors.material ? <small style={{ color: '#ef4444' }}>{errors.material.message}</small> : null}
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Цена</span>
          <input type="number" step="0.01" {...register('price')} />
          {errors.price ? <small style={{ color: '#ef4444' }}>{errors.price.message}</small> : null}
        </label>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Количество</span>
          <input type="number" {...register('quantity')} />
          {errors.quantity ? <small style={{ color: '#ef4444' }}>{errors.quantity.message}</small> : null}
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Ширина</span>
          <input type="number" step="0.1" {...register('width')} />
          {errors.width ? <small style={{ color: '#ef4444' }}>{errors.width.message}</small> : null}
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Высота</span>
          <input type="number" step="0.1" {...register('height')} />
          {errors.height ? <small style={{ color: '#ef4444' }}>{errors.height.message}</small> : null}
        </label>
      </div>

      <label style={{ display: 'grid', gap: 6 }}>
        <span>Главное изображение {mode === 'edit' ? '(можно оставить текущее)' : ''}</span>
        <input type="file" accept="image/*" {...register('mainImage')} />
        <small>{mainImage instanceof FileList && mainImage.length > 0 ? mainImage[0].name : 'Файл не выбран'}</small>
        {errors.mainImage ? <small style={{ color: '#ef4444' }}>{String(errors.mainImage.message)}</small> : null}
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span>Дополнительные изображения</span>
        <input type="file" accept="image/*" multiple {...register('additionalImages')} />
        <small>
          {additionalImages instanceof FileList && additionalImages.length > 0
            ? `Выбрано файлов: ${additionalImages.length}`
            : 'Можно выбрать несколько файлов'}
        </small>
      </label>

      <button type="submit">
        {isSubmitting ? 'Сохранение...' : submitLabel}
      </button>
    </form>
  );
}