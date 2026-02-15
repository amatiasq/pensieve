type State = 'closed' | 'open' | 'half-open';

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 30_000;

export class CircuitBreaker {
  private state: State = 'closed';
  private failures = 0;
  private openedAt = 0;

  execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= COOLDOWN_MS) {
        this.state = 'half-open';
      } else {
        return Promise.reject(new CircuitOpenError());
      }
    }

    return fn().then(
      result => {
        this.onSuccess();
        return result;
      },
      error => {
        this.onFailure(error);
        throw error;
      },
    );
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(error: unknown) {
    // Don't count client errors (4xx except 429) as circuit failures
    if (isHttpError(error) && error.status < 500 && error.status !== 429) {
      return;
    }

    this.failures++;

    if (this.failures >= FAILURE_THRESHOLD) {
      this.state = 'open';
      this.openedAt = Date.now();

      // Respect rate limit reset header if available
      if (isHttpError(error) && error.status === 429) {
        const resetAt = parseRateLimitReset(error.body);
        if (resetAt > 0) {
          this.openedAt = Date.now() - COOLDOWN_MS + resetAt;
        }
      }
    }
  }
}

export class CircuitOpenError extends Error {
  constructor() {
    super('Circuit breaker is open — GitHub API temporarily unavailable');
  }
}

function isHttpError(error: unknown): error is { status: number; body: string } {
  return (
    error != null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as any).status === 'number'
  );
}

function parseRateLimitReset(body: string): number {
  try {
    const data = JSON.parse(body);
    if (data?.['X-RateLimit-Reset']) {
      return (data['X-RateLimit-Reset'] * 1000 - Date.now());
    }
  } catch {
    // ignore
  }
  return 0;
}

export const githubCircuitBreaker = new CircuitBreaker();
