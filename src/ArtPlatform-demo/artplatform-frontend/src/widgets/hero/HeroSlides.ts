import hero1 from '../../shared/assets/hero-images/hero_1.jpg';
import hero2 from '../../shared/assets/hero-images/hero_2.jpg';
import hero3 from '../../shared/assets/hero-images/hero_3.jpg';
import hero4 from '../../shared/assets/hero-images/hero_4.jpg';
import hero5 from '../../shared/assets/hero-images/hero_5.jpg';

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
    eyebrow: 'Эксклюзивные работы',
    title: 'Новые картины и художники.',
    text: 'Современные картины, популярные художники собраны в одном месте для удобного поиска и выбора.',
    cta: 'Смотреть каталог',
    to: '/catalog',
    layout: 'right',
  },
  {
    image: hero3,
    eyebrow: 'Для художников',
    title: 'Публикуй свои работы и управляй ими.',
    text: 'Авторы могут публиковать картины, редактировать их и показывать свое портфолио работ в публичном профиле.',
    cta: 'Создать картину',
    to: '/artworks/create',
    layout: 'left',
  },
  {
    image: hero4,
    eyebrow: 'Избранное и корзина',
    title: 'Сохраняй то, что понравилось.',
    text: 'Добавляй картины в избранное, собирай корзину и возвращайся к покупке позже.',
    cta: 'Войти в аккаунт',
    to: '/login',
    layout: 'right',
  },
  {
    image: hero5,
    eyebrow: 'Платформа для искусства',
    title: 'Каталог, авторы, контент — в одном месте.',
    text: 'Публичные страницы, авторские профили и коммуникация с художниками.',
    cta: 'Открыть каталог',
    to: '/catalog',
    layout: 'left',
  },
];