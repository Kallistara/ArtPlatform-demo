import { request } from './client';

export type CartItem = {
  id: string;
  userId: string;
  artistId: string;
  artistName: string;
  artworkId: string;
  artworkTitle: string;
  category: string;
  price: number;
  mainImageUrl: string;
  addedAt: string;
  quantity: number;
};

export type CartExistsResponse = {
  artworkId: string;
  isInCart: boolean;
};

export function getMyCart() {
  return request<CartItem[]>('/cart/me');
}

export function addToCart(artworkId: string) {
  return request<CartItem>(`/cart/me/${artworkId}`, {
    method: 'POST',
  });
}

export function decreaseCartItem(artworkId: string) {
  return request<void>(`/cart/me/${artworkId}/decrease`, {
    method: 'PATCH',
  });
}

export function removeFromCart(artworkId: string) {
  return request<void>(`/cart/me/${artworkId}`, {
    method: 'DELETE',
  });
}

export function clearCart() {
  return request<{ message: string; result: number }>('/cart/me', {
    method: 'DELETE',
  });
}

export function isInCart(artworkId: string) {
  return request<CartExistsResponse>(`/cart/me/${artworkId}/exists`);
}