/**
 * @fileoverview Plugin Loader implementation for Web-Buddy plugin system
 * @description Handles dynamic plugin loading, validation, and sandboxing
 */

import {
  WebBuddyPlugin,
  PluginManifest,
  PluginPackage,
  PluginSecurityPolicy,
  PluginLoadError,
  PluginInitializationError,
  PluginSecurityError,
  PluginDependencyError,
  PluginError
} from './plugin-interface';

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
 * Plugin sandbox configuration
 */
interface PluginSandboxConfig {
  allowedGlobals: string[];
  allowedModules: string[];
  maxMemoryUsage?: number;
  maxExecutionTime?: number;
  restrictedAPIs: string[];
}

/**
 * Core plugin loader implementation
 */
export class PluginLoader {
  private loadedPlugins: Map<string, PluginLoadResult> = new Map();
  private dependencyCache: Map<string, any> = new Map();
  private sandboxGlobals: Map<string, any> = new Map();
  private defaultSecurityPolicy: PluginSecurityPolicy;

  constructor(defaultSecurityPolicy?: PluginSecurityPolicy) {
    this.defaultSecurityPolicy = defaultSecurityPolicy || {
      allowedDomains: ['*'],
      allowedPermissions: ['storage', 'tabs'],
      allowedAPIs: ['chrome.runtime', 'chrome.tabs', 'chrome.storage'],
      sandboxed: true,
      trustedSource: false,
      maxMemoryUsage: 10 * 1024 * 1024, // 10MB
      maxExecutionTime: 5000 // 5 seconds
    };

    this.setupSandboxGlobals();
  }

  /**
   * Load a plugin from a manifest
   */
  async loadFromManifest(manifest: PluginManifest, options: PluginLoadOptions = {}): Promise<PluginLoadResult> {
    const startTime = Date.now();
    const pluginId = manifest.metadata.id;

    try {
      console.log(`🔄 Loading plugin: ${pluginId}`);

      // Check if already loaded
      if (this.loadedPlugins.has(pluginId) && !options.allowReload) {
        throw new PluginLoadError(`Plugin ${pluginId} is already loaded`, pluginId);
      }

      // Validate manifest
      if (!options.skipValidation) {
        const validation = await this.validateManifest(manifest);
        if (!validation.valid) {
          throw new PluginLoadError(`Plugin validation failed: ${validation.errors.join(', ')}`, pluginId);
        }
      }

      // Check dependencies
      if (!options.skipDependencies) {
        await this.checkDependencies(manifest.dependencies || []);
      }

      // Apply security policy
      const securityPolicy = options.securityPolicy || this.defaultSecurityPolicy;
      await this.enforceSecurityPolicy(manifest, securityPolicy);

      // Load plugin dependencies
      const dependencies = await this.loadDependencies(manifest.dependencies || []);

      // Create plugin instance
      const plugin = await this.createPluginInstance(manifest, options);

      // Build result
      const loadResult: PluginLoadResult = {
        plugin,
        manifest,
        loadTime: Date.now() - startTime,
        warnings: [],
        dependencies: manifest.dependencies || []
      };

      // Cache the result
      this.loadedPlugins.set(pluginId, loadResult);

      console.log(`✅ Plugin loaded successfully: ${pluginId} (${loadResult.loadTime}ms)`);
      return loadResult;

    } catch (error) {
      const loadError = error instanceof PluginError ? error :
        new PluginLoadError(`Failed to load plugin ${pluginId}: ${(error as Error).message}`, pluginId, error);

      console.error(`❌ Plugin loading failed: ${pluginId}`, loadError);
      throw loadError;
    }
  }

  /**
   * Load a plugin from a package
   */
  async loadFromPackage(pluginPackage: PluginPackage, options: PluginLoadOptions = {}): Promise<PluginLoadResult> {
    try {
      // Validate package integrity
      await this.validatePackage(pluginPackage);

      // Extract scripts and resources
      await this.extractPackageResources(pluginPackage);

      // Load from the extracted manifest
      return this.loadFromManifest(pluginPackage.manifest, options);

    } catch (error) {
      throw new PluginLoadError(`Failed to load plugin package: ${(error as Error).message}`, 'unknown', error);
    }
  }

  /**
   * Load a plugin from a URL
   */
  async loadFromURL(url: string, options: PluginLoadOptions = {}): Promise<PluginLoadResult> {
    try {
      console.log(`🌐 Loading plugin from URL: ${url}`);

      // Fetch the plugin package
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const packageData = await response.json();
      const pluginPackage: PluginPackage = this.parsePackageData(packageData);

      return this.loadFromPackage(pluginPackage, options);

    } catch (error) {
      throw new PluginLoadError(`Failed to load plugin from URL ${url}: ${(error as Error).message}`, 'unknown', error);
    }
  }

