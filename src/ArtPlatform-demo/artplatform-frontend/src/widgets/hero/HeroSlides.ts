import hero1 from '../../shared/assets/hero-images/hero-1.jpg';
import hero2 from '../../shared/assets/hero-images/hero-2.jpg';
import hero3 from '../../shared/assets/hero-images/hero-3.jpg';
import hero4 from '../../shared/assets/hero-images/hero-4.jpg';
import hero5 from '../../shared/assets/hero-images/hero-5.jpg';

export type HeroSlide = {
  image: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  to: string;
  layout: 'left' | 'right';
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    image: hero1,
    eyebrow: 'ArtPlatform',
    title: 'Искусство, которое хочется рассматривать.',
    text: 'Открой подборки картин, авторов и коллекций, чтобы найти работу под настроение, интерьер или личную коллекцию.',
    cta: 'Перейти в каталог',
    to: '/catalog',
    layout: 'left',
  },
  {
    image: hero2,
    eyebrow: 'Авторские работы',
    title: 'Поиск картин стал проще.',
    text: 'Категории, стили, материалы и авторы — всё собрано в одном месте для удобного выбора.',
    cta: 'Смотреть каталог',
    to: '/catalog',
    layout: 'right',
  },
  {
    image: hero3,
    eyebrow: 'Для художников',
    title: 'Публикуй свои работы и управляй ими.',
    text: 'Авторы могут создавать картины, редактировать их и показывать свою витрину работ в публичном профиле.',
    cta: 'Создать картину',
    to: '/artworks/create',
    layout: 'left',
  },
  {
    image: hero4,
    eyebrow: 'Избранное и корзина',
    title: 'Сохраняй то, что понравилось.',
    text: 'Добавляй картины в избранное, собирай корзину и возвращайся к выбору позже.',
    cta: 'Войти в аккаунт',
    to: '/login',
    layout: 'right',
  },
  {
    image: hero5,
    eyebrow: 'Платформа для искусства',
    title: 'Каталог, авторы и управление контентом — в одном месте.',
    text: 'Публичные страницы, авторские профили и админка собраны в одной логике.',
    cta: 'Открыть каталог',
    to: '/catalog',
    layout: 'left',
  },
];