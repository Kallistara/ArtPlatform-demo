import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type Method,
} from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
});

function getStoredAuthHeader(): string {
  const raw = localStorage.getItem('artplatform_auth');

  if (!raw) return '';

  try {
    const parsed = JSON.parse(raw) as {
      token?: string;
      tokenType?: string;
    };

    if (!parsed.token) return '';

    return `${parsed.tokenType ?? 'Bearer'} ${parsed.token}`;
  } catch {
    return '';
  }
}

export type RequestOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'> & {
  method?: Method;
  data?: unknown;
  authToken?: string;
};

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  try {
    const headers = new AxiosHeaders(options.headers);

    if (options.authToken) {
      headers.set('Authorization', `Bearer ${options.authToken}`);
    } else {
      const storedAuth = getStoredAuthHeader();
      if (storedAuth) headers.set('Authorization', storedAuth);
    }

    if (options.data instanceof FormData) {
      headers.delete('Content-Type');
    }

    const response = await client.request<T>({
      url,
      ...options,
      headers,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const message =
        typeof error.response?.data === 'string'
          ? error.response.data
          : error.response?.data?.message;

      throw new Error(
        message || `Request failed with status ${error.response?.status ?? 'unknown'}`
      );
    }

    throw error;
  }
}

export { client };