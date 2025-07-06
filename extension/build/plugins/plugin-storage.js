/**
 * @fileoverview Plugin Storage System for Web-Buddy plugin architecture
 * @description Implements plugin-scoped storage with isolation and shared storage capabilities
 */
import { PluginError } from './plugin-interface';
/**
 * Storage event types
 */
export var StorageEventType;
(function (StorageEventType) {
    StorageEventType["SET"] = "storage:set";
    StorageEventType["GET"] = "storage:get";
    StorageEventType["REMOVE"] = "storage:remove";
    StorageEventType["CLEAR"] = "storage:clear";
    StorageEventType["MIGRATE"] = "storage:migrate";
    StorageEventType["CLEANUP"] = "storage:cleanup";
})(StorageEventType || (StorageEventType = {}));
/**
 * Default plugin storage implementation using Chrome storage API
 */
export class DefaultPluginStorageService {
    constructor(pluginId, options = {}) {
        this.eventListeners = new Set();
        this.cache = new Map();
        this.cacheEnabled = true;
        this.cacheTtl = 5 * 60 * 1000; // 5 minutes
        this.pluginId = pluginId;
        this.storagePrefix = `plugin:${pluginId}:`;
        this.cacheEnabled = options.cacheEnabled ?? true;
        this.cacheTtl = options.cacheTtl ?? this.cacheTtl;
    }
    /**
     * Set a value in plugin-scoped storage
     */
    async set(key, value) {
        const storageKey = this.getStorageKey('plugin', key);
        const entry = {
            value,
            timestamp: new Date(),
            version: '1.0.0'
        };
        try {
            await this.setStorageEntry(storageKey, entry);
            if (this.cacheEnabled) {
                this.cache.set(storageKey, entry);
            }
            this.emitStorageEvent({
                type: StorageEventType.SET,
                pluginId: this.pluginId,
                namespace: 'plugin',
                key,
                timestamp: new Date(),
                success: true
            });
        }
        catch (error) {
            this.emitStorageEvent({
                type: StorageEventType.SET,
                pluginId: this.pluginId,
                namespace: 'plugin',
                key,
                timestamp: new Date(),
                success: false,
                error: error.message
            });
            throw new PluginError(`Failed to set storage value for key ${key}: ${error.message}`, this.pluginId, 'STORAGE_SET_ERROR', error);
        }
    }
    /**
     * Get a value from plugin-scoped storage
     */
    async get(key) {
        const storageKey = this.getStorageKey('plugin', key);
        try {
            // Check cache first
            if (this.cacheEnabled) {
                const cachedEntry = this.cache.get(storageKey);
                if (cachedEntry && !this.isEntryExpired(cachedEntry)) {
                    this.emitStorageEvent({
                        type: StorageEventType.GET,
                        pluginId: this.pluginId,
                        namespace: 'plugin',
                        key,
                        timestamp: new Date(),
                        success: true
                    });
                    return cachedEntry.value;
                }
            }
            const entry = await this.getStorageEntry(storageKey);
            if (entry) {
                if (this.cacheEnabled) {
                    this.cache.set(storageKey, entry);
                }
                this.emitStorageEvent({
                    type: StorageEventType.GET,
                    pluginId: this.pluginId,
                    namespace: 'plugin',
                    key,
                    timestamp: new Date(),
                    success: true
                });
                return entry.value;
            }
            return null;
        }
        catch (error) {
            this.emitStorageEvent({
                type: StorageEventType.GET,
                pluginId: this.pluginId,
                namespace: 'plugin',
                key,
                timestamp: new Date(),
                success: false,
                error: error.message
            });
            throw new PluginError(`Failed to get storage value for key ${key}: ${error.message}`, this.pluginId, 'STORAGE_GET_ERROR', error);
        }
    }
    /**
     * Remove a value from plugin-scoped storage
     */
    async remove(key) {
        const storageKey = this.getStorageKey('plugin', key);
        try {
            await this.removeStorageEntry(storageKey);
            if (this.cacheEnabled) {
                this.cache.delete(storageKey);
            }
            this.emitStorageEvent({
                type: StorageEventType.REMOVE,
                pluginId: this.pluginId,
                namespace: 'plugin',
                key,
                timestamp: new Date(),
                success: true
            });
        }
        catch (error) {
            this.emitStorageEvent({
                type: StorageEventType.REMOVE,
                pluginId: this.pluginId,
                namespace: 'plugin',
                key,
                timestamp: new Date(),
                success: false,
                error: error.message
            });
            throw new PluginError(`Failed to remove storage value for key ${key}: ${error.message}`, this.pluginId, 'STORAGE_REMOVE_ERROR', error);
        }
    }
    /**
     * Clear all plugin-scoped storage
     */
    async clear() {
        try {
            const keys = await this.keys();
            const promises = keys.map(key => this.remove(key));
            await Promise.all(promises);
            this.emitStorageEvent({
                type: StorageEventType.CLEAR,
                pluginId: this.pluginId,
                namespace: 'plugin',
                timestamp: new Date(),
                success: true
            });
        }
        catch (error) {
            this.emitStorageEvent({
                type: StorageEventType.CLEAR,
                pluginId: this.pluginId,
                namespace: 'plugin',
                timestamp: new Date(),
                success: false,
                error: error.message
            });
            throw new PluginError(`Failed to clear plugin storage: ${error.message}`, this.pluginId, 'STORAGE_CLEAR_ERROR', error);
        }
    }
    /**
     * Get all keys in plugin-scoped storage
     */
    async keys() {
        try {
            const allKeys = await this.getAllStorageKeys();
            const pluginPrefix = this.getStorageKey('plugin', '');
            return allKeys
                .filter(key => key.startsWith(pluginPrefix))
                .map(key => key.substring(pluginPrefix.length));
        }
        catch (error) {
            throw new PluginError(`Failed to get storage keys: ${error.message}`, this.pluginId, 'STORAGE_KEYS_ERROR', error);
        }
    }
    /**
     * Set a value in shared storage
     */
    async setShared(namespace, key, value) {
        const storageKey = this.getSharedStorageKey(namespace, key);
        const entry = {
            value,
            timestamp: new Date(),
            version: '1.0.0'
        };
        try {
            await this.setStorageEntry(storageKey, entry);
            this.emitStorageEvent({
                type: StorageEventType.SET,
                pluginId: this.pluginId,
                namespace: `shared:${namespace}`,
                key,
                timestamp: new Date(),
                success: true
            });
        }
        catch (error) {
            this.emitStorageEvent({
                type: StorageEventType.SET,
                pluginId: this.pluginId,
                namespace: `shared:${namespace}`,
                key,
                timestamp: new Date(),
                success: false,
                error: error.message
            });
            throw new PluginError(`Failed to set shared storage value: ${error.message}`, this.pluginId, 'SHARED_STORAGE_SET_ERROR', error);
        }
    }
    /**
     * Get a value from shared storage
     */
    async getShared(namespace, key) {
        const storageKey = this.getSharedStorageKey(namespace, key);
        try {
            const entry = await this.getStorageEntry(storageKey);
            this.emitStorageEvent({
                type: StorageEventType.GET,
                pluginId: this.pluginId,
                namespace: `shared:${namespace}`,
                key,
                timestamp: new Date(),
                success: true
            });
            return entry ? entry.value : null;
        }
        catch (error) {
            this.emitStorageEvent({
                type: StorageEventType.GET,
                pluginId: this.pluginId,
                namespace: `shared:${namespace}`,
                key,
                timestamp: new Date(),
                success: false,
                error: error.message
            });
            throw new PluginError(`Failed to get shared storage value: ${error.message}`, this.pluginId, 'SHARED_STORAGE_GET_ERROR', error);
        }
    }
    /**
     * Remove a value from shared storage
     */
    async removeShared(namespace, key) {
        const storageKey = this.getSharedStorageKey(namespace, key);
        try {
            await this.removeStorageEntry(storageKey);
            this.emitStorageEvent({
                type: StorageEventType.REMOVE,
                pluginId: this.pluginId,
                namespace: `shared:${namespace}`,
                key,
                timestamp: new Date(),
                success: true
            });
        }
        catch (error) {
            this.emitStorageEvent({
                type: StorageEventType.REMOVE,
                pluginId: this.pluginId,
                namespace: `shared:${namespace}`,
                key,
                timestamp: new Date(),
                success: false,
                error: error.message
            });
            throw new PluginError(`Failed to remove shared storage value: ${error.message}`, this.pluginId, 'SHARED_STORAGE_REMOVE_ERROR', error);
        }
    }
    /**
     * Get plugin configuration
     */
    async getConfig() {
        try {
            const config = await this.get('__config__');
            if (config) {
                return config;
            }
            // Return default configuration
            return {
                enabled: true,
                settings: {},
                domains: [],
                permissions: [],
                uiPreferences: {
                    theme: 'auto',
                    language: 'en',
                    notifications: true
                }
            };
        }
        catch (error) {
            throw new PluginError(`Failed to get plugin configuration: ${error.message}`, this.pluginId, 'CONFIG_GET_ERROR', error);
        }
    }
    /**
     * Set plugin configuration
     */
    async setConfig(config) {
        try {
            const currentConfig = await this.getConfig();
            const updatedConfig = { ...currentConfig, ...config };
            await this.set('__config__', updatedConfig);
        }
        catch (error) {
            throw new PluginError(`Failed to set plugin configuration: ${error.message}`, this.pluginId, 'CONFIG_SET_ERROR', error);
        }
    }
    /**
     * Migrate storage data
     */
    async migrate(version, migrationFn) {
        try {
            const migrationKey = `__migration:${version}__`;
            const migrationCompleted = await this.get(migrationKey);
            if (migrationCompleted) {
                return; // Migration already completed
            }
            // Get all plugin data
            const keys = await this.keys();
            const migrationPromises = keys
                .filter(key => !key.startsWith('__')) // Skip system keys
                .map(async (key) => {
                const oldData = await this.get(key);
                if (oldData !== null) {
                    try {
                        const newData = migrationFn(oldData);
                        await this.set(key, newData);
                    }
                    catch (error) {
                        console.error(`Migration failed for key ${key}:`, error);
                        // Continue with other keys
                    }
                }
            });
            await Promise.all(migrationPromises);
            // Mark migration as completed
            await this.set(migrationKey, {
                version,
                completedAt: new Date().toISOString(),
                pluginId: this.pluginId
            });
            this.emitStorageEvent({
                type: StorageEventType.MIGRATE,
                pluginId: this.pluginId,
                namespace: 'plugin',
                timestamp: new Date(),
                success: true
            });
        }
        catch (error) {
            this.emitStorageEvent({
                type: StorageEventType.MIGRATE,
                pluginId: this.pluginId,
                namespace: 'plugin',
                timestamp: new Date(),
                success: false,
                error: error.message
            });
            throw new PluginError(`Storage migration failed: ${error.message}`, this.pluginId, 'STORAGE_MIGRATION_ERROR', error);
        }
    }
    /**
     * Get storage statistics
     */
    async getStatistics() {
        try {
            const keys = await this.keys();
            const stats = {
                totalEntries: keys.length,
                totalSize: 0,
                namespaces: { plugin: keys.length },
                oldestEntry: undefined,
                newestEntry: undefined
            };
            // Calculate detailed statistics
            for (const key of keys) {
                try {
                    const storageKey = this.getStorageKey('plugin', key);
                    const entry = await this.getStorageEntry(storageKey);
                    if (entry) {
                        const entrySize = this.calculateEntrySize(entry);
                        stats.totalSize += entrySize;
                        if (!stats.oldestEntry || entry.timestamp < stats.oldestEntry) {
                            stats.oldestEntry = entry.timestamp;
                        }
                        if (!stats.newestEntry || entry.timestamp > stats.newestEntry) {
                            stats.newestEntry = entry.timestamp;
                        }
                    }
                }
                catch (error) {
                    // Skip entries that can't be read
                    console.warn(`Failed to read entry for statistics: ${key}`, error);
                }
            }
            return stats;
        }
        catch (error) {
            throw new PluginError(`Failed to get storage statistics: ${error.message}`, this.pluginId, 'STORAGE_STATS_ERROR', error);
        }
    }
    /**
     * Clean up expired entries
     */
    async cleanup() {
        try {
            const keys = await this.keys();
            let cleanedCount = 0;
            for (const key of keys) {
                try {
                    const storageKey = this.getStorageKey('plugin', key);
                    const entry = await this.getStorageEntry(storageKey);
                    if (entry && this.isEntryExpired(entry)) {
                        await this.remove(key);
                        cleanedCount++;
                    }
                }
                catch (error) {
                    console.warn(`Failed to cleanup entry: ${key}`, error);
                }
            }
            // Clean cache
            if (this.cacheEnabled) {
                for (const [cacheKey, entry] of this.cache.entries()) {
                    if (this.isEntryExpired(entry)) {
                        this.cache.delete(cacheKey);
                    }
                }
            }
            this.emitStorageEvent({
                type: StorageEventType.CLEANUP,
                pluginId: this.pluginId,
                namespace: 'plugin',
                timestamp: new Date(),
                success: true
            });
            return cleanedCount;
        }
        catch (error) {
            this.emitStorageEvent({
                type: StorageEventType.CLEANUP,
                pluginId: this.pluginId,
                namespace: 'plugin',
                timestamp: new Date(),
                success: false,
                error: error.message
            });
            throw new PluginError(`Storage cleanup failed: ${error.message}`, this.pluginId, 'STORAGE_CLEANUP_ERROR', error);
        }
    }
    /**
     * Add storage event listener
     */
    addEventListener(listener) {
        this.eventListeners.add(listener);
    }
    /**
     * Remove storage event listener
     */
    removeEventListener(listener) {
        this.eventListeners.delete(listener);
    }
    // Private helper methods
    getStorageKey(namespace, key) {
        return `${this.storagePrefix}${namespace}:${key}`;
    }
    getSharedStorageKey(namespace, key) {
        return `shared:${namespace}:${key}`;
    }
    async setStorageEntry(key, entry) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [key]: entry }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                }
                else {
                    resolve();
                }
            });
        });
    }
    async getStorageEntry(key) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                }
                else {
                    const entry = result[key];
                    if (entry && entry.timestamp) {
                        // Convert timestamp back to Date object
                        entry.timestamp = new Date(entry.timestamp);
                        if (entry.expiresAt) {
                            entry.expiresAt = new Date(entry.expiresAt);
                        }
                    }
                    resolve(entry || null);
                }
            });
        });
    }
    async removeStorageEntry(key) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove([key], () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                }
                else {
                    resolve();
                }
            });
        });
    }
    async getAllStorageKeys() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(null, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                }
                else {
                    resolve(Object.keys(result));
                }
            });
        });
    }
    isEntryExpired(entry) {
        if (!entry.expiresAt) {
            return false;
        }
        return new Date() > entry.expiresAt;
    }
    calculateEntrySize(entry) {
        // Rough estimation of entry size in bytes
        return JSON.stringify(entry).length * 2; // Assuming UTF-16 encoding
    }
    emitStorageEvent(event) {
        for (const listener of this.eventListeners) {
            try {
                listener(event);
            }
            catch (error) {
                console.error('Error in storage event listener:', error);
            }
        }
    }
}
/**
 * Plugin storage factory
 */
