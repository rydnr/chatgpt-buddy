/**
 * @fileoverview Plugin Context implementation for Web-Buddy plugin system
 * @description Provides services and context to plugins
 */
import { PluginContext, PluginMetadata, PluginConfiguration, PluginState, PluginUIComponent, PluginMenuItem, PluginStorageService, PluginMessaging, PluginEventBus, PluginLogger, TabManager, ExtensionAPI, ContractRegistry, ContractExecutionService } from './plugin-interface';
/**
 * Default plugin context implementation
 */
export declare class DefaultPluginContext implements PluginContext {
    readonly pluginId: string;
    readonly metadata: PluginMetadata;
    readonly contractRegistry: ContractRegistry;
    readonly executionService: ContractExecutionService;
    readonly storageService: PluginStorageService;
    readonly tabManager: TabManager;
    readonly extensionAPI: ExtensionAPI;
    readonly messaging: PluginMessaging;
    readonly eventBus: PluginEventBus;
    readonly config: PluginConfiguration;
    readonly logger: PluginLogger;
    private state;
    private dependencies;
    constructor(pluginId: string, metadata: PluginMetadata, services: {
        contractRegistry: ContractRegistry;
        executionService: ContractExecutionService;
        storageService: PluginStorageService;
        tabManager: TabManager;
        extensionAPI: ExtensionAPI;
        messaging: PluginMessaging;
        eventBus: PluginEventBus;
        config: PluginConfiguration;
        logger: PluginLogger;
    });
    /**
     * Create a UI component for the plugin
     */
    createUIComponent(definition: Omit<PluginUIComponent, 'id'>): PluginUIComponent;
    /**
     * Create a menu item for the plugin
     */
    createMenuItem(definition: Omit<PluginMenuItem, 'id'>): PluginMenuItem;
    /**
     * Get the current plugin state
     */
    getState(): PluginState;
    /**
     * Set the plugin state
     */
    setState(state: PluginState): void;
    /**
     * Get a dependency instance
     */
    getDependency<T = any>(dependencyId: string): Promise<T | null>;
    /**
     * Check if a dependency is available
     */
    hasDependency(dependencyId: string): boolean;
    /**
     * Add a dependency to the context
     */
    addDependency(dependencyId: string, instance: any): void;
    /**
     * Remove a dependency from the context
     */
    removeDependency(dependencyId: string): void;
    /**
     * Get all available dependencies
     */
    getDependencies(): string[];
    /**
     * Create a scoped logger for the plugin
     */
    createScopedLogger(scope: string): PluginLogger;
    /**
     * Create a plugin-scoped storage instance
     */
    createScopedStorage(namespace: string): PluginStorageService;
    /**
     * Get plugin execution metrics
     */
    getMetrics(): Record<string, any>;
    /**
     * Dispose of the context and clean up resources
     */
    dispose(): void;
    private resolveDependency;
    private getMemoryUsage;
    private getUptime;
}
/**
 * Plugin context factory for creating configured contexts
 */
export declare class PluginContextFactory {
    private contractRegistry;
    private executionService;
    private baseStorageService;
    private tabManager;
    private extensionAPI;
    private messaging;
    private eventBus;
    private loggerFactory;
    constructor(services: {
        contractRegistry: ContractRegistry;
        executionService: ContractExecutionService;
        storageService: PluginStorageService;
        tabManager: TabManager;
        extensionAPI: ExtensionAPI;
        messaging: PluginMessaging;
        eventBus: PluginEventBus;
        loggerFactory: (pluginId: string) => PluginLogger;
    });
    /**
     * Create a new plugin context
     */
    createContext(pluginId: string, metadata: PluginMetadata, config: PluginConfiguration): PluginContext;
    /**
     * Update factory services
     */
    updateServices(services: Partial<{
        contractRegistry: ContractRegistry;
        executionService: ContractExecutionService;
        storageService: PluginStorageService;
        tabManager: TabManager;
        extensionAPI: ExtensionAPI;
        messaging: PluginMessaging;
        eventBus: PluginEventBus;
        loggerFactory: (pluginId: string) => PluginLogger;
    }>): void;
}
//# sourceMappingURL=plugin-context.d.ts.map