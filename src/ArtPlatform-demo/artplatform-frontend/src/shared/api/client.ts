import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type Method,
} from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getStoredAuthHeader(): string {
  const raw = localStorage.getItem('artplatform_auth');

  if (!raw) {
    return '';
  }

  try {
    const parsed = JSON.parse(raw) as {
      token?: string;
      tokenType?: string;
    };

    if (!parsed.token) {
      return '';
    }

    return `${parsed.tokenType ?? 'Bearer'} ${parsed.token}`;
  } catch {
    return '';
  }
}

client.interceptors.request.use((config) => {
  const hasAuthorization =
    config.headers &&
    'Authorization' in config.headers;

  if (hasAuthorization) {
    return config;
  }

  const token = getStoredAuthHeader();

  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    config.headers.Authorization = token;
  }

  return config;
});

export type RequestOptions = Omit<
  AxiosRequestConfig,
  'url' | 'method'
> & {
  method?: Method;
  authToken?: string;
};

export async function request<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    const headers = new AxiosHeaders(options.headers);

    if (options.authToken) {
      headers.set('Authorization', `Bearer ${options.authToken}`);
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
        message ||
          `Request failed with status ${
            error.response?.status ?? 'unknown'
          }`
      );
    }

    throw error;
  }
}

export { client };