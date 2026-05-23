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

export type ArtworkResponse = {
  message: string;
  artwork: Artwork;
};

export function getArtworks() {
  return request<Artwork[]>('/artworks');
}

export function getArtworkById(id: string) {
  return request<Artwork>(`/artworks/${id}`);
}

export function getArtworksByArtistId(artistId: string) {
  return request<Artwork[]>(`/artworks/artist/${artistId}`);
}

export function getSimilarArtworks(artworkId: string, limit = 6) {
  return request<Artwork[]>(`/artworks/${artworkId}/similar?limit=${limit}`);
}

export function searchArtworks(query: string) {
  return request<Artwork[]>(`/artworks/search?query=${encodeURIComponent(query)}`);
}

export function filterArtworks(params: ArtworkFilter) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return request<Artwork[]>(`/artworks/filter?${searchParams.toString()}`);
}

export function createArtwork(formData: FormData) {
  return request<ArtworkResponse>('/artworks', {
    method: 'POST',
    data: formData,
  });
}

export function updateArtwork(artworkId: string, formData: FormData) {
  return request<ArtworkResponse>(`/artworks/${artworkId}`, {
    method: 'PUT',
    data: formData,
  });
}

export function deleteArtwork(artworkId: string) {
  return request<void>(`/artworks/${artworkId}`, {
    method: 'DELETE',
  });
}