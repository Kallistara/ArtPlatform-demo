import { Hero } from '../../widgets/hero/Hero';
import { Categories } from '../../widgets/categories/Categories';
import { PopularArtworks } from '../../widgets/popular-artworks/PopularArtworks';
import { AboutBlock } from '../../widgets/about-block/AboutBlock';
import { Advantages } from '../../widgets/advantages/Advantages';

export function HomePage() {
  return (
    <>
      <Hero />
      <Categories />
      <PopularArtworks />
      <AboutBlock />
      <Advantages />
    </>
  );
}