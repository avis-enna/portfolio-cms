/**
 * Caching utilities for improved performance
 */

import React from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttlMs = 300000): void { // 5 minutes default
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton cache instance
export const memoryCache = new MemoryCache();

// Cleanup expired items every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 300000);
}

// Cache decorator for functions
export function cached<T extends (...args: any[]) => any>(
  ttlMs = 300000,
  keyGenerator?: (...args: Parameters<T>) => string
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const cacheKey = keyGenerator 
        ? keyGenerator(...args)
        : `${propertyName}_${JSON.stringify(args)}`;

      // Try to get from cache first
      const cachedResult = memoryCache.get<ReturnType<T>>(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Execute the original method
      const result = await method.apply(this, args);
      
      // Cache the result
      memoryCache.set(cacheKey, result, ttlMs);
      
      return result;
    };

    return descriptor;
  };
}

// React hook for cached API calls
export function useCachedApi<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 300000,
  dependencies: any[] = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      // Check cache first
      const cachedData = memoryCache.get<T>(key);
      if (cachedData !== null) {
        setData(cachedData);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetcher();
        memoryCache.set(key, result, ttlMs);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [key, ttlMs, ...dependencies]);

  const invalidate = () => {
    memoryCache.delete(key);
  };

  const refresh = async () => {
    memoryCache.delete(key);
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      memoryCache.set(key, result, ttlMs);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, invalidate, refresh };
}

// Browser storage cache for persistence
export class PersistentCache {
  private prefix: string;

  constructor(prefix = 'portfolio_cache_') {
    this.prefix = prefix;
  }

  set<T>(key: string, data: T, ttlMs = 3600000): void { // 1 hour default
    if (typeof window === 'undefined') return;

    const item = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };

    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const itemStr = localStorage.getItem(this.prefix + key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      
      // Check if item has expired
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  cleanup(): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const item = JSON.parse(itemStr);
            if (now - item.timestamp > item.ttl) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted items
          localStorage.removeItem(key);
        }
      }
    });
  }
}

export const persistentCache = new PersistentCache();

// Cleanup persistent cache on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    persistentCache.cleanup();
  });
}

// Cache invalidation utilities
export const cacheInvalidation = {
  invalidatePattern: (pattern: string) => {
    // Invalidate memory cache
    for (const key of memoryCache['cache'].keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }

    // Invalidate persistent cache
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    }
  },

  invalidateAll: () => {
    memoryCache.clear();
    persistentCache.clear();
  },
};

export default memoryCache;
