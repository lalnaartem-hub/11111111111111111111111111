export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  size: number;
}

export class LRUCache<T> {
  private entries = new Map<string, CacheEntry<T>>();
  private currentSize = 0;

  constructor(private readonly maxSizeBytes: number) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    entry.accessCount += 1;
    entry.timestamp = Date.now();
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.data;
  }

  set(key: string, data: T, size: number): void {
    const existing = this.entries.get(key);
    if (existing) {
      this.currentSize -= existing.size;
      this.entries.delete(key);
    }

    while (this.currentSize + size > this.maxSizeBytes && this.entries.size > 0) {
      const oldestKey = this.entries.keys().next().value as string;
      const oldest = this.entries.get(oldestKey)!;
      this.currentSize -= oldest.size;
      this.entries.delete(oldestKey);
    }

    this.entries.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      size,
    });
    this.currentSize += size;
  }

  delete(key: string): void {
    const entry = this.entries.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.entries.delete(key);
    }
  }

  clear(): void {
    this.entries.clear();
    this.currentSize = 0;
  }
}
