/**
 * Performance Optimizer Unit Tests
 * 
 * Tests caching, lazy loading, and performance monitoring functionality.
 */

import { jest } from '@jest/globals';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
};

(global as any).performance = mockPerformance;

// Import after mocking
import { PerformanceOptimizer } from '../../extension/src/performance-optimizer';
import { MessageState } from '../../extension/src/message-store';

describe('🚀 Performance Optimizer', () => {
  let optimizer: PerformanceOptimizer;
  let mockMessages: MessageState[];

  beforeEach(() => {
    jest.clearAllMocks();
    optimizer = new PerformanceOptimizer();
    
    // Create mock messages
    mockMessages = Array.from({ length: 10 }, (_, i) => ({
      timestamp: Date.now() - (10 - i) * 1000,
      type: `TestMessage${i % 3}`,
      payload: { data: `test-${i}` },
      correlationId: `test-${i}`,
      direction: i % 2 === 0 ? 'inbound' : 'outbound',
      status: ['pending', 'success', 'error'][i % 3] as 'pending' | 'success' | 'error',
      metadata: {
        extensionId: 'test-ext',
        tabId: 123,
        userAgent: 'test-agent'
      }
    }));
  });

  afterEach(() => {
    optimizer.destroy();
  });

  describe('💾 Message Caching', () => {
    test('should cache and retrieve messages by correlation ID', () => {
      const message = mockMessages[0];
      
      // Cache the message
      optimizer.cacheMessage(message);
      
      // Retrieve from cache
      const cached = optimizer.getCachedMessage(message.correlationId);
      
      expect(cached).toEqual(message);
    });

    test('should return null for non-existent cache entries', () => {
      const result = optimizer.getCachedMessage('non-existent');
      expect(result).toBeNull();
    });

    test('should handle cache TTL expiration', async () => {
      const message = mockMessages[0];
      optimizer.cacheMessage(message);
      
      // Mock time advancement beyond TTL (5 minutes)
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 6 * 60 * 1000);
      
      const cached = optimizer.getCachedMessage(message.correlationId);
      expect(cached).toBeNull();
      
      // Restore Date.now
      Date.now = originalDateNow;
    });

    test('should implement LRU eviction when cache is full', () => {
      // Fill cache to maximum
      const maxSize = 1000;
      for (let i = 0; i < maxSize + 5; i++) {
        const message = {
          ...mockMessages[0],
          correlationId: `test-${i}`,
          payload: { data: `test-${i}` }
        };
        optimizer.cacheMessage(message);
      }
      
      // First messages should be evicted
      const firstMessage = optimizer.getCachedMessage('test-0');
      expect(firstMessage).toBeNull();
      
      // Recent messages should still be cached
      const recentMessage = optimizer.getCachedMessage('test-1004');
      expect(recentMessage).not.toBeNull();
    });
  });

  describe('🔍 Query Caching', () => {
    test('should cache and retrieve query results', () => {
      const queryKey = 'test-query';
      const results = mockMessages.slice(0, 5);
      
      optimizer.cacheQuery(queryKey, results);
      const cached = optimizer.getCachedQuery(queryKey);
      
      expect(cached).toEqual(results);
    });

    test('should generate consistent query keys', () => {
      const filters = {
        types: ['TestMessage0', 'TestMessage1'],
        statuses: ['success', 'pending'] as ('success' | 'pending')[],
        directions: ['inbound'] as ('inbound' | 'outbound')[],
        dateRange: { from: 1000, to: 2000 }
      };
      
      const key1 = optimizer.generateQueryKey(filters);
      const key2 = optimizer.generateQueryKey(filters);
      
      expect(key1).toBe(key2);
    });

    test('should generate different keys for different filters', () => {
      const filters1 = {
        types: ['TestMessage0'],
        statuses: [] as ('success' | 'pending' | 'error')[],
        directions: [] as ('inbound' | 'outbound')[],
        dateRange: null
      };
      
      const filters2 = {
        types: ['TestMessage1'],
        statuses: [] as ('success' | 'pending' | 'error')[],
        directions: [] as ('inbound' | 'outbound')[],
        dateRange: null
      };
      
      const key1 = optimizer.generateQueryKey(filters1);
      const key2 = optimizer.generateQueryKey(filters2);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('📄 Lazy Loading', () => {
    test('should create lazy loader with correct pagination', () => {
      const pageSize = 3;
      const loader = optimizer.createLazyMessageLoader(mockMessages, pageSize);
      
      expect(loader.totalCount).toBe(mockMessages.length);
      expect(loader.pageSize).toBe(pageSize);
      
      // Load first page
      const page1 = loader.loadPage(0);
      expect(page1).toHaveLength(pageSize);
      expect(page1).toEqual(mockMessages.slice(0, pageSize));
      
      // Load second page
      const page2 = loader.loadPage(1);
      expect(page2).toHaveLength(pageSize);
      expect(page2).toEqual(mockMessages.slice(pageSize, pageSize * 2));
    });

    test('should handle pagination boundaries correctly', () => {
      const pageSize = 3;
      const loader = optimizer.createLazyMessageLoader(mockMessages, pageSize);
      
      // Test hasNextPage
      expect(loader.hasNextPage(0)).toBe(true);
      expect(loader.hasNextPage(3)).toBe(false); // Last page for 10 items
      
      // Test hasPreviousPage
      expect(loader.hasPreviousPage(0)).toBe(false);
      expect(loader.hasPreviousPage(1)).toBe(true);
      
      // Test loading beyond bounds
      const emptyPage = loader.loadPage(10);
      expect(emptyPage).toEqual([]);
    });
  });

  describe('🔍 Optimized Filtering', () => {
    test('should create optimized filter with indexes', () => {
      const filter = optimizer.createOptimizedFilter(mockMessages);
      
      // Filter by type
      const typeResults = filter.filterByType(['TestMessage0']);
      expect(typeResults.every(msg => msg.type === 'TestMessage0')).toBe(true);
      
      // Filter by status
      const statusResults = filter.filterByStatus(['success']);
      expect(statusResults.every(msg => msg.status === 'success')).toBe(true);
      
      // Filter by direction
      const directionResults = filter.filterByDirection(['inbound']);
      expect(directionResults.every(msg => msg.direction === 'inbound')).toBe(true);
    });

    test('should handle empty filter arrays', () => {
      const filter = optimizer.createOptimizedFilter(mockMessages);
      
      const allMessages = filter.filterByType([]);
      expect(allMessages).toEqual(mockMessages);
    });

    test('should handle multiple filter values', () => {
      const filter = optimizer.createOptimizedFilter(mockMessages);
      
      const multiTypeResults = filter.filterByType(['TestMessage0', 'TestMessage1']);
      expect(multiTypeResults.length).toBeGreaterThan(0);
      expect(multiTypeResults.every(msg => 
        msg.type === 'TestMessage0' || msg.type === 'TestMessage1'
      )).toBe(true);
    });
  });

  describe('📊 Performance Metrics', () => {
    test('should record and retrieve performance metrics', () => {
      // Record some metrics
      optimizer.recordMetric('messageProcessingTime', 10);
      optimizer.recordMetric('messageProcessingTime', 20);
      optimizer.recordMetric('storageOperationTime', 5);
      
      const stats = optimizer.getPerformanceStats();
      
      expect(stats.messageProcessing.count).toBe(2);
      expect(stats.messageProcessing.avg).toBe(15);
      expect(stats.messageProcessing.min).toBe(10);
      expect(stats.messageProcessing.max).toBe(20);
      
      expect(stats.storageOperations.count).toBe(1);
      expect(stats.storageOperations.avg).toBe(5);
    });

    test('should limit metric array size to prevent memory bloat', () => {
      // Record more than 100 metrics
      for (let i = 0; i < 150; i++) {
        optimizer.recordMetric('messageProcessingTime', i);
      }
      
      const stats = optimizer.getPerformanceStats();
      expect(stats.messageProcessing.count).toBe(100); // Should be capped at 100
    });

    test('should time function execution', () => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
        return 'result';
      };
      
      const result = optimizer.timeExecution(testFunction, 'messageProcessingTime');
      
      expect(result).toBe('result');
      expect(callCount).toBe(1);
      
      // Check that metric was recorded
      const stats = optimizer.getPerformanceStats();
      expect(stats.messageProcessing.count).toBeGreaterThan(0);
    });

    test('should time async function execution', async () => {
      let callCount = 0;
      const asyncFunction = async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async-result';
      };
      
      const result = await optimizer.timeExecution(asyncFunction, 'storageOperationTime');
      
      expect(result).toBe('async-result');
      expect(callCount).toBe(1);
      
      // Check that metric was recorded
      const stats = optimizer.getPerformanceStats();
      expect(stats.storageOperations.count).toBeGreaterThan(0);
    });
  });

  describe('🚫 Debounce and Throttle', () => {
    test('should debounce function calls', async () => {
      let callCount = 0;
      const testFunction = () => { callCount++; };
      
      const debouncedFunction = optimizer.debounce(testFunction, 100);
      
      // Call multiple times rapidly
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();
      
      expect(callCount).toBe(0); // Should not be called yet
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(callCount).toBe(1); // Should be called once
    });

    test('should throttle function calls', () => {
      let callCount = 0;
      const testFunction = () => { callCount++; };
      
      const throttledFunction = optimizer.throttle(testFunction, 100);
      
      // Call multiple times rapidly
      throttledFunction(); // Should execute immediately
      throttledFunction(); // Should be throttled
      throttledFunction(); // Should be throttled
      
      expect(callCount).toBe(1); // Only first call should execute
    });
  });

  describe('🧹 Memory Management', () => {
    test('should clear all caches', () => {
      // Add some data to caches
      optimizer.cacheMessage(mockMessages[0]);
      optimizer.cacheQuery('test-query', mockMessages);
      
      // Clear caches
      optimizer.clearCaches();
      
      // Verify caches are empty
      expect(optimizer.getCachedMessage(mockMessages[0].correlationId)).toBeNull();
      expect(optimizer.getCachedQuery('test-query')).toBeNull();
    });

    test('should estimate memory usage', () => {
      // Add some data to caches
      optimizer.cacheMessage(mockMessages[0]);
      optimizer.cacheQuery('test-query', mockMessages);
      
      const usage = optimizer.getMemoryUsage();
      
      expect(usage.estimated).toBeGreaterThan(0);
      expect(usage.cacheSize).toBeGreaterThan(0);
    });

    test('should optimize memory usage', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      optimizer.optimizeMemory();
      
      expect(consoleSpy).toHaveBeenCalledWith('🚀 Memory optimization completed');
      
      consoleSpy.mockRestore();
    });
  });

  describe('📈 Cache Statistics', () => {
    test('should calculate cache hit rates', () => {
      const message = mockMessages[0];
      
      // Cache message
      optimizer.cacheMessage(message);
      
      // Access multiple times
      optimizer.getCachedMessage(message.correlationId);
      optimizer.getCachedMessage(message.correlationId);
      optimizer.getCachedMessage(message.correlationId);
      
      const stats = optimizer.getPerformanceStats();
      
      expect(stats.cacheStats.messageCache.size).toBeGreaterThan(0);
      expect(stats.cacheStats.messageCache.hitRate).toBeGreaterThan(0);
    });

    test('should provide comprehensive cache statistics', () => {
      const stats = optimizer.getPerformanceStats();
      
      expect(stats.cacheStats.messageCache).toHaveProperty('size');
      expect(stats.cacheStats.messageCache).toHaveProperty('hitRate');
      expect(stats.cacheStats.messageCache).toHaveProperty('maxSize');
      
      expect(stats.cacheStats.queryCache).toHaveProperty('size');
      expect(stats.cacheStats.queryCache).toHaveProperty('hitRate');
      expect(stats.cacheStats.queryCache).toHaveProperty('maxSize');
      
      expect(stats.lastCleanup).toBeDefined();
    });
  });

  describe('🔄 Lifecycle Management', () => {
    test('should properly destroy optimizer and clean up resources', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      optimizer.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      // Verify caches are cleared
      const usage = optimizer.getMemoryUsage();
      expect(usage.cacheSize).toBe(0);
      
      clearIntervalSpy.mockRestore();
    });
  });
});