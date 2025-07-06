/**
 * @fileoverview Plugin Storage System for Web-Buddy plugin architecture
 * @description Implements plugin-scoped storage with isolation and shared storage capabilities
 */
import { PluginStorageService, PluginConfiguration } from './plugin-interface';
/**
 * Storage namespace types
 */
export type StorageNamespace = 'plugin' | 'shared' | 'config' | 'cache' | 'temp';
/**
 * Storage statistics
 */
interface StorageStats {
    totalEntries: number;
    totalSize: number;
    namespaces: Record<string, number>;
    oldestEntry?: Date;
    newestEntry?: Date;
}
/**
 * Migration function type
 */
export type MigrationFunction = (oldData: any) => any;
/**
 * Storage event types
 */
export declare enum StorageEventType {
    SET = "storage:set",
    GET = "storage:get",
    REMOVE = "storage:remove",
    CLEAR = "storage:clear",
    MIGRATE = "storage:migrate",
    CLEANUP = "storage:cleanup"
}
/**
 * Storage event
 */
interface StorageEvent {
    type: StorageEventType;
    pluginId: string;
    namespace: string;
    key?: string;
    timestamp: Date;
    success: boolean;
    error?: string;
}
/**
 * Default plugin storage implementation using Chrome storage API
 */
export declare class DefaultPluginStorageService implements PluginStorageService {
    private pluginId;
    private storagePrefix;
    private eventListeners;
    private cache;
    private cacheEnabled;
    private cacheTtl;
    constructor(pluginId: string, options?: {
        cacheEnabled?: boolean;
        cacheTtl?: number;
    });
    /**
     * Set a value in plugin-scoped storage
     */
    set(key: string, value: any): Promise<void>;
    /**
     * Get a value from plugin-scoped storage
     */
    get(key: string): Promise<any>;
    /**
     * Remove a value from plugin-scoped storage
     */
    remove(key: string): Promise<void>;
    /**
     * Clear all plugin-scoped storage
     */
    clear(): Promise<void>;
    /**
     * Get all keys in plugin-scoped storage
     */
    keys(): Promise<string[]>;
    /**
     * Set a value in shared storage
     */
    setShared(namespace: string, key: string, value: any): Promise<void>;
    /**
     * Get a value from shared storage
     */
    getShared(namespace: string, key: string): Promise<any>;
    /**
     * Remove a value from shared storage
     */
    removeShared(namespace: string, key: string): Promise<void>;
    /**
     * Get plugin configuration
     */
    getConfig(): Promise<PluginConfiguration>;
    /**
     * Set plugin configuration
     */
    setConfig(config: Partial<PluginConfiguration>): Promise<void>;
    /**
     * Migrate storage data
     */
    migrate(version: string, migrationFn: MigrationFunction): Promise<void>;
    /**
     * Get storage statistics
     */
    getStatistics(): Promise<StorageStats>;
    /**
     * Clean up expired entries
     */
    cleanup(): Promise<number>;
    /**
     * Add storage event listener
     */
    addEventListener(listener: (event: StorageEvent) => void): void;
    /**
     * Remove storage event listener
     */
    removeEventListener(listener: (event: StorageEvent) => void): void;
    private getStorageKey;
    private getSharedStorageKey;
    private setStorageEntry;
    private getStorageEntry;
    private removeStorageEntry;
    private getAllStorageKeys;
    private isEntryExpired;
    private calculateEntrySize;
    private emitStorageEvent;
}
/**
 * Plugin storage factory
 */
export declare class PluginStorageFactory {
    private storageInstances;
    /**
     * Create or get storage instance for a plugin
     */
    createStorage(pluginId: string, options?: {
        cacheEnabled?: boolean;
        cacheTtl?: number;
    }): PluginStorageService;
    /**
     * Remove storage instance for a plugin
     */
    removeStorage(pluginId: string): void;
    /**
     * Get all storage instances
     */
    getAllStorageInstances(): Map<string, DefaultPluginStorageService>;
    /**
     * Clean up all storage instances
     */
    cleanupAll(): Promise<void>;
    /**
     * Get aggregate statistics for all plugins
     */
    getAggregateStatistics(): Promise<{
        totalPlugins: number;
        totalEntries: number;
        totalSize: number;
        pluginStats: Record<string, any>;
    }>;
}
export {};
//# sourceMappingURL=plugin-storage.d.ts.map