import { request } from './client';

export type FavoriteItem = {
  id: string;
  userId: string;
  artworkId: string;
  artworkTitle: string;
  artistId: string;
  artistName: string;
  category: string;
  price: number;
  mainImageUrl: string;
  addedAt: string;
};

export type FavoriteExistsResponse = {
  artworkId: string;
  isFavorite: boolean;
};

export function getMyFavorites() {
  return request<FavoriteItem[]>('/favorites/me');
}

export function addToFavorites(artworkId: string) {
  return request<{ message: string; favorite: FavoriteItem }>(`/favorites/me/${artworkId}`, {
    method: 'POST',
  });
}

export function removeFromFavorites(artworkId: string) {
  return request<void>(`/favorites/me/${artworkId}`, {
    method: 'DELETE',
  });
}

export function isFavorite(artworkId: string) {
  return request<FavoriteExistsResponse>(`/favorites/me/${artworkId}/exists`);
}