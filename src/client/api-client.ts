/**
 * Simple API client for making HTTP requests to the game server
 */

export interface ApiClientOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

export class ApiClient {
  public readonly baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(baseUrl: string, options: ApiClientOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    this.timeout = options.timeout || 30000; // 30 second default
  }

  async request<T = any>(
    method: string,
    path: string,
    options?: {
      body?: any;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    },
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          ...this.headers,
          ...options?.headers,
        },
        signal: options?.signal || controller.signal,
      };

      if (options?.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.message || `Request failed: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return (await response.text()) as any;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  async get<T = any>(
    path: string,
    options?: Omit<Parameters<typeof this.request>[2], 'body'>,
  ): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T = any>(
    path: string,
    body?: any,
    options?: Parameters<typeof this.request>[2],
  ): Promise<T> {
    return this.request<T>('POST', path, { ...options, body });
  }

  async put<T = any>(
    path: string,
    body?: any,
    options?: Parameters<typeof this.request>[2],
  ): Promise<T> {
    return this.request<T>('PUT', path, { ...options, body });
  }

  async delete<T = any>(
    path: string,
    options?: Omit<Parameters<typeof this.request>[2], 'body'>,
  ): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.headers['Authorization'];
  }
}

export function createApiClient(baseUrl: string, options?: ApiClientOptions): ApiClient {
  return new ApiClient(baseUrl, options);
}
