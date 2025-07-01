/**
 * Performance Optimization Module
 * 
 * Implements caching, lazy loading, and performance monitoring
 * for the ChatGPT-buddy extension system.
 */

import { MessageState, MessageStoreState } from './message-store.js';

interface PerformanceMetrics {
  messageProcessingTime: number[];
  memoryUsage: number[];
  storageOperationTime: number[];
  uiRenderTime: number[];
  lastCleanup: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export class PerformanceOptimizer {
  private messageCache = new Map<string, CacheEntry<MessageState>>();
  private queryCache = new Map<string, CacheEntry<MessageState[]>>();
  private metrics: PerformanceMetrics;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute
  private cleanupTimer: any = null;

  constructor() {
    this.metrics = {
      messageProcessingTime: [],
      memoryUsage: [],
      storageOperationTime: [],
      uiRenderTime: [],
      lastCleanup: Date.now()
    };
    
    this.startPerformanceMonitoring();
    this.startCacheCleanup();
  }

  /**
   * Cache a message by correlation ID for fast lookup
   */
  cacheMessage(message: MessageState): void {
    const cacheKey = message.correlationId;
    
    // Implement LRU eviction if cache is full
    if (this.messageCache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastRecentlyUsed();
    }
    
    this.messageCache.set(cacheKey, {
      data: message,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    });
  }

  /**
   * Retrieve a cached message by correlation ID
   */
  getCachedMessage(correlationId: string): MessageState | null {
    const entry = this.messageCache.get(correlationId);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.messageCache.delete(correlationId);
      return null;
    }
    
    // Update access metrics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.data;
  }

  /**
   * Cache query results for filtered message lists
   */
  cacheQuery(queryKey: string, messages: MessageState[]): void {
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastRecentlyUsedQuery();
    }
    
