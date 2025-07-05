/**
 * @fileoverview Plugin Context implementation for Web-Buddy plugin system
 * @description Provides services and context to plugins
 */

import {
  PluginContext,
  PluginMetadata,
  PluginConfiguration,
  PluginState,
  PluginUIComponent,
  PluginMenuItem,
  PluginStorageService,
  PluginMessaging,
  PluginEventBus,
  PluginLogger,
  TabManager,
  ExtensionAPI,
  ContractRegistry,
  ContractExecutionService
} from './plugin-interface';

/**
 * Default plugin context implementation
 */
export class DefaultPluginContext implements PluginContext {
  public readonly pluginId: string;
  public readonly metadata: PluginMetadata;
  
  // Core services
  public readonly contractRegistry: ContractRegistry;
  public readonly executionService: ContractExecutionService;
  public readonly storageService: PluginStorageService;
  
  // Browser integration
  public readonly tabManager: TabManager;
  public readonly extensionAPI: ExtensionAPI;
  
  // Plugin communication
  public readonly messaging: PluginMessaging;
  public readonly eventBus: PluginEventBus;
  
  // Configuration and logging
  public readonly config: PluginConfiguration;
  public readonly logger: PluginLogger;
  
  private state: PluginState = 'uninitialized';
  private dependencies: Map<string, any> = new Map();

