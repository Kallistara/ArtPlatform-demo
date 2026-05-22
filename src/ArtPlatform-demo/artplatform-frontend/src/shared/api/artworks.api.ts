import { request } from './client';

export type Artwork = {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  description: string;
  category: string;
  style: string;
  material: string;
  price: number;
  quantity: number;
  width: number;
  height: number;
  mainImageUrl: string;
  additionaImageUrls: string[];
  createdAt: string;
  updatedAt: string;
  isAvailable: boolean;
};

export type ArtworkFilter = {
  artistName?: string;
  category?: string;
  style?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  isAvailable?: boolean;
};

export function getArtworks() {
  return request<Artwork[]>('/api/artworks');
}

export function getArtworkById(id: string) {
  return request<Artwork>(`/api/artworks/${id}`);
}

export function searchArtworks(query: string) {
  return request<Artwork[]>(`/api/artworks/search?query=${encodeURIComponent(query)}`);
}

export function filterArtworks(params: ArtworkFilter) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return request<Artwork[]>(`/api/artworks/filter?${searchParams.toString()}`);
}