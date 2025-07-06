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
export declare class PerformanceOptimizer {
    private messageCache;
    private queryCache;
    private metrics;
    private readonly CACHE_TTL;
    private readonly MAX_CACHE_SIZE;
    private readonly CLEANUP_INTERVAL;
    private cleanupTimer;
    constructor();
    /**
     * Cache a message by correlation ID for fast lookup
     */
    cacheMessage(message: MessageState): void;
    /**
     * Retrieve a cached message by correlation ID
     */
    getCachedMessage(correlationId: string): MessageState | null;
    /**
     * Cache query results for filtered message lists
     */
    cacheQuery(queryKey: string, messages: MessageState[]): void;
    /**
     * Retrieve cached query results
     */
    getCachedQuery(queryKey: string): MessageState[] | null;
    /**
     * Generate cache key for message queries
     */
    generateQueryKey(filters: MessageStoreState['filters'], sortBy?: string): string;
    /**
     * Implement lazy loading for large message sets
     */
    createLazyMessageLoader(messages: MessageState[], pageSize?: number): {
        totalCount: number;
        pageSize: number;
        currentPage: number;
        loadPage: (page: number) => MessageState[];
        hasNextPage: (page: number) => boolean;
        hasPreviousPage: (page: number) => boolean;
    };
    /**
     * Optimize message filtering with indexing
     */
    createOptimizedFilter(messages: MessageState[]): {
        filterByType: (types: string[]) => MessageState[];
        filterByStatus: (statuses: string[]) => MessageState[];
        filterByDirection: (directions: string[]) => MessageState[];
    };
    /**
     * Monitor and record performance metrics
     */
    recordMetric(type: keyof PerformanceMetrics, value: number): void;
    /**
     * Get performance statistics
     */
    getPerformanceStats(): {
        messageProcessing: {
            avg: number;
            min: number;
            max: number;
            count: number;
        };
        memoryUsage: {
            avg: number;
            min: number;
            max: number;
            count: number;
        };
        storageOperations: {
            avg: number;
            min: number;
            max: number;
            count: number;
        };
        uiRendering: {
            avg: number;
            min: number;
            max: number;
            count: number;
        };
        cacheStats: {
            messageCache: {
                size: number;
                hitRate: number;
                maxSize: number;
            };
            queryCache: {
                size: number;
                hitRate: number;
                maxSize: number;
            };
        };
        lastCleanup: string;
    };
    /**
     * Time a function execution and record the metric
     */
    timeExecution<T>(fn: () => T | Promise<T>, metricType: 'messageProcessingTime' | 'storageOperationTime' | 'uiRenderTime'): T | Promise<T>;
    /**
     * Debounce frequent operations
     */
    debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
    /**
     * Throttle high-frequency operations
     */
    throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
    /**
     * Clear all caches
     */
    clearCaches(): void;
    /**
     * Optimize memory usage by cleaning up old data
     */
    optimizeMemory(): void;
    /**
     * Get memory usage estimates
     */
    getMemoryUsage(): {
        estimated: number;
        cacheSize: number;
    };
    /**
     * Start performance monitoring
     */
    private startPerformanceMonitoring;
    /**
     * Start cache cleanup timer
     */
    private startCacheCleanup;
    /**
     * Stop all monitoring and cleanup
     */
    destroy(): void;
    /**
     * Evict least recently used messages from cache
     */
    private evictLeastRecentlyUsed;
    /**
     * Evict least recently used queries from cache
     */
    private evictLeastRecentlyUsedQuery;
    /**
     * Calculate cache hit rate
     */
    private calculateCacheHitRate;
    /**
     * Clean up expired cache entries
     */
    private cleanupExpiredCacheEntries;
}
export declare const globalPerformanceOptimizer: PerformanceOptimizer;
export {};
//# sourceMappingURL=performance-optimizer.d.ts.map