  constructor(
    pluginId: string,
    metadata: PluginMetadata,
    services: {
      contractRegistry: ContractRegistry;
      executionService: ContractExecutionService;
      storageService: PluginStorageService;
      tabManager: TabManager;
      extensionAPI: ExtensionAPI;
      messaging: PluginMessaging;
      eventBus: PluginEventBus;
      config: PluginConfiguration;
      logger: PluginLogger;
    }
  ) {
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
  createUIComponent(definition: Omit<PluginUIComponent, 'id'>): PluginUIComponent {
    const componentId = `${this.pluginId}-${definition.name}-${Date.now()}`;
    
    return {
      id: componentId,
      ...definition
    };
  }

  /**
   * Create a menu item for the plugin
   */
  createMenuItem(definition: Omit<PluginMenuItem, 'id'>): PluginMenuItem {
    const menuItemId = `${this.pluginId}-${definition.label.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    
    return {
      id: menuItemId,
      ...definition
    };
  }

  /**
   * Get the current plugin state
   */
  getState(): PluginState {
    return this.state;
  }

  /**
   * Set the plugin state
   */
  setState(state: PluginState): void {
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
  async getDependency<T = any>(dependencyId: string): Promise<T | null> {
    if (this.dependencies.has(dependencyId)) {
      return this.dependencies.get(dependencyId) as T;
    }
    
    // Try to resolve dependency dynamically
    try {
      const dependency = await this.resolveDependency(dependencyId);
      if (dependency) {
        this.dependencies.set(dependencyId, dependency);
        return dependency as T;
      }
    } catch (error) {
      this.logger.error(`Failed to resolve dependency ${dependencyId}:`, error as Error, {
        pluginId: this.pluginId,
        dependencyId
      });
    }
    
    return null;
  }

  /**
   * Check if a dependency is available
   */
  hasDependency(dependencyId: string): boolean {
    return this.dependencies.has(dependencyId);
  }

  /**
   * Add a dependency to the context
   */
  addDependency(dependencyId: string, instance: any): void {
    this.dependencies.set(dependencyId, instance);
    this.logger.debug(`Dependency added: ${dependencyId}`, {
      pluginId: this.pluginId,
      dependencyId
    });
  }

  /**
   * Remove a dependency from the context
   */
  removeDependency(dependencyId: string): void {
    this.dependencies.delete(dependencyId);
    this.logger.debug(`Dependency removed: ${dependencyId}`, {
      pluginId: this.pluginId,
      dependencyId
    });
  }

  /**
   * Get all available dependencies
   */
  getDependencies(): string[] {
    return Array.from(this.dependencies.keys());
  }

  /**
   * Create a scoped logger for the plugin
   */
  createScopedLogger(scope: string): PluginLogger {
    return this.logger.child({
      pluginId: this.pluginId,
      scope
    });
  }

  /**
   * Create a plugin-scoped storage instance
   */
  createScopedStorage(namespace: string): PluginStorageService {
    return new ScopedStorageService(this.storageService, this.pluginId, namespace);
  }

  /**
   * Get plugin execution metrics
   */
  getMetrics(): Record<string, any> {
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
  dispose(): void {
    this.dependencies.clear();
    this.logger.info('Plugin context disposed', {
      pluginId: this.pluginId
    });
  }

  // Private helper methods

  private async resolveDependency(dependencyId: string): Promise<any | null> {
    // This would typically involve looking up the dependency in a service locator
    // or dependency injection container. For now, we'll return null.
    this.logger.warn(`Cannot resolve dependency: ${dependencyId}`, {
      pluginId: this.pluginId,
      dependencyId
    });
    return null;
  }

  private getMemoryUsage(): number {
    // Estimate memory usage (this is a placeholder implementation)
    return this.dependencies.size * 1024; // Rough estimate
  }

  private getUptime(): number {
    // Calculate uptime since initialization (placeholder)
    return Date.now() - (this.metadata as any).createdAt || 0;
  }
}

/**
 * Scoped storage service that isolates storage by plugin and namespace
 */
class ScopedStorageService implements PluginStorageService {
  private baseStorage: PluginStorageService;
  private pluginId: string;
  private namespace: string;
  private prefix: string;

  constructor(baseStorage: PluginStorageService, pluginId: string, namespace: string) {
    this.baseStorage = baseStorage;
    this.pluginId = pluginId;
    this.namespace = namespace;
    this.prefix = `${pluginId}:${namespace}:`;
  }

  async set(key: string, value: any): Promise<void> {
    return this.baseStorage.set(this.prefix + key, value);
  }

  async get(key: string): Promise<any> {
    return this.baseStorage.get(this.prefix + key);
  }

  async remove(key: string): Promise<void> {
    return this.baseStorage.remove(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    for (const key of keys) {
      await this.remove(key);
    }
  }

  async keys(): Promise<string[]> {
    const allKeys = await this.baseStorage.keys();
    return allKeys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.substring(this.prefix.length));
  }

  async setShared(namespace: string, key: string, value: any): Promise<void> {
    return this.baseStorage.setShared(namespace, key, value);
  }

  async getShared(namespace: string, key: string): Promise<any> {
    return this.baseStorage.getShared(namespace, key);
  }

  async removeShared(namespace: string, key: string): Promise<void> {
    return this.baseStorage.removeShared(namespace, key);
  }

  async getConfig(): Promise<PluginConfiguration> {
    return this.baseStorage.getConfig();
  }

  async setConfig(config: Partial<PluginConfiguration>): Promise<void> {
    return this.baseStorage.setConfig(config);
  }

  async migrate(version: string, migrationFn: (oldData: any) => any): Promise<void> {
    return this.baseStorage.migrate(version, migrationFn);
  }
}

/**
 * Plugin context factory for creating configured contexts
 */
export class PluginContextFactory {
  private contractRegistry: ContractRegistry;
  private executionService: ContractExecutionService;
  private baseStorageService: PluginStorageService;
  private tabManager: TabManager;
  private extensionAPI: ExtensionAPI;
  private messaging: PluginMessaging;
  private eventBus: PluginEventBus;
  private loggerFactory: (pluginId: string) => PluginLogger;

  constructor(services: {
    contractRegistry: ContractRegistry;
    executionService: ContractExecutionService;
    storageService: PluginStorageService;
    tabManager: TabManager;
    extensionAPI: ExtensionAPI;
    messaging: PluginMessaging;
    eventBus: PluginEventBus;
    loggerFactory: (pluginId: string) => PluginLogger;
  }) {
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
  createContext(
    pluginId: string,
    metadata: PluginMetadata,
    config: PluginConfiguration
  ): PluginContext {
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
  updateServices(services: Partial<{
    contractRegistry: ContractRegistry;
    executionService: ContractExecutionService;
    storageService: PluginStorageService;
    tabManager: TabManager;
    extensionAPI: ExtensionAPI;
    messaging: PluginMessaging;
    eventBus: PluginEventBus;
    loggerFactory: (pluginId: string) => PluginLogger;
  }>): void {
    if (services.contractRegistry) this.contractRegistry = services.contractRegistry;
    if (services.executionService) this.executionService = services.executionService;
    if (services.storageService) this.baseStorageService = services.storageService;
    if (services.tabManager) this.tabManager = services.tabManager;
    if (services.extensionAPI) this.extensionAPI = services.extensionAPI;
    if (services.messaging) this.messaging = services.messaging;
    if (services.eventBus) this.eventBus = services.eventBus;
    if (services.loggerFactory) this.loggerFactory = services.loggerFactory;
  }
}