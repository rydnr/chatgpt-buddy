/**
 * @fileoverview Plugin Registry implementation for Web-Buddy plugin system
 * @description Manages plugin lifecycle, discovery, and registration
 */
import { WebBuddyPlugin, PluginManifest, PluginState, PluginEventBus, PluginEvent, PluginContext } from './plugin-interface';
/**
 * Plugin registration information
 */
interface PluginRegistration {
    plugin: WebBuddyPlugin;
    manifest: PluginManifest;
    context: PluginContext;
    state: PluginState;
    loadedAt: Date;
    activatedAt?: Date;
    deactivatedAt?: Date;
    dependencies: string[];
    dependents: string[];
    errorCount: number;
    lastError?: Error;
}
/**
 * Plugin discovery options
 */
interface PluginDiscoveryOptions {
    source?: 'manifest' | 'url' | 'registry' | 'filesystem';
    domain?: string;
    includeInactive?: boolean;
    includeSystem?: boolean;
}
/**
 * Core plugin registry implementation
 */
export declare class PluginRegistry {
    private plugins;
    private eventBus;
    private loadOrder;
    private isShuttingDown;
    constructor(eventBus: PluginEventBus);
    /**
     * Register a plugin with the registry
     */
    register(plugin: WebBuddyPlugin, manifest: PluginManifest, context: PluginContext): Promise<void>;
    /**
     * Unregister a plugin from the registry
     */
    unregister(pluginId: string): Promise<void>;
    /**
     * Get a registered plugin
     */
    getPlugin(pluginId: string): WebBuddyPlugin | null;
    /**
     * Get plugin registration information
     */
    getPluginRegistration(pluginId: string): PluginRegistration | null;
    /**
     * Get all registered plugins
     */
    getAllPlugins(): WebBuddyPlugin[];
    /**
     * Get plugins by domain
     */
    getPluginsByDomain(domain: string): WebBuddyPlugin[];
    /**
     * Get plugins by state
     */
    getPluginsByState(state: PluginState): WebBuddyPlugin[];
    /**
     * Initialize a plugin
     */
    initialize(pluginId: string): Promise<void>;
    /**
     * Activate a plugin
     */
    activate(pluginId: string): Promise<void>;
    /**
     * Deactivate a plugin
     */
    deactivate(pluginId: string): Promise<void>;
    /**
     * Discover plugins from various sources
     */
    discoverPlugins(options?: PluginDiscoveryOptions): Promise<PluginManifest[]>;
    /**
     * Send message to a specific plugin
     */
    sendMessageToPlugin(pluginId: string, message: any): Promise<any>;
    /**
     * Broadcast event to all active plugins
     */
    broadcastEvent(event: PluginEvent): Promise<void>;
    /**
     * Shutdown all plugins
     */
    shutdown(): Promise<void>;
    /**
     * Get plugin registry statistics
     */
    getStatistics(): {
        total: number;
        byState: Record<PluginState, number>;
        loadOrder: string[];
        errors: number;
        activeContracts: number;
    };
    private destroyPlugin;
    private validatePlugin;
    private checkDependencies;
    private updateLoadOrder;
    private removeFromLoadOrder;
    private updateDependents;
    private removeDependents;
    private emitPluginEvent;
    private setupEventHandlers;
    private discoverFromManifest;
    private discoverFromURL;
    private discoverFromRegistry;
}
export {};
//# sourceMappingURL=plugin-registry.d.ts.map