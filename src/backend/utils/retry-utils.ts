/**
 * Retry Utilities
 * Provides retry logic, exponential backoff, and circuit breaker functionality
 */

import {
  ApplicationError,
  BaseError,
  NetworkError,
  TimeoutError,
} from '@/shared/errors';
import type {
  CircuitBreakerConfig,
  ErrorCategory,
  RetryConfig,
} from '@/shared/types/error-types';

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    exponentialBackoff = true,
    jitter = true,
    retryCondition = (error: Error) => isRetryableError(error),
  } = config;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (!retryCondition(lastError)) {
        throw lastError;
      }

      // Don't wait after the last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Calculate delay
      let delay = exponentialBackoff
        ? Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
        : baseDelay;

      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Network errors are usually retryable
  if (
    message.includes('enotfound') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('timeout') ||
    message.includes('network') ||
    error instanceof NetworkError ||
    error instanceof TimeoutError
  ) {
    return true;
  }

  // File system errors that might be temporary
  if (
    message.includes('ebusy') ||
    message.includes('eagain') ||
    message.includes('emfile')
  ) {
    return true;
  }

  // Database connection errors
  if (
    message.includes('database is locked') ||
    message.includes('connection lost')
  ) {
    return true;
  }

  // HTTP status codes that are retryable
  if (error instanceof BaseError && error.details?.status) {
    const status = error.details.status;
    return status >= 500 || status === 429 || status === 408;
  }

  return false;
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      enabled: true,
      ...config,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.config.enabled) {
      return await fn();
    }

    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new ApplicationError(
          'Circuit breaker is open',
          'CIRCUIT_BREAKER_OPEN',
          {
            recoverable: true,
            userMessage:
              'Service is temporarily unavailable. Please try again later.',
            suggestions: [
              'Wait a moment and try again',
              'Check your connection',
            ],
          },
        );
      }
    }

    try {
      const result = await fn();

      if (this.state === 'half-open') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  private reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }

  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out',
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new TimeoutError(errorMessage, {
          details: { timeout: timeoutMs },
        }),
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Batch retry operations with concurrency control
 */
export async function retryBatch<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options: {
    concurrency?: number;
    retryConfig?: Partial<RetryConfig>;
    onProgress?: (completed: number, total: number, failures: number) => void;
  } = {},
): Promise<Array<{ item: T; result?: R; error?: Error }>> {
  const { concurrency = 3, retryConfig = {}, onProgress } = options;

  const results: Array<{ item: T; result?: R; error?: Error }> = [];
  let completed = 0;
  let failures = 0;

  // Process items in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);

    const batchPromises = batch.map(async item => {
      try {
        const result = await retryWithBackoff(
          () => operation(item),
          retryConfig,
        );

        completed++;
        if (onProgress) onProgress(completed, items.length, failures);

        return { item, result };
      } catch (error) {
        failures++;
        completed++;
        if (onProgress) onProgress(completed, items.length, failures);

        return {
          item,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Debounce function calls to prevent excessive retries
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number,
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Throttle function calls to limit retry frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number,
): T & { cancel: () => void } {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= limitMs) {
      lastCallTime = now;
      func(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func(...args);
      }, limitMs - timeSinceLastCall);
    }
  }) as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a retry policy based on error category
 */
export function createRetryPolicy(
  category: ErrorCategory,
): Partial<RetryConfig> {
  switch (category) {
    case 'network':
      return {
        maxAttempts: 5,
        baseDelay: 1000,
        maxDelay: 30000,
        exponentialBackoff: true,
        jitter: true,
      };

    case 'filesystem':
      return {
        maxAttempts: 3,
        baseDelay: 500,
        maxDelay: 5000,
        exponentialBackoff: true,
        jitter: false,
      };

    case 'database':
      return {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        exponentialBackoff: true,
        jitter: true,
      };

    case 'dependency':
      return {
        maxAttempts: 2,
        baseDelay: 2000,
        maxDelay: 10000,
        exponentialBackoff: true,
        jitter: false,
      };

    default:
      return {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        exponentialBackoff: true,
        jitter: true,
      };
  }
}

/**
 * Health check utility
 */
export class HealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map();
  private results: Map<
    string,
    { healthy: boolean; lastCheck: Date; error?: string }
  > = new Map();

  addCheck(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  async runCheck(name: string): Promise<boolean> {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    try {
      const healthy = await check();
      this.results.set(name, {
        healthy,
        lastCheck: new Date(),
      });
      return healthy;
    } catch (error) {
      this.results.set(name, {
        healthy: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async runAllChecks(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [name] of this.checks) {
      try {
        const healthy = await this.runCheck(name);
        results.set(name, healthy);
      } catch (error) {
        results.set(name, false);
      }
    }

    return results;
  }

  getResults(): Map<
    string,
    { healthy: boolean; lastCheck: Date; error?: string }
  > {
    return new Map(this.results);
  }

  isHealthy(): boolean {
    for (const [, result] of this.results) {
      if (!result.healthy) {
        return false;
      }
    }
    return true;
  }
}
