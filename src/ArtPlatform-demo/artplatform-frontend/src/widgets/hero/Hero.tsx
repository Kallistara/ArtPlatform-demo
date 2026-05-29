import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HERO_SLIDES } from './HeroSlides';
import styles from './Hero.module.css';

export function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[index];

  const prev = () => setIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const next = () => setIndex((prev) => (prev + 1) % HERO_SLIDES.length);

  return (
    <section className={styles.hero}>
      <div className={styles.frame}>
        <div className={`${styles.slide} ${slide.layout === 'left' ? styles.left : styles.right}`}>
          <img className={styles.image} src={slide.image} alt={slide.title} />
          <div className={styles.overlay} />
          <div className={styles.content}>
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h1 className={styles.title}>{slide.title}</h1>
            <p className={styles.text}>{slide.text}</p>
            <Link to={slide.to} className={styles.cta}>
              {slide.cta}
            </Link>
          </div>
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.arrow} onClick={prev} aria-label="Предыдущий слайд">
            ‹
          </button>
          <button type="button" className={styles.arrow} onClick={next} aria-label="Следующий слайд">
            ›
          </button>
        </div>

        <div className={styles.dots}>
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Слайд ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}