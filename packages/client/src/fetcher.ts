/**
 * @sigil-cms/client — HTTP fetcher
 *
 * Thin wrapper around native fetch with timeout, error handling,
 * and header injection. Zero runtime dependencies.
 */

import { SigilError, SigilNetworkError, SigilTimeoutError } from './errors.js';
import type { ApiErrorResponse, SigilConfig } from './types.js';

export interface FetchOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export function createFetcher(config: SigilConfig) {
  const fetchFn = config.fetch ?? globalThis.fetch;
  const timeout = config.timeout ?? 30_000;
  const baseUrl = config.baseUrl.replace(/\/+$/, '');

  function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  function buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...config.headers,
      ...extra,
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    return headers;
  }

  async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const url = buildUrl(path, options.params);
    const headers = buildHeaders(options.headers);

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    // Timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Combine external signal with timeout
    const signal = options.signal
      ? combineSignals(options.signal, controller.signal)
      : controller.signal;

    try {
      const response = await fetchFn(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorBody: ApiErrorResponse | undefined;
        try {
          errorBody = await response.json() as ApiErrorResponse;
        } catch {
          // response body was not JSON
        }

        throw new SigilError(
          errorBody?.error?.message ?? `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorBody?.error?.code ?? 'HTTP_ERROR',
          errorBody?.error?.details,
        );
      }

      // 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof SigilError) {
        throw err;
      }

      if (err instanceof DOMException && err.name === 'AbortError') {
        if (options.signal?.aborted) {
          throw new SigilError('Request aborted', 0, 'ABORTED');
        }
        throw new SigilTimeoutError(url, timeout);
      }

      throw new SigilNetworkError(
        err instanceof Error ? err.message : 'Network request failed',
        err,
      );
    }
  }

  return { request, buildUrl };
}

/** Combine two AbortSignals — aborts when either fires */
function combineSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (a.aborted) return a;
  if (b.aborted) return b;

  const controller = new AbortController();
  const abort = () => controller.abort();
  a.addEventListener('abort', abort, { once: true });
  b.addEventListener('abort', abort, { once: true });
  return controller.signal;
}
