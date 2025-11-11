/**
 * High-performance in-memory cache with LRU eviction
 * Optimized for M1 Pro's unified memory architecture
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize = 100, ttl = 3600000) {
    // Use Map for O(1) operations
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl; // Default 1 hour
  }

  /**
   * Get value with O(1) time complexity
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access count and move to end (LRU)
    entry.accessCount++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set value with O(1) time complexity
   */
  set(key: K, value: V): void {
    // If key exists, update it
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.timestamp = Date.now();
      entry.accessCount++;
      this.cache.delete(key);
      this.cache.set(key, entry);
      return;
    }

    // If cache is full, evict least recently used
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  /**
   * Check if key exists with O(1) time complexity
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete key with O(1) time complexity
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length || 0,
      oldestEntry: Math.min(...entries.map((e) => e.timestamp)),
      newestEntry: Math.max(...entries.map((e) => e.timestamp)),
    };
  }
}

/**
 * Global caches for different use cases
 */
export const embeddingCache = new LRUCache<string, number[]>(500, 86400000); // 24 hours
export const memoryCache = new LRUCache<string, any>(1000, 3600000); // 1 hour
export const queryCache = new LRUCache<string, any>(200, 1800000); // 30 minutes