  /**
   * Unload a plugin
   */
  async unload(pluginId: string): Promise<void> {
    const loadResult = this.loadedPlugins.get(pluginId);
    if (!loadResult) {
      throw new PluginError(`Plugin ${pluginId} is not loaded`, pluginId, 'PLUGIN_NOT_LOADED');
    }

    try {
      // Destroy the plugin instance
      if (typeof loadResult.plugin.destroy === 'function') {
        await loadResult.plugin.destroy();
      }

      // Clear from cache
      this.loadedPlugins.delete(pluginId);

      // Clean up dependencies if no other plugins use them
      await this.cleanupUnusedDependencies(loadResult.dependencies);

      console.log(`🗑️ Plugin unloaded: ${pluginId}`);

    } catch (error) {
      throw new PluginError(`Failed to unload plugin ${pluginId}: ${(error as Error).message}`, pluginId, 'UNLOAD_ERROR');
    }
  }

  /**
   * Get loaded plugin
   */
  getLoadedPlugin(pluginId: string): PluginLoadResult | null {
    return this.loadedPlugins.get(pluginId) || null;
  }

  /**
   * Get all loaded plugins
   */
  getAllLoadedPlugins(): PluginLoadResult[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Validate a plugin manifest
   */
  async validateManifest(manifest: PluginManifest): Promise<PluginValidationResult> {
    const result: PluginValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      securityIssues: []
    };

    try {
      // Validate metadata
      if (!manifest.metadata) {
        result.errors.push('Manifest missing metadata');
        result.valid = false;
      } else {
        if (!manifest.metadata.id || typeof manifest.metadata.id !== 'string') {
          result.errors.push('Plugin ID is required and must be a string');
          result.valid = false;
        }

        if (!manifest.metadata.name || typeof manifest.metadata.name !== 'string') {
          result.errors.push('Plugin name is required and must be a string');
          result.valid = false;
        }

        if (!manifest.metadata.version || typeof manifest.metadata.version !== 'string') {
          result.errors.push('Plugin version is required and must be a string');
          result.valid = false;
        }

        // Validate version format (semantic versioning)
        if (manifest.metadata.version && !this.isValidVersion(manifest.metadata.version)) {
          result.warnings.push('Plugin version should follow semantic versioning (e.g., 1.0.0)');
        }
      }

      // Validate capabilities
      if (!manifest.capabilities) {
        result.errors.push('Manifest missing capabilities');
        result.valid = false;
      } else {
        if (!Array.isArray(manifest.capabilities.supportedDomains)) {
          result.errors.push('Supported domains must be an array');
          result.valid = false;
        }

        if (!Array.isArray(manifest.capabilities.contractDefinitions)) {
          result.errors.push('Contract definitions must be an array');
          result.valid = false;
        }
      }

      // Validate entry point
      if (!manifest.entry) {
        result.errors.push('Manifest missing entry point');
        result.valid = false;
      } else {
        if (!manifest.entry.script || typeof manifest.entry.script !== 'string') {
          result.errors.push('Entry script is required and must be a string');
          result.valid = false;
        }
      }

      // Security validation
      await this.validateSecurity(manifest, result);

      // Dependency validation
      if (manifest.dependencies && manifest.dependencies.length > 0) {
        await this.validateDependencies(manifest.dependencies, result);
      }

    } catch (error) {
      result.errors.push(`Validation error: ${(error as Error).message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Get plugin loader statistics
   */
  getStatistics() {
    const stats = {
      loadedPlugins: this.loadedPlugins.size,
      totalLoadTime: 0,
      averageLoadTime: 0,
      dependenciesInCache: this.dependencyCache.size,
      sandboxedPlugins: 0
    };

    const loadTimes: number[] = [];
    for (const result of this.loadedPlugins.values()) {
      loadTimes.push(result.loadTime);
      stats.totalLoadTime += result.loadTime;
    }

    if (loadTimes.length > 0) {
      stats.averageLoadTime = stats.totalLoadTime / loadTimes.length;
    }

    return stats;
  }

  // Private helper methods

  private async createPluginInstance(manifest: PluginManifest, options: PluginLoadOptions): Promise<WebBuddyPlugin> {
    const { entry } = manifest;
    const pluginId = manifest.metadata.id;

    try {
      // Load the plugin script
      const script = await this.loadPluginScript(entry.script);

      // Create execution context
      const context = options.sandboxed !== false ?
        this.createSandboxedContext(pluginId, script, options) :
        this.createDirectContext(pluginId, script, options);

      // Execute the plugin script in the context
      const PluginClass = await this.executePluginScript(context, entry);

      // Create and validate plugin instance
      const plugin = new PluginClass();
      await this.validatePluginInstance(plugin, manifest);

      return plugin;

    } catch (error) {
      throw new PluginInitializationError(
        `Failed to create plugin instance for ${pluginId}: ${(error as Error).message}`,
        pluginId,
        error
      );
    }
  }

  private async loadPluginScript(scriptPath: string): Promise<string> {
    // In a real implementation, this would fetch the script from the extension's resources
    // For now, we'll return a placeholder
    throw new PluginLoadError('Plugin script loading not implemented', 'unknown');
  }

  private createSandboxedContext(pluginId: string, script: string, options: PluginLoadOptions): any {
    // Create a sandboxed execution context
    const sandboxConfig: PluginSandboxConfig = {
      allowedGlobals: ['console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
      allowedModules: ['plugin-interface'],
      maxMemoryUsage: options.securityPolicy?.maxMemoryUsage,
      maxExecutionTime: options.securityPolicy?.maxExecutionTime,
      restrictedAPIs: ['eval', 'Function', 'document', 'window']
    };

    // Create a restricted global context
    const sandbox = {
      console: {
        log: (...args: any[]) => console.log(`[${pluginId}]`, ...args),
        error: (...args: any[]) => console.error(`[${pluginId}]`, ...args),
        warn: (...args: any[]) => console.warn(`[${pluginId}]`, ...args),
        debug: (...args: any[]) => console.debug(`[${pluginId}]`, ...args)
      },
      setTimeout: (callback: Function, delay: number) => setTimeout(callback, delay),
      clearTimeout: (id: number) => clearTimeout(id),
      setInterval: (callback: Function, delay: number) => setInterval(callback, delay),
      clearInterval: (id: number) => clearInterval(id),
      require: (moduleName: string) => this.requireModule(moduleName, sandboxConfig),
      exports: {},
      module: { exports: {} }
    };

    return sandbox;
  }

  private createDirectContext(pluginId: string, script: string, options: PluginLoadOptions): any {
    // Create a direct execution context (less secure but more performant)
    return {
      console: console,
      require: (moduleName: string) => this.requireModule(moduleName),
      exports: {},
      module: { exports: {} }
    };
  }

  private async executePluginScript(context: any, entry: PluginManifest['entry']): Promise<any> {
    // This is a simplified implementation
    // In a real scenario, you'd use a proper JavaScript execution environment
    
    try {
      // Create a function that executes the plugin script in the given context
      const scriptFunction = new Function(
        'console', 'require', 'exports', 'module',
        `
        // Plugin script would be executed here
        // For now, we'll return a mock plugin class
        return class MockPlugin {
          constructor() {
            this.id = 'mock-plugin';
            this.name = 'Mock Plugin';
            this.version = '1.0.0';
            this.description = 'Mock plugin for testing';
            this.author = 'System';
            this.metadata = { id: this.id, name: this.name, version: this.version, description: this.description, author: this.author };
            this.capabilities = { supportedDomains: [], contractDefinitions: [], permissions: [], requiredAPIs: [] };
            this.state = 'uninitialized';
          }
          
          async initialize(context) { this.state = 'initialized'; }
          async activate() { this.state = 'active'; }
          async deactivate() { this.state = 'inactive'; }
          async destroy() { this.state = 'destroyed'; }
          getContracts() { return []; }
          async executeCapability(capability, params) { return { success: true }; }
          async validateCapability(capability, params) { return { valid: true, errors: [] }; }
          getUIComponents() { return []; }
          getMenuItems() { return []; }
          async onEvent(event) { }
          getDefaultConfig() { return { enabled: true, settings: {}, domains: [], permissions: [], uiPreferences: {} }; }
          async onConfigChange(config) { }
          async healthCheck() { return { healthy: true, issues: [] }; }
          async getMetrics() { return {}; }
        };
        `
      );

      const PluginClass = scriptFunction(
        context.console,
        context.require,
        context.exports,
        context.module
      );

      return PluginClass;

    } catch (error) {
      throw new PluginExecutionError(
        `Failed to execute plugin script: ${(error as Error).message}`,
        'unknown',
        error
      );
    }
  }

  private async validatePluginInstance(plugin: WebBuddyPlugin, manifest: PluginManifest): Promise<void> {
    // Validate that the plugin instance matches the manifest
    if (plugin.id !== manifest.metadata.id) {
      throw new PluginValidationError(
        `Plugin ID mismatch: expected ${manifest.metadata.id}, got ${plugin.id}`,
        plugin.id
      );
    }

    if (plugin.version !== manifest.metadata.version) {
      throw new PluginValidationError(
        `Plugin version mismatch: expected ${manifest.metadata.version}, got ${plugin.version}`,
        plugin.id
      );
    }

    // Validate required methods exist
    const requiredMethods = [
      'initialize', 'activate', 'deactivate', 'destroy',
      'getContracts', 'executeCapability', 'validateCapability',
      'getUIComponents', 'getMenuItems', 'onEvent',
      'getDefaultConfig', 'onConfigChange', 'healthCheck', 'getMetrics'
    ];

    for (const method of requiredMethods) {
      if (typeof (plugin as any)[method] !== 'function') {
        throw new PluginValidationError(
          `Plugin missing required method: ${method}`,
          plugin.id
        );
      }
    }
  }

  private requireModule(moduleName: string, sandboxConfig?: PluginSandboxConfig): any {
    // Implement module loading with security restrictions
    if (sandboxConfig && !sandboxConfig.allowedModules.includes(moduleName)) {
      throw new PluginSecurityError(
        `Module ${moduleName} is not allowed in sandbox`,
        'unknown',
        'MODULE_NOT_ALLOWED'
      );
    }

    // Return cached dependency if available
    if (this.dependencyCache.has(moduleName)) {
      return this.dependencyCache.get(moduleName);
    }

    // Mock module loading - in reality, this would load actual modules
    switch (moduleName) {
      case 'plugin-interface':
        return require('./plugin-interface');
      default:
        throw new Error(`Module not found: ${moduleName}`);
    }
  }

  private async checkDependencies(dependencies: string[]): Promise<void> {
    for (const depId of dependencies) {
      if (!this.loadedPlugins.has(depId)) {
        throw new PluginDependencyError(`Required dependency ${depId} is not loaded`, depId);
      }
    }
  }

  private async loadDependencies(dependencies: string[]): Promise<string[]> {
    const loadedDeps: string[] = [];
    
    for (const depId of dependencies) {
      if (!this.dependencyCache.has(depId)) {
        // In a real implementation, this would load the actual dependency
        this.dependencyCache.set(depId, { id: depId, loaded: true });
      }
      loadedDeps.push(depId);
    }
    
    return loadedDeps;
  }

  private async cleanupUnusedDependencies(dependencies: string[]): Promise<void> {
    for (const depId of dependencies) {
      // Check if any other loaded plugins still use this dependency
      const stillInUse = Array.from(this.loadedPlugins.values())
        .some(result => result.dependencies.includes(depId));
      
      if (!stillInUse) {
        this.dependencyCache.delete(depId);
      }
    }
  }

  private async enforceSecurityPolicy(manifest: PluginManifest, policy: PluginSecurityPolicy): Promise<void> {
    // Validate domain restrictions
    if (policy.allowedDomains && policy.allowedDomains.length > 0 && !policy.allowedDomains.includes('*')) {
      const supportedDomains = manifest.capabilities.supportedDomains;
      for (const domain of supportedDomains) {
        if (!policy.allowedDomains.some(allowed => domain.match(new RegExp(allowed.replace(/\*/g, '.*'))))) {
          throw new PluginSecurityError(
            `Domain ${domain} is not allowed by security policy`,
            manifest.metadata.id,
            'DOMAIN_NOT_ALLOWED'
          );
        }
      }
    }

    // Validate permissions
    if (policy.allowedPermissions && policy.allowedPermissions.length > 0) {
      const requestedPermissions = manifest.capabilities.permissions || [];
      for (const permission of requestedPermissions) {
        if (!policy.allowedPermissions.includes(permission)) {
          throw new PluginSecurityError(
            `Permission ${permission} is not allowed by security policy`,
            manifest.metadata.id,
            'PERMISSION_NOT_ALLOWED'
          );
        }
      }
    }

    // Validate API access
    if (policy.allowedAPIs && policy.allowedAPIs.length > 0) {
      const requiredAPIs = manifest.capabilities.requiredAPIs || [];
      for (const api of requiredAPIs) {
        if (!policy.allowedAPIs.includes(api)) {
          throw new PluginSecurityError(
            `API ${api} is not allowed by security policy`,
            manifest.metadata.id,
            'API_NOT_ALLOWED'
          );
        }
      }
    }
  }

  private async validateSecurity(manifest: PluginManifest, result: PluginValidationResult): Promise<void> {
    // Check for suspicious permissions
    const suspiciousPermissions = ['debugger', 'management', 'privacy', 'proxy'];
    const requestedPermissions = manifest.capabilities.permissions || [];
    
    for (const permission of requestedPermissions) {
      if (suspiciousPermissions.includes(permission)) {
        result.securityIssues.push(`Suspicious permission requested: ${permission}`);
      }
    }

    // Check for overly broad domain access
    const supportedDomains = manifest.capabilities.supportedDomains || [];
    if (supportedDomains.includes('*') || supportedDomains.includes('<all_urls>')) {
      result.securityIssues.push('Plugin requests access to all domains');
    }

    // Check for dangerous APIs
    const dangerousAPIs = ['chrome.debugger', 'chrome.management', 'chrome.privacy'];
    const requiredAPIs = manifest.capabilities.requiredAPIs || [];
    
    for (const api of requiredAPIs) {
      if (dangerousAPIs.includes(api)) {
        result.securityIssues.push(`Dangerous API requested: ${api}`);
      }
    }
  }

  private async validateDependencies(dependencies: string[], result: PluginValidationResult): Promise<void> {
    // Check for circular dependencies
    const dependencyGraph = new Map<string, string[]>();
    dependencyGraph.set('current', dependencies);
    
    if (this.hasCircularDependencies(dependencyGraph, 'current', new Set())) {
      result.errors.push('Circular dependency detected');
      result.valid = false;
    }

    // Validate dependency availability
    for (const depId of dependencies) {
      if (!this.isDependencyAvailable(depId)) {
        result.warnings.push(`Dependency ${depId} may not be available`);
      }
    }
  }

  private hasCircularDependencies(graph: Map<string, string[]>, node: string, visited: Set<string>): boolean {
    if (visited.has(node)) {
      return true;
    }

    visited.add(node);
    const deps = graph.get(node) || [];
    
    for (const dep of deps) {
      if (this.hasCircularDependencies(graph, dep, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  private isDependencyAvailable(dependencyId: string): boolean {
    // Check if dependency is available in the system
    return this.loadedPlugins.has(dependencyId) || this.dependencyCache.has(dependencyId);
  }

  private isValidVersion(version: string): boolean {
    // Simplified semantic version validation
    const semverRegex = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9-]+)?(?:\+[a-zA-Z0-9-]+)?$/;
    return semverRegex.test(version);
  }

  private async validatePackage(pluginPackage: PluginPackage): Promise<void> {
    // Validate package integrity
    if (pluginPackage.checksum) {
      // Verify checksum
      // Implementation would depend on the checksum algorithm used
    }

    if (pluginPackage.signature) {
      // Verify digital signature
      // Implementation would depend on the signing algorithm used
    }
  }

  private async extractPackageResources(pluginPackage: PluginPackage): Promise<void> {
    // Extract and prepare package resources
    // This would typically involve extracting scripts and resources to a temporary location
  }

  private parsePackageData(packageData: any): PluginPackage {
    // Parse and validate package data format
    if (!packageData.manifest) {
      throw new Error('Package missing manifest');
    }

    return {
      manifest: packageData.manifest,
      scripts: packageData.scripts || {},
      resources: packageData.resources || {},
      signature: packageData.signature,
      checksum: packageData.checksum
    };
  }

  private setupSandboxGlobals(): void {
    // Setup global objects available in the sandbox
    this.sandboxGlobals.set('console', console);
    this.sandboxGlobals.set('setTimeout', setTimeout);
    this.sandboxGlobals.set('clearTimeout', clearTimeout);
    this.sandboxGlobals.set('setInterval', setInterval);
    this.sandboxGlobals.set('clearInterval', clearInterval);
  }
}

// Plugin error classes
class PluginValidationError extends PluginError {
  constructor(message: string, pluginId: string, details?: any) {
    super(message, pluginId, 'PLUGIN_VALIDATION_ERROR', details);
    this.name = 'PluginValidationError';
  }
}

class PluginExecutionError extends PluginError {
  constructor(message: string, pluginId: string, details?: any) {
    super(message, pluginId, 'PLUGIN_EXECUTION_ERROR', details);
    this.name = 'PluginExecutionError';
  }
}