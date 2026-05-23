const ART_SERVICE_BASE_URL =
  import.meta.env.VITE_ART_SERVICE_BASE_URL ?? 'http://localhost:5004';

export function toImageUrl(url?: string | null): string {
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `${ART_SERVICE_BASE_URL}${url}`;
}