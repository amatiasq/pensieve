const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 30_000;

class CircuitOpenError extends Error {
  constructor() {
    super('Circuit breaker is open — GitHub API temporarily unavailable');
  }
}

// After 3 server-side failures every call fails fast for 30s, so an unreachable
// or rate-limited GitHub degrades the app to local-only instead of hanging it.
function createCircuitBreaker() {
  let state: 'closed' | 'open' | 'half-open' = 'closed';
  let failures = 0;
  let openedAt = 0;

  return function execute<T>(fn: () => Promise<T>): Promise<T> {
    if (state === 'open') {
      if (Date.now() - openedAt < COOLDOWN_MS) {
        return Promise.reject(new CircuitOpenError());
      }
      state = 'half-open';
    }

    return fn().then(
      result => {
        failures = 0;
        state = 'closed';
        return result;
      },
      error => {
        onFailure(error);
        throw error;
      },
    );
  };

  function onFailure(error: unknown) {
    // A 4xx is our request being wrong, not GitHub being down — except 429
    if (isHttpError(error) && error.status < 500 && error.status !== 429) {
      return;
    }

    if (++failures < FAILURE_THRESHOLD) {
      return;
    }

    state = 'open';
    openedAt = Date.now();

    const resetAt = isHttpError(error) && error.status === 429
      ? parseRateLimitReset(error.body)
      : 0;

    if (resetAt > 0) {
      openedAt = Date.now() - COOLDOWN_MS + resetAt;
    }
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
    const reset = JSON.parse(body)?.['X-RateLimit-Reset'];
    return reset ? reset * 1000 - Date.now() : 0;
  } catch {
    return 0;
  }
}

export const githubCircuitBreaker = createCircuitBreaker();
