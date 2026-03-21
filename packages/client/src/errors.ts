/**
 * @sigil-cms/client — Error types
 */

export class SigilError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = 'SigilError';
    this.status = status;
    this.code = code;
    this.details = details;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SigilError.prototype);
  }

  /** True if the error is a 404 Not Found */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True if the error is a 401 or 403 */
  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** True if the error is a 429 rate limit */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  /** True if the server returned a 5xx error */
  get isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }
}

export class SigilNetworkError extends SigilError {
  constructor(message: string, cause?: unknown) {
    super(message, 0, 'NETWORK_ERROR', cause);
    this.name = 'SigilNetworkError';
    Object.setPrototypeOf(this, SigilNetworkError.prototype);
  }
}

export class SigilTimeoutError extends SigilError {
  constructor(url: string, timeout: number) {
    super(`Request to ${url} timed out after ${timeout}ms`, 0, 'TIMEOUT');
    this.name = 'SigilTimeoutError';
    Object.setPrototypeOf(this, SigilTimeoutError.prototype);
  }
}
