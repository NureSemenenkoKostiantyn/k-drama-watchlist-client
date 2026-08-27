interface CacheEntry<T> {
  readonly value: T;
  readonly freshUntil: number;
}

export class TimedRequestCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly inFlight = new Map<string, Promise<T>>();

  constructor(
    private readonly ttlMilliseconds: number,
    private readonly maxEntries = 50,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key);
    if (cached && cached.freshUntil > this.now()) {
      this.touch(key, cached);
      return Promise.resolve(cached.value);
    }

    if (cached) {
      this.entries.delete(key);
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending;
    }

    let loaded: Promise<T>;
    try {
      loaded = load();
    } catch (error: unknown) {
      loaded = Promise.reject(error);
    }

    const request = loaded
      .then((value) => {
        this.store(key, value);
        return value;
      })
      .finally(() => {
        if (this.inFlight.get(key) === request) {
          this.inFlight.delete(key);
        }
      });

    this.inFlight.set(key, request);
    return request;
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  private store(key: string, value: T): void {
    this.entries.delete(key);
    this.entries.set(key, {
      value,
      freshUntil: this.now() + this.ttlMilliseconds,
    });

    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value as string | undefined;
      if (oldestKey === undefined) return;
      this.entries.delete(oldestKey);
    }
  }

  private touch(key: string, entry: CacheEntry<T>): void {
    this.entries.delete(key);
    this.entries.set(key, entry);
  }
}
