/**
 * @fileoverview Plugin Context implementation for Web-Buddy plugin system
 * @description Provides services and context to plugins
 */
/**
 * Default plugin context implementation
 */
export class DefaultPluginContext {
    constructor(pluginId, metadata, services) {
        this.state = 'uninitialized';
        this.dependencies = new Map();
        this.pluginId = pluginId;
        this.metadata = metadata;
        this.contractRegistry = services.contractRegistry;
        this.executionService = services.executionService;
        this.storageService = services.storageService;
        this.tabManager = services.tabManager;
        this.extensionAPI = services.extensionAPI;
        this.messaging = services.messaging;
        this.eventBus = services.eventBus;
        this.config = services.config;
        this.logger = services.logger;
    }
    /**
     * Create a UI component for the plugin
     */
    createUIComponent(definition) {
        const componentId = `${this.pluginId}-${definition.name}-${Date.now()}`;
        return {
            id: componentId,
            ...definition
        };
    }
    /**
     * Create a menu item for the plugin
     */
    createMenuItem(definition) {
        const menuItemId = `${this.pluginId}-${definition.label.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
        return {
            id: menuItemId,
            ...definition
        };
    }
    /**
     * Get the current plugin state
     */
    getState() {
        return this.state;
    }
    /**
     * Set the plugin state
     */
    setState(state) {
        const oldState = this.state;
        this.state = state;
        this.logger.debug(`Plugin state changed: ${oldState} -> ${state}`, {
            pluginId: this.pluginId,
            oldState,
            newState: state,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Get a dependency instance
     */
    async getDependency(dependencyId) {
        if (this.dependencies.has(dependencyId)) {
            return this.dependencies.get(dependencyId);
        }
        // Try to resolve dependency dynamically
        try {
            const dependency = await this.resolveDependency(dependencyId);
            if (dependency) {
                this.dependencies.set(dependencyId, dependency);
                return dependency;
            }
        }
        catch (error) {
            this.logger.error(`Failed to resolve dependency ${dependencyId}:`, error, {
                pluginId: this.pluginId,
                dependencyId
            });
        }
        return null;
    }
    /**
     * Check if a dependency is available
     */
    hasDependency(dependencyId) {
        return this.dependencies.has(dependencyId);
    }
    /**
     * Add a dependency to the context
     */
    addDependency(dependencyId, instance) {
        this.dependencies.set(dependencyId, instance);
        this.logger.debug(`Dependency added: ${dependencyId}`, {
            pluginId: this.pluginId,
            dependencyId
        });
    }
    /**
     * Remove a dependency from the context
     */
    removeDependency(dependencyId) {
        this.dependencies.delete(dependencyId);
        this.logger.debug(`Dependency removed: ${dependencyId}`, {
            pluginId: this.pluginId,
            dependencyId
        });
    }
    /**
     * Get all available dependencies
     */
    getDependencies() {
        return Array.from(this.dependencies.keys());
    }
    /**
     * Create a scoped logger for the plugin
     */
    createScopedLogger(scope) {
        return this.logger.child({
            pluginId: this.pluginId,
            scope
        });
    }
    /**
     * Create a plugin-scoped storage instance
     */
    createScopedStorage(namespace) {
        return new ScopedStorageService(this.storageService, this.pluginId, namespace);
    }
    /**
     * Get plugin execution metrics
     */
    getMetrics() {
        return {
            pluginId: this.pluginId,
            state: this.state,
            dependencies: this.dependencies.size,
            memoryUsage: this.getMemoryUsage(),
            uptime: this.getUptime()
        };
    }
    /**
     * Dispose of the context and clean up resources
     */
    dispose() {
        this.dependencies.clear();
        this.logger.info('Plugin context disposed', {
            pluginId: this.pluginId
        });
    }
    // Private helper methods
    async resolveDependency(dependencyId) {
        // This would typically involve looking up the dependency in a service locator
        // or dependency injection container. For now, we'll return null.
        this.logger.warn(`Cannot resolve dependency: ${dependencyId}`, {
            pluginId: this.pluginId,
            dependencyId
        });
        return null;
    }
    getMemoryUsage() {
        // Estimate memory usage (this is a placeholder implementation)
        return this.dependencies.size * 1024; // Rough estimate
    }
    getUptime() {
        // Calculate uptime since initialization (placeholder)
        return Date.now() - this.metadata.createdAt || 0;
    }
}
/**
 * Scoped storage service that isolates storage by plugin and namespace
 */
class ScopedStorageService {
    constructor(baseStorage, pluginId, namespace) {
        this.baseStorage = baseStorage;
        this.pluginId = pluginId;
        this.namespace = namespace;
        this.prefix = `${pluginId}:${namespace}:`;
    }
    async set(key, value) {
        return this.baseStorage.set(this.prefix + key, value);
    }
    async get(key) {
        return this.baseStorage.get(this.prefix + key);
    }
    async remove(key) {
        return this.baseStorage.remove(this.prefix + key);
    }
    async clear() {
        const keys = await this.keys();
        for (const key of keys) {
            await this.remove(key);
        }
    }
    async keys() {
        const allKeys = await this.baseStorage.keys();
        return allKeys
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.substring(this.prefix.length));
    }
    async setShared(namespace, key, value) {
        return this.baseStorage.setShared(namespace, key, value);
    }
    async getShared(namespace, key) {
        return this.baseStorage.getShared(namespace, key);
    }
    async removeShared(namespace, key) {
        return this.baseStorage.removeShared(namespace, key);
    }
    async getConfig() {
        return this.baseStorage.getConfig();
    }
    async setConfig(config) {
        return this.baseStorage.setConfig(config);
    }
    async migrate(version, migrationFn) {
        return this.baseStorage.migrate(version, migrationFn);
    }
}
/**
 * Plugin context factory for creating configured contexts
 */
export class PluginContextFactory {
    constructor(services) {
        this.contractRegistry = services.contractRegistry;
        this.executionService = services.executionService;
        this.baseStorageService = services.storageService;
        this.tabManager = services.tabManager;
        this.extensionAPI = services.extensionAPI;
        this.messaging = services.messaging;
        this.eventBus = services.eventBus;
        this.loggerFactory = services.loggerFactory;
    }
    /**
     * Create a new plugin context
     */
    createContext(pluginId, metadata, config) {
        const logger = this.loggerFactory(pluginId);
        const storageService = new ScopedStorageService(this.baseStorageService, pluginId, 'default');
        return new DefaultPluginContext(pluginId, metadata, {
            contractRegistry: this.contractRegistry,
            executionService: this.executionService,
            storageService,
            tabManager: this.tabManager,
            extensionAPI: this.extensionAPI,
            messaging: this.messaging,
            eventBus: this.eventBus,
            config,
            logger
        });
    }
    /**
     * Update factory services
     */
    updateServices(services) {
        if (services.contractRegistry)
            this.contractRegistry = services.contractRegistry;
        if (services.executionService)
            this.executionService = services.executionService;
        if (services.storageService)
            this.baseStorageService = services.storageService;
        if (services.tabManager)
            this.tabManager = services.tabManager;
        if (services.extensionAPI)
            this.extensionAPI = services.extensionAPI;
        if (services.messaging)
            this.messaging = services.messaging;
        if (services.eventBus)
            this.eventBus = services.eventBus;
        if (services.loggerFactory)
            this.loggerFactory = services.loggerFactory;
    }
}