    this.queryCache.set(queryKey, {
      data: [...messages], // Create shallow copy
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    });
  }

  /**
   * Retrieve cached query results
   */
  getCachedQuery(queryKey: string): MessageState[] | null {
    const entry = this.queryCache.get(queryKey);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.queryCache.delete(queryKey);
      return null;
    }
    
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.data;
  }

  /**
   * Generate cache key for message queries
   */
  generateQueryKey(filters: MessageStoreState['filters'], sortBy?: string): string {
    const filterString = JSON.stringify({
      types: filters.types.slice().sort(),
      statuses: filters.statuses.slice().sort(),
      directions: filters.directions.slice().sort(),
      dateRange: filters.dateRange,
      sortBy: sortBy || 'timestamp'
    });
    
    return `query:${btoa(filterString)}`;
  }

  /**
   * Implement lazy loading for large message sets
   */
  createLazyMessageLoader(messages: MessageState[], pageSize: number = 50) {
    return {
      totalCount: messages.length,
      pageSize,
      currentPage: 0,
      
      loadPage: (page: number): MessageState[] => {
        const start = page * pageSize;
        const end = Math.min(start + pageSize, messages.length);
        
        if (start >= messages.length) {
          return [];
        }
        
        return messages.slice(start, end);
      },
      
      hasNextPage: (page: number): boolean => {
        return (page + 1) * pageSize < messages.length;
      },
      
      hasPreviousPage: (page: number): boolean => {
        return page > 0;
      }
    };
  }

  /**
   * Optimize message filtering with indexing
   */
  createOptimizedFilter(messages: MessageState[]) {
    // Create indexes for common filter operations
    const typeIndex = new Map<string, MessageState[]>();
    const statusIndex = new Map<string, MessageState[]>();
    const directionIndex = new Map<string, MessageState[]>();
    
    // Build indexes
    for (const message of messages) {
      // Type index
      if (!typeIndex.has(message.type)) {
        typeIndex.set(message.type, []);
      }
      typeIndex.get(message.type)!.push(message);
      
      // Status index
      if (!statusIndex.has(message.status)) {
        statusIndex.set(message.status, []);
      }
      statusIndex.get(message.status)!.push(message);
      
      // Direction index
      if (!directionIndex.has(message.direction)) {
        directionIndex.set(message.direction, []);
      }
      directionIndex.get(message.direction)!.push(message);
    }
    
    return {
      filterByType: (types: string[]): MessageState[] => {
        if (types.length === 0) return messages;
        
        const results = new Set<MessageState>();
        for (const type of types) {
          const typeMessages = typeIndex.get(type) || [];
          typeMessages.forEach(msg => results.add(msg));
        }
        return Array.from(results);
      },
      
      filterByStatus: (statuses: string[]): MessageState[] => {
        if (statuses.length === 0) return messages;
        
        const results = new Set<MessageState>();
        for (const status of statuses) {
          const statusMessages = statusIndex.get(status) || [];
          statusMessages.forEach(msg => results.add(msg));
        }
        return Array.from(results);
      },
      
      filterByDirection: (directions: string[]): MessageState[] => {
        if (directions.length === 0) return messages;
        
        const results = new Set<MessageState>();
        for (const direction of directions) {
          const directionMessages = directionIndex.get(direction) || [];
          directionMessages.forEach(msg => results.add(msg));
        }
        return Array.from(results);
      }
    };
  }

  /**
   * Monitor and record performance metrics
   */
  recordMetric(type: keyof PerformanceMetrics, value: number): void {
    if (type === 'lastCleanup') {
      this.metrics[type] = value;
      return;
    }
    
    const metricArray = this.metrics[type] as number[];
    metricArray.push(value);
    
    // Keep only last 100 measurements to prevent memory bloat
    if (metricArray.length > 100) {
      metricArray.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const calculateStats = (values: number[]) => {
      if (values.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };
      
      const sum = values.reduce((a, b) => a + b, 0);
      return {
        avg: sum / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    };
    
    return {
      messageProcessing: calculateStats(this.metrics.messageProcessingTime),
      memoryUsage: calculateStats(this.metrics.memoryUsage),
      storageOperations: calculateStats(this.metrics.storageOperationTime),
      uiRendering: calculateStats(this.metrics.uiRenderTime),
      cacheStats: {
        messageCache: {
          size: this.messageCache.size,
          hitRate: this.calculateCacheHitRate(this.messageCache),
          maxSize: this.MAX_CACHE_SIZE
        },
        queryCache: {
          size: this.queryCache.size,
          hitRate: this.calculateCacheHitRate(this.queryCache),
          maxSize: this.MAX_CACHE_SIZE
        }
      },
      lastCleanup: new Date(this.metrics.lastCleanup).toISOString()
    };
  }

  /**
   * Time a function execution and record the metric
   */
  timeExecution<T>(
    fn: () => T | Promise<T>, 
    metricType: 'messageProcessingTime' | 'storageOperationTime' | 'uiRenderTime'
  ): T | Promise<T> {
    const startTime = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        this.recordMetric(metricType, duration);
      });
    } else {
      const duration = performance.now() - startTime;
      this.recordMetric(metricType, duration);
      return result;
    }
  }

  /**
   * Debounce frequent operations
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: any = null;
    
    return (...args: Parameters<T>) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        timeoutId = null;
      }, delay);
    };
  }

  /**
   * Throttle high-frequency operations
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastExecution = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastExecution >= delay) {
        func.apply(this, args);
        lastExecution = now;
      }
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.messageCache.clear();
    this.queryCache.clear();
    console.log('🧹 Performance caches cleared');
  }

  /**
   * Optimize memory usage by cleaning up old data
   */
  optimizeMemory(): void {
    const now = Date.now();
    
    // Clear expired cache entries
    this.cleanupExpiredCacheEntries();
    
    // Record cleanup time
    this.recordMetric('lastCleanup', now);
    
    // Trigger garbage collection hint (if available)
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
    
    console.log('🚀 Memory optimization completed');
  }

  /**
   * Get memory usage estimates
   */
  getMemoryUsage(): { estimated: number; cacheSize: number } {
    const estimateObjectSize = (obj: any): number => {
      return JSON.stringify(obj).length * 2; // Rough estimate
    };
    
    let cacheSize = 0;
    
    this.messageCache.forEach(entry => {
      cacheSize += estimateObjectSize(entry);
    });
    
    this.queryCache.forEach(entry => {
      cacheSize += estimateObjectSize(entry);
    });
    
    return {
      estimated: cacheSize,
      cacheSize: this.messageCache.size + this.queryCache.size
    };
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      if ('memory' in performance && (performance as any).memory) {
        const memInfo = (performance as any).memory;
        this.recordMetric('memoryUsage', memInfo.usedJSHeapSize);
      }
    }, 30000);
  }

  /**
   * Start cache cleanup timer
   */
  private startCacheCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredCacheEntries();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop all monitoring and cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.clearCaches();
  }

  /**
   * Evict least recently used messages from cache
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    this.messageCache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.messageCache.delete(oldestKey);
    }
  }

  /**
   * Evict least recently used queries from cache
   */
  private evictLeastRecentlyUsedQuery(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    this.queryCache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.queryCache.delete(oldestKey);
    }
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate<T>(cache: Map<string, CacheEntry<T>>): number {
    let totalAccesses = 0;
    let totalHits = 0;
    
    cache.forEach(entry => {
      totalAccesses += entry.accessCount;
      if (entry.accessCount > 1) {
        totalHits += entry.accessCount - 1; // First access is not a hit
      }
    });
    
    return totalAccesses > 0 ? totalHits / totalAccesses : 0;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCacheEntries(): void {
    const now = Date.now();
    
    // Clean message cache
    this.messageCache.forEach((entry, key) => {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.messageCache.delete(key);
      }
    });
    
    // Clean query cache
    this.queryCache.forEach((entry, key) => {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.queryCache.delete(key);
      }
    });
  }
}

// Global performance optimizer instance
export const globalPerformanceOptimizer = new PerformanceOptimizer();