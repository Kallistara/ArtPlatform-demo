import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../../shared/ui/Container/Container';
import { StateMessage } from '../../shared/ui/StateMessage/StateMessage';
import { useToast } from '../../shared/ui/Notifications/ToastProvider';
import styles from './CheckoutPage.module.css';

type CheckoutFormState = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  deliveryMethod: string;
  paymentMethod: string;
  comment: string;
};

type CheckoutFormErrors = Partial<Record<keyof CheckoutFormState, string>>;

const initialState: CheckoutFormState = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  deliveryMethod: 'delivery',
  paymentMethod: 'card',
  comment: '',
};

const nameRegex = /^[A-Za-zА-Яа-яЁё\s-]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]+$/;

function validate(values: CheckoutFormState): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};

  const fullName = values.fullName.trim();
  if (!fullName) {
    errors.fullName = 'Укажите ФИО.';
  } else if (fullName.length < 3) {
    errors.fullName = 'ФИО должно содержать минимум 3 символа.';
  } else if (fullName.length > 80) {
    errors.fullName = 'ФИО не должно превышать 80 символов.';
  } else if (!nameRegex.test(fullName)) {
    errors.fullName = 'Используйте только буквы, пробел и дефис.';
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = 'Укажите email.';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Введите корректный email.';
  }

  const phone = values.phone.trim();
  if (!phone) {
    errors.phone = 'Укажите телефон.';
  } else if (phone.length < 6) {
    errors.phone = 'Телефон слишком короткий.';
  } else if (phone.length > 20) {
    errors.phone = 'Телефон слишком длинный.';
  } else if (!phoneRegex.test(phone)) {
    errors.phone = 'Телефон может содержать только цифры, пробел, +, -, (, ).';
  }

  const city = values.city.trim();
  if (!city) {
    errors.city = 'Укажите город.';
  } else if (city.length < 2) {
    errors.city = 'Город слишком короткий.';
  } else if (city.length > 60) {
    errors.city = 'Город слишком длинный.';
  } else if (!nameRegex.test(city)) {
    errors.city = 'Используйте только буквы, пробел и дефис.';
  }

  const address = values.address.trim();
  if (!address) {
    errors.address = 'Укажите адрес доставки.';
  } else if (address.length < 5) {
    errors.address = 'Адрес слишком короткий.';
  } else if (address.length > 120) {
    errors.address = 'Адрес слишком длинный.';
  }

  if (!values.deliveryMethod) {
    errors.deliveryMethod = 'Выберите способ доставки.';
  }

  if (!values.paymentMethod) {
    errors.paymentMethod = 'Выберите способ оплаты.';
  }

  if (values.comment.trim().length > 500) {
    errors.comment = 'Комментарий не должен превышать 500 символов.';
  }

  return errors;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [form, setForm] = useState<CheckoutFormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [touched, setTouched] = useState<Record<keyof CheckoutFormState, boolean>>({
    fullName: false,
    email: false,
    phone: false,
    city: false,
    address: false,
    deliveryMethod: false,
    paymentMethod: false,
    comment: false,
  });

  const errors = useMemo(() => validate(form), [form]);
  const isFormValid = Object.keys(errors).length === 0;

  const onChange = (field: keyof CheckoutFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onBlur = (field: keyof CheckoutFormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (!isFormValid) {
      toastError('Ошибка оформления', 'Заполните все обязательные поля корректно.');
      return;
    }

    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showError = (field: keyof CheckoutFormState) => touched[field] || attemptedSubmit;

  if (submitted) {
    return (
      <section className={styles.page}>
        <Container>
          <StateMessage
            title="Заказ оформлен"
            description="Заявка отправлена. Менеджер свяжется с вами для подтверждения заказа."
          />

          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={() => navigate('/catalog')}>
              Вернуться в каталог
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => navigate('/cart')}>
              Вернуться в корзину
            </button>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <Container>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Оформление заказа</h1>
            <p className={styles.subtitle}>
              Заполните контактные данные и выберите способ доставки. 
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>ФИО</span>
              <input
                className={styles.input}
                value={form.fullName}
                onChange={(e) => onChange('fullName', e.target.value)}
                onBlur={() => onBlur('fullName')}
                placeholder="Иванов Иван Иванович"
              />
              {showError('fullName') && errors.fullName ? (
                <div className={styles.error}>{errors.fullName}</div>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Email</span>
              <input
                className={styles.input}
                type="email"
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                onBlur={() => onBlur('email')}
                placeholder="name@example.com"
              />
              {showError('email') && errors.email ? <div className={styles.error}>{errors.email}</div> : null}
            </label>

            <label className={styles.field}>
              <span>Телефон</span>
              <input
                className={styles.input}
                value={form.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                onBlur={() => onBlur('phone')}
                placeholder="+7 (999) 123-45-67"
              />
              {showError('phone') && errors.phone ? <div className={styles.error}>{errors.phone}</div> : null}
            </label>

            <label className={styles.field}>
              <span>Город</span>
              <input
                className={styles.input}
                value={form.city}
                onChange={(e) => onChange('city', e.target.value)}
                onBlur={() => onBlur('city')}
                placeholder="Москва"
              />
              {showError('city') && errors.city ? <div className={styles.error}>{errors.city}</div> : null}
            </label>

            <label className={`${styles.field} ${styles.fullWidth}`}>
              <span>Адрес доставки</span>
              <input
                className={styles.input}
                value={form.address}
                onChange={(e) => onChange('address', e.target.value)}
                onBlur={() => onBlur('address')}
                placeholder="Улица, дом, квартира"
              />
              {showError('address') && errors.address ? <div className={styles.error}>{errors.address}</div> : null}
            </label>

            <label className={styles.field}>
              <span>Способ доставки</span>
              <select
                className={styles.input}
                value={form.deliveryMethod}
                onChange={(e) => onChange('deliveryMethod', e.target.value)}
                onBlur={() => onBlur('deliveryMethod')}
              >
                <option value="delivery">Доставка курьером</option>
                <option value="pickup">Самовывоз</option>
              </select>
              {showError('deliveryMethod') && errors.deliveryMethod ? (
                <div className={styles.error}>{errors.deliveryMethod}</div>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Способ оплаты</span>
              <select
                className={styles.input}
                value={form.paymentMethod}
                onChange={(e) => onChange('paymentMethod', e.target.value)}
                onBlur={() => onBlur('paymentMethod')}
              >
                <option value="card">Картой</option>
                <option value="cash">Наличными</option>
                <option value="transfer">Переводом</option>
              </select>
              {showError('paymentMethod') && errors.paymentMethod ? (
                <div className={styles.error}>{errors.paymentMethod}</div>
              ) : null}
            </label>

            <label className={`${styles.field} ${styles.fullWidth}`}>
              <span>Комментарий к заказу</span>
              <textarea
                className={styles.textarea}
                value={form.comment}
                onChange={(e) => onChange('comment', e.target.value)}
                onBlur={() => onBlur('comment')}
                placeholder="Например: оставить у охраны, связаться заранее..."
              />
              {showError('comment') && errors.comment ? (
                <div className={styles.error}>{errors.comment}</div>
              ) : null}
            </label>
          </div>

          <div className={styles.note}>
            Нажимая кнопку ниже, вы отправляете заявку на оформление заказа.
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.button} disabled={!isFormValid}>
              Оформить заказ
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => navigate('/cart')}>
              Вернуться в корзину
            </button>
          </div>
        </form>
      </Container>
    </section>
  );
}