export class PluginStorageFactory {
    constructor() {
        this.storageInstances = new Map();
    }
    /**
     * Create or get storage instance for a plugin
     */
    createStorage(pluginId, options) {
        if (!this.storageInstances.has(pluginId)) {
            const storage = new DefaultPluginStorageService(pluginId, options);
            this.storageInstances.set(pluginId, storage);
        }
        return this.storageInstances.get(pluginId);
    }
    /**
     * Remove storage instance for a plugin
     */
    removeStorage(pluginId) {
        this.storageInstances.delete(pluginId);
    }
    /**
     * Get all storage instances
     */
    getAllStorageInstances() {
        return new Map(this.storageInstances);
    }
    /**
     * Clean up all storage instances
     */
    async cleanupAll() {
        const cleanupPromises = Array.from(this.storageInstances.values())
            .map(storage => storage.cleanup().catch(error => {
            console.error('Error during storage cleanup:', error);
            return 0;
        }));
        await Promise.all(cleanupPromises);
    }
    /**
     * Get aggregate statistics for all plugins
     */
    async getAggregateStatistics() {
        const pluginStats = {};
        let totalEntries = 0;
        let totalSize = 0;
        for (const [pluginId, storage] of this.storageInstances) {
            try {
                const stats = await storage.getStatistics();
                pluginStats[pluginId] = stats;
                totalEntries += stats.totalEntries;
                totalSize += stats.totalSize;
            }
            catch (error) {
                console.error(`Failed to get statistics for plugin ${pluginId}:`, error);
                pluginStats[pluginId] = { error: error.message };
            }
        }
        return {
            totalPlugins: this.storageInstances.size,
            totalEntries,
            totalSize,
            pluginStats
        };
    }
}
