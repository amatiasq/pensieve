const CLEANUP_INTERVAL_MS = 60_000;

export class MemoryCache<T> {
  private readonly data = new Map<string, unknown>();
  private readonly time = new Map<string, number>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(private readonly duration: number) {
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
  }

  has(key: string) {
    const time = this.time.get(key);
    if (time == null) return false;
    const seconds = (Date.now() - time) / 1000;
    const expired = seconds > this.duration;

    if (expired) {
      this.time.delete(key);
      this.data.delete(key);
    }

    return !expired;
  }

  get(key: string) {
    return this.data.get(key) as T;
  }

  set(key: string, value: T) {
    this.time.set(key, Date.now());
    this.data.set(key, value);
  }

  private cleanup() {
    const now = Date.now();

    for (const [key, time] of this.time) {
      if ((now - time) / 1000 > this.duration) {
        this.time.delete(key);
        this.data.delete(key);
      }
    }
  }
}
