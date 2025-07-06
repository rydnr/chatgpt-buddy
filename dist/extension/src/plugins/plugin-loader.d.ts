/**
 * @fileoverview Plugin Loader implementation for Web-Buddy plugin system
 * @description Handles dynamic plugin loading, validation, and sandboxing
 */
import { WebBuddyPlugin, PluginManifest, PluginPackage, PluginSecurityPolicy } from './plugin-interface';
/**
 * Plugin loading options
 */
interface PluginLoadOptions {
    skipDependencies?: boolean;
    skipValidation?: boolean;
    allowReload?: boolean;
    timeout?: number;
    sandboxed?: boolean;
    securityPolicy?: PluginSecurityPolicy;
}
/**
 * Plugin loading result
 */
interface PluginLoadResult {
    plugin: WebBuddyPlugin;
    manifest: PluginManifest;
    loadTime: number;
    warnings: string[];
    dependencies: string[];
}
/**
 * Plugin validation result
 */
interface PluginValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    securityIssues: string[];
}
/**
 * Core plugin loader implementation
 */
export declare class PluginLoader {
    private loadedPlugins;
    private dependencyCache;
    private sandboxGlobals;
    private defaultSecurityPolicy;
    constructor(defaultSecurityPolicy?: PluginSecurityPolicy);
    /**
     * Load a plugin from a manifest
     */
    loadFromManifest(manifest: PluginManifest, options?: PluginLoadOptions): Promise<PluginLoadResult>;
    /**
     * Load a plugin from a package
     */
    loadFromPackage(pluginPackage: PluginPackage, options?: PluginLoadOptions): Promise<PluginLoadResult>;
    /**
     * Load a plugin from a URL
     */
    loadFromURL(url: string, options?: PluginLoadOptions): Promise<PluginLoadResult>;
    /**
     * Unload a plugin
     */
    unload(pluginId: string): Promise<void>;
    /**
     * Get loaded plugin
     */
    getLoadedPlugin(pluginId: string): PluginLoadResult | null;
    /**
     * Get all loaded plugins
     */
    getAllLoadedPlugins(): PluginLoadResult[];
    /**
     * Validate a plugin manifest
     */
    validateManifest(manifest: PluginManifest): Promise<PluginValidationResult>;
    /**
     * Get plugin loader statistics
     */
    getStatistics(): {
        loadedPlugins: number;
        totalLoadTime: number;
        averageLoadTime: number;
        dependenciesInCache: number;
        sandboxedPlugins: number;
    };
    private createPluginInstance;
    private loadPluginScript;
    private createSandboxedContext;
    private createDirectContext;
    private executePluginScript;
    private validatePluginInstance;
    private requireModule;
    private checkDependencies;
    private loadDependencies;
    private cleanupUnusedDependencies;
    private enforceSecurityPolicy;
    private validateSecurity;
    private validateDependencies;
    private hasCircularDependencies;
    private isDependencyAvailable;
    private isValidVersion;
    private validatePackage;
    private extractPackageResources;
    private parsePackageData;
    private setupSandboxGlobals;
}
export {};
//# sourceMappingURL=plugin-loader.d.ts.map