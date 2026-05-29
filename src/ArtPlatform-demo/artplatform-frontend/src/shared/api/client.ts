import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig, type Method } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
});

function getAuthToken(): string {
  const raw = localStorage.getItem('artplatform_auth');

  if (!raw) return '';

  try {
    const parsed = JSON.parse(raw) as { token?: string; tokenType?: string };

    if (!parsed.token) return '';

    return `${parsed.tokenType ?? 'Bearer'} ${parsed.token}`;
  } catch {
    return '';
  }
}

client.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    config.headers.Authorization = token;
  }

  return config;
});

type RequestOptions = Omit<AxiosRequestConfig, 'url' | 'method'> & {
  method?: Method;
};

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  try {
    const isFormData = typeof FormData !== 'undefined' && options.data instanceof FormData;

    const headers = new AxiosHeaders(options.headers);

    if (!isFormData && !headers.has('Content-Type') && options.data !== undefined) {
      headers.set('Content-Type', 'application/json');
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