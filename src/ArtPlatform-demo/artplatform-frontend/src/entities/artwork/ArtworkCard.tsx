import { Link } from 'react-router-dom';
import { Card } from '../../shared/ui/Card/Card';
import styles from './ArtworkCard.module.css';

export type ArtworkCardProps = {
  id: string;
  title: string;
  artistName: string;
  price: number;
  imageUrl: string;
  category?: string;
};

export function ArtworkCard({ id, title, artistName, price, imageUrl, category }: ArtworkCardProps) {
  return (
    <Card className={styles.card}>
      <Link to={`/artworks/${id}`} className={styles.link}>
        <div className={styles.imageWrap}>
          <img className={styles.image} src={imageUrl} alt={title} />
        </div>
        <div className={styles.body}>
          {category ? <p className={styles.category}>{category}</p> : null}
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.artist}>{artistName}</p>
          <p className={styles.price}>${price.toFixed(2)}</p>
        </div>
      </Link>
    </Card>
  );
}