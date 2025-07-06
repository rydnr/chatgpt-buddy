/**
 * @fileoverview Plugin Registry implementation for Web-Buddy plugin system
 * @description Manages plugin lifecycle, discovery, and registration
 */
import { PluginError, PluginLoadError, PluginInitializationError, PluginDependencyError, PluginEvents } from './plugin-interface';
/**
 * Core plugin registry implementation
 */
export class PluginRegistry {
    constructor(eventBus) {
        this.plugins = new Map();
        this.loadOrder = [];
        this.isShuttingDown = false;
        this.eventBus = eventBus;
        this.setupEventHandlers();
    }
    /**
     * Register a plugin with the registry
     */
    async register(plugin, manifest, context) {
        const pluginId = plugin.id;
        try {
            // Validate plugin
            this.validatePlugin(plugin, manifest);
            // Check for existing registration
            if (this.plugins.has(pluginId)) {
                throw new PluginLoadError(`Plugin ${pluginId} is already registered`, pluginId);
            }
            // Check dependencies
            await this.checkDependencies(manifest.dependencies || []);
            // Create registration
            const registration = {
                plugin,
                manifest,
                context,
                state: 'uninitialized',
                loadedAt: new Date(),
                dependencies: manifest.dependencies || [],
                dependents: [],
                errorCount: 0
            };
            // Register the plugin
            this.plugins.set(pluginId, registration);
            this.updateLoadOrder(pluginId);
            this.updateDependents(pluginId, manifest.dependencies || []);
            // Emit plugin loaded event
            await this.emitPluginEvent(PluginEvents.PLUGIN_LOADED, pluginId, {
                metadata: plugin.metadata,
                manifest: manifest
            });
            console.log(`✅ Plugin registered: ${pluginId} v${plugin.version}`);
        }
        catch (error) {
            const pluginError = error instanceof PluginError ? error :
                new PluginLoadError(`Failed to register plugin ${pluginId}: ${error.message}`, pluginId, error);
            await this.emitPluginEvent(PluginEvents.PLUGIN_ERROR, pluginId, {
                error: pluginError.message,
                details: pluginError.details
            });
            throw pluginError;
        }
    }
    /**
     * Unregister a plugin from the registry
     */
    async unregister(pluginId) {
        const registration = this.plugins.get(pluginId);
        if (!registration) {
            throw new PluginError(`Plugin ${pluginId} is not registered`, pluginId, 'PLUGIN_NOT_FOUND');
        }
        try {
            // Check if other plugins depend on this one
            if (registration.dependents.length > 0) {
                throw new PluginDependencyError(`Cannot unregister plugin ${pluginId}: ${registration.dependents.length} plugins depend on it`, pluginId, { dependents: registration.dependents });
            }
            // Deactivate if active
            if (registration.state === 'active') {
                await this.deactivate(pluginId);
            }
            // Destroy the plugin
            if (registration.state !== 'destroyed') {
                await this.destroyPlugin(registration);
            }
            // Remove from registry
            this.plugins.delete(pluginId);
            this.removeFromLoadOrder(pluginId);
            this.removeDependents(pluginId, registration.dependencies);
            await this.emitPluginEvent(PluginEvents.PLUGIN_DESTROYED, pluginId);
            console.log(`🗑️ Plugin unregistered: ${pluginId}`);
        }
        catch (error) {
            const pluginError = error instanceof PluginError ? error :
                new PluginError(`Failed to unregister plugin ${pluginId}: ${error.message}`, pluginId, 'UNREGISTER_ERROR');
            await this.emitPluginEvent(PluginEvents.PLUGIN_ERROR, pluginId, {
                error: pluginError.message
            });
            throw pluginError;
        }
    }
    /**
     * Get a registered plugin
     */
    getPlugin(pluginId) {
        const registration = this.plugins.get(pluginId);
        return registration ? registration.plugin : null;
    }
    /**
     * Get plugin registration information
     */
    getPluginRegistration(pluginId) {
        return this.plugins.get(pluginId) || null;
    }
    /**
     * Get all registered plugins
     */
    getAllPlugins() {
        return Array.from(this.plugins.values()).map(reg => reg.plugin);
    }
    /**
     * Get plugins by domain
     */
    getPluginsByDomain(domain) {
        return Array.from(this.plugins.values())
            .filter(reg => reg.plugin.capabilities.supportedDomains.some(d => d === domain || domain.match(new RegExp(d.replace(/\*/g, '.*')))))
            .map(reg => reg.plugin);
    }
    /**
     * Get plugins by state
     */
    getPluginsByState(state) {
        return Array.from(this.plugins.values())
            .filter(reg => reg.state === state)
            .map(reg => reg.plugin);
    }
    /**
     * Initialize a plugin
     */
    async initialize(pluginId) {
        const registration = this.plugins.get(pluginId);
        if (!registration) {
            throw new PluginError(`Plugin ${pluginId} is not registered`, pluginId, 'PLUGIN_NOT_FOUND');
        }
        if (registration.state !== 'uninitialized') {
            throw new PluginError(`Plugin ${pluginId} is not in uninitialized state`, pluginId, 'INVALID_STATE');
        }
        try {
            // Initialize dependencies first
            for (const depId of registration.dependencies) {
                const depRegistration = this.plugins.get(depId);
                if (depRegistration && depRegistration.state === 'uninitialized') {
                    await this.initialize(depId);
                }
            }
            // Initialize the plugin
            registration.state = 'initialized';
            await registration.plugin.initialize(registration.context);
            await this.emitPluginEvent(PluginEvents.PLUGIN_INITIALIZED, pluginId);
            console.log(`🔧 Plugin initialized: ${pluginId}`);
        }
        catch (error) {
            registration.state = 'error';
            registration.errorCount++;
            registration.lastError = error;
            const pluginError = new PluginInitializationError(`Failed to initialize plugin ${pluginId}: ${error.message}`, pluginId, error);
            await this.emitPluginEvent(PluginEvents.PLUGIN_ERROR, pluginId, {
                error: pluginError.message,
                phase: 'initialization'
            });
            throw pluginError;
        }
    }
    /**
     * Activate a plugin
     */
    async activate(pluginId) {
        const registration = this.plugins.get(pluginId);
        if (!registration) {
            throw new PluginError(`Plugin ${pluginId} is not registered`, pluginId, 'PLUGIN_NOT_FOUND');
        }
        if (registration.state === 'active') {
            return; // Already active
        }
        if (registration.state !== 'initialized' && registration.state !== 'inactive') {
            throw new PluginError(`Plugin ${pluginId} cannot be activated from ${registration.state} state`, pluginId, 'INVALID_STATE');
        }
        try {
            // Activate dependencies first
            for (const depId of registration.dependencies) {
                const depRegistration = this.plugins.get(depId);
                if (depRegistration && depRegistration.state !== 'active') {
                    if (depRegistration.state === 'uninitialized') {
                        await this.initialize(depId);
                    }
                    if (depRegistration.state === 'initialized' || depRegistration.state === 'inactive') {
                        await this.activate(depId);
                    }
                }
            }
            // Activate the plugin
            await registration.plugin.activate();
            registration.state = 'active';
            registration.activatedAt = new Date();
            await this.emitPluginEvent(PluginEvents.PLUGIN_ACTIVATED, pluginId);
            console.log(`🟢 Plugin activated: ${pluginId}`);
        }
        catch (error) {
            registration.state = 'error';
            registration.errorCount++;
            registration.lastError = error;
            const pluginError = new PluginError(`Failed to activate plugin ${pluginId}: ${error.message}`, pluginId, 'ACTIVATION_ERROR', error);
            await this.emitPluginEvent(PluginEvents.PLUGIN_ERROR, pluginId, {
                error: pluginError.message,
                phase: 'activation'
            });
            throw pluginError;
        }
    }
    /**
     * Deactivate a plugin
     */
    async deactivate(pluginId) {
        const registration = this.plugins.get(pluginId);
        if (!registration) {
            throw new PluginError(`Plugin ${pluginId} is not registered`, pluginId, 'PLUGIN_NOT_FOUND');
        }
        if (registration.state !== 'active') {
            return; // Already inactive
        }
        try {
            // Deactivate dependents first
            for (const dependentId of registration.dependents) {
                const dependentRegistration = this.plugins.get(dependentId);
                if (dependentRegistration && dependentRegistration.state === 'active') {
                    await this.deactivate(dependentId);
                }
            }
            // Deactivate the plugin
            await registration.plugin.deactivate();
            registration.state = 'inactive';
            registration.deactivatedAt = new Date();
            await this.emitPluginEvent(PluginEvents.PLUGIN_DEACTIVATED, pluginId);
            console.log(`🔴 Plugin deactivated: ${pluginId}`);
        }
        catch (error) {
            registration.state = 'error';
            registration.errorCount++;
            registration.lastError = error;
            const pluginError = new PluginError(`Failed to deactivate plugin ${pluginId}: ${error.message}`, pluginId, 'DEACTIVATION_ERROR', error);
            await this.emitPluginEvent(PluginEvents.PLUGIN_ERROR, pluginId, {
                error: pluginError.message,
                phase: 'deactivation'
            });
            throw pluginError;
        }
    }
    /**
     * Discover plugins from various sources
     */
    async discoverPlugins(options = {}) {
        console.log('🔍 Discovering plugins...', options);
        const manifests = [];
        try {
            // Discover from manifest (built-in plugins)
            if (!options.source || options.source === 'manifest') {
                const manifestPlugins = await this.discoverFromManifest();
                manifests.push(...manifestPlugins);
            }
            // Discover from URLs (remote plugins)
            if (!options.source || options.source === 'url') {
                const urlPlugins = await this.discoverFromURL();
                manifests.push(...urlPlugins);
            }
            // Discover from registry (marketplace plugins)
            if (!options.source || options.source === 'registry') {
                const registryPlugins = await this.discoverFromRegistry();
                manifests.push(...registryPlugins);
            }
            // Filter by domain if specified
            if (options.domain) {
                return manifests.filter(manifest => manifest.capabilities.supportedDomains.some(d => d === options.domain || options.domain.match(new RegExp(d.replace(/\*/g, '.*')))));
            }
            return manifests;
        }
        catch (error) {
            console.error('❌ Plugin discovery failed:', error);
            throw new PluginError(`Plugin discovery failed: ${error.message}`, 'SYSTEM', 'DISCOVERY_ERROR', error);
        }
    }
    /**
     * Send message to a specific plugin
     */
    async sendMessageToPlugin(pluginId, message) {
        const registration = this.plugins.get(pluginId);
        if (!registration) {
            throw new PluginError(`Plugin ${pluginId} is not registered`, pluginId, 'PLUGIN_NOT_FOUND');
        }
        if (registration.state !== 'active') {
            throw new PluginError(`Plugin ${pluginId} is not active`, pluginId, 'PLUGIN_NOT_ACTIVE');
        }
        try {
            const event = {
                type: 'message',
                source: 'system',
                target: pluginId,
                data: message,
                timestamp: new Date().toISOString()
            };
            await registration.plugin.onEvent(event);
            return { success: true };
        }
        catch (error) {
            throw new PluginError(`Failed to send message to plugin ${pluginId}: ${error.message}`, pluginId, 'MESSAGE_ERROR', error);
        }
    }
    /**
     * Broadcast event to all active plugins
     */
    async broadcastEvent(event) {
        const activePlugins = this.getPluginsByState('active');
        const promises = activePlugins.map(async (plugin) => {
            try {
                await plugin.onEvent(event);
            }
            catch (error) {
                console.error(`Error broadcasting event to plugin ${plugin.id}:`, error);
                // Don't throw here to avoid stopping other plugins
            }
        });
        await Promise.allSettled(promises);
    }
    /**
     * Shutdown all plugins
     */
    async shutdown() {
        if (this.isShuttingDown) {
            return;
        }
        this.isShuttingDown = true;
        console.log('🔄 Shutting down plugin registry...');
        try {
            // Deactivate all active plugins in reverse load order
            const reverseLoadOrder = [...this.loadOrder].reverse();
            for (const pluginId of reverseLoadOrder) {
                const registration = this.plugins.get(pluginId);
                if (registration && registration.state === 'active') {
                    try {
                        await this.deactivate(pluginId);
                    }
                    catch (error) {
                        console.error(`Error deactivating plugin ${pluginId} during shutdown:`, error);
                    }
                }
            }
            // Destroy all plugins
            for (const pluginId of reverseLoadOrder) {
                const registration = this.plugins.get(pluginId);
                if (registration && registration.state !== 'destroyed') {
                    try {
                        await this.destroyPlugin(registration);
                    }
                    catch (error) {
                        console.error(`Error destroying plugin ${pluginId} during shutdown:`, error);
                    }
                }
            }
            // Clear all registrations
            this.plugins.clear();
            this.loadOrder = [];
            await this.emitPluginEvent(PluginEvents.SYSTEM_SHUTDOWN, 'system');
            console.log('✅ Plugin registry shutdown complete');
        }
        catch (error) {
            console.error('❌ Error during plugin registry shutdown:', error);
            throw error;
        }
        finally {
            this.isShuttingDown = false;
        }
    }
    /**
     * Get plugin registry statistics
     */
    getStatistics() {
        const stats = {
            total: this.plugins.size,
            byState: {},
            loadOrder: this.loadOrder,
            errors: 0,
            activeContracts: 0
        };
        // Count plugins by state
        for (const state of ['uninitialized', 'initialized', 'active', 'inactive', 'error', 'destroyed']) {
            stats.byState[state] = 0;
        }
        for (const registration of this.plugins.values()) {
            stats.byState[registration.state]++;
            stats.errors += registration.errorCount;
            if (registration.state === 'active') {
                stats.activeContracts += registration.plugin.getContracts().length;
            }
        }
        return stats;
    }
    // Private helper methods
    async destroyPlugin(registration) {
        try {
            await registration.plugin.destroy();
            registration.state = 'destroyed';
        }
        catch (error) {
            console.error(`Error destroying plugin ${registration.plugin.id}:`, error);
            registration.state = 'error';
            registration.errorCount++;
            registration.lastError = error;
        }
    }
    validatePlugin(plugin, manifest) {
        if (!plugin.id || typeof plugin.id !== 'string') {
            throw new PluginLoadError('Plugin must have a valid string ID', plugin.id || 'unknown');
        }
        if (!plugin.name || typeof plugin.name !== 'string') {
            throw new PluginLoadError('Plugin must have a valid string name', plugin.id);
        }
        if (!plugin.version || typeof plugin.version !== 'string') {
            throw new PluginLoadError('Plugin must have a valid string version', plugin.id);
        }
        if (!manifest.metadata || manifest.metadata.id !== plugin.id) {
            throw new PluginLoadError('Plugin ID must match manifest metadata ID', plugin.id);
        }
        // Validate required methods
        const requiredMethods = ['initialize', 'activate', 'deactivate', 'destroy', 'getContracts', 'executeCapability', 'getUIComponents', 'getMenuItems', 'onEvent'];
        for (const method of requiredMethods) {
            if (typeof plugin[method] !== 'function') {
                throw new PluginLoadError(`Plugin must implement ${method} method`, plugin.id);
            }
        }
    }
    async checkDependencies(dependencies) {
        for (const depId of dependencies) {
            const depRegistration = this.plugins.get(depId);
            if (!depRegistration) {
                throw new PluginDependencyError(`Required dependency ${depId} is not available`, depId);
            }
        }
    }
    updateLoadOrder(pluginId) {
        if (!this.loadOrder.includes(pluginId)) {
            this.loadOrder.push(pluginId);
        }
    }
    removeFromLoadOrder(pluginId) {
        const index = this.loadOrder.indexOf(pluginId);
        if (index !== -1) {
            this.loadOrder.splice(index, 1);
        }
    }
    updateDependents(pluginId, dependencies) {
        for (const depId of dependencies) {
            const depRegistration = this.plugins.get(depId);
            if (depRegistration && !depRegistration.dependents.includes(pluginId)) {
                depRegistration.dependents.push(pluginId);
            }
        }
    }
    removeDependents(pluginId, dependencies) {
        for (const depId of dependencies) {
            const depRegistration = this.plugins.get(depId);
            if (depRegistration) {
                const index = depRegistration.dependents.indexOf(pluginId);
                if (index !== -1) {
                    depRegistration.dependents.splice(index, 1);
                }
            }
        }
    }
    async emitPluginEvent(type, pluginId, data) {
        const event = {
            type,
            source: 'plugin-registry',
            target: pluginId,
            data: data || {},
            timestamp: new Date().toISOString()
        };
        try {
            await this.eventBus.emit(event);
        }
        catch (error) {
            console.error('Error emitting plugin event:', error);
        }
    }
    setupEventHandlers() {
        // Listen for system events
        this.eventBus.on(PluginEvents.SYSTEM_SHUTDOWN, async () => {
            await this.shutdown();
        });
    }
    // Discovery method implementations (placeholder)
    async discoverFromManifest() {
        // TODO: Implement discovery from extension manifest
        return [];
    }
    async discoverFromURL() {
        // TODO: Implement discovery from URLs
        return [];
    }
    async discoverFromRegistry() {
        // TODO: Implement discovery from plugin registry
        return [];
    }
}
