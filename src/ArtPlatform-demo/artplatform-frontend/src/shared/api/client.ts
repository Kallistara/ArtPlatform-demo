const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function getAuthToken() {
  const raw = localStorage.getItem('artplatform_auth');
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? '';
  } catch {
    return '';
  }
}

export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}