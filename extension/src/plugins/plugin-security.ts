/**
 * @fileoverview Plugin Security System for Web-Buddy plugin architecture
 * @description Implements security policies, permissions, sandboxing, and capability restrictions
 */

import {
  PluginSecurityPolicy,
  PluginManifest,
  PluginError,
  PluginSecurityError
} from './plugin-interface';

/**
 * Permission types
 */
export enum PermissionType {
  STORAGE = 'storage',
  TABS = 'tabs',
  DOWNLOADS = 'downloads',
  NOTIFICATIONS = 'notifications',
  COOKIES = 'cookies',
  HISTORY = 'history',
  BOOKMARKS = 'bookmarks',
  DEBUGGER = 'debugger',
  MANAGEMENT = 'management',
  PRIVACY = 'privacy',
  PROXY = 'proxy'
}

/**
 * API access levels
 */
export enum APIAccessLevel {
  NONE = 'none',
  READ_ONLY = 'read-only',
  LIMITED = 'limited',
  FULL = 'full',
  DANGEROUS = 'dangerous'
}

/**
 * Security violation types
 */
export enum SecurityViolationType {
  UNAUTHORIZED_API_ACCESS = 'unauthorized-api-access',
  PERMISSION_DENIED = 'permission-denied',
  DOMAIN_RESTRICTION = 'domain-restriction',
  RESOURCE_LIMIT_EXCEEDED = 'resource-limit-exceeded',
  SANDBOX_ESCAPE_ATTEMPT = 'sandbox-escape-attempt',
  MALICIOUS_BEHAVIOR = 'malicious-behavior'
}

/**
 * Security violation record
 */
interface SecurityViolation {
  id: string;
  pluginId: string;
  type: SecurityViolationType;
  description: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: any;
  blocked: boolean;
}

/**
 * Resource usage tracking
 */
interface ResourceUsage {
  memoryUsage: number;
  cpuTime: number;
  networkRequests: number;
  storageUsage: number;
  apiCalls: Record<string, number>;
  lastUpdated: Date;
}

/**
 * Sandbox configuration
 */
interface SandboxConfig {
  allowedGlobals: string[];
  allowedModules: string[];
  restrictedAPIs: string[];
  resourceLimits: {
    maxMemoryUsage: number;
    maxExecutionTime: number;
    maxNetworkRequests: number;
    maxStorageSize: number;
  };
  cspDirectives: string[];
}

/**
 * Plugin security context
 */
interface PluginSecurityContext {
  pluginId: string;
  policy: PluginSecurityPolicy;
  resourceUsage: ResourceUsage;
  violations: SecurityViolation[];
  sandbox?: SandboxConfig;
  lastSecurityCheck: Date;
}

/**
 * Default security policies for different trust levels
 */
const DEFAULT_SECURITY_POLICIES: Record<string, PluginSecurityPolicy> = {
  untrusted: {
    allowedDomains: [],
    allowedPermissions: [PermissionType.STORAGE],
    allowedAPIs: ['chrome.storage.local'],
    sandboxed: true,
    trustedSource: false,
    maxMemoryUsage: 5 * 1024 * 1024, // 5MB
    maxExecutionTime: 3000 // 3 seconds
  },
  limited: {
    allowedDomains: ['*'],
    allowedPermissions: [PermissionType.STORAGE, PermissionType.TABS],
    allowedAPIs: ['chrome.storage', 'chrome.tabs'],
    sandboxed: true,
    trustedSource: false,
    maxMemoryUsage: 10 * 1024 * 1024, // 10MB
    maxExecutionTime: 5000 // 5 seconds
  },
  trusted: {
    allowedDomains: ['*'],
    allowedPermissions: [PermissionType.STORAGE, PermissionType.TABS, PermissionType.DOWNLOADS, PermissionType.NOTIFICATIONS],
    allowedAPIs: ['chrome.storage', 'chrome.tabs', 'chrome.downloads', 'chrome.notifications'],
    sandboxed: false,
    trustedSource: true,
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    maxExecutionTime: 15000 // 15 seconds
  },
  system: {
    allowedDomains: ['*'],
    allowedPermissions: Object.values(PermissionType),
    allowedAPIs: ['*'],
    sandboxed: false,
    trustedSource: true,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxExecutionTime: 30000 // 30 seconds
  }
};

/**
 * Plugin security manager
 */
export class PluginSecurityManager {
  private securityContexts: Map<string, PluginSecurityContext> = new Map();
  private globalViolations: SecurityViolation[] = [];
  private securityEventListeners: Set<(violation: SecurityViolation) => void> = new Set();

  /**
   * Create security context for a plugin
   */
  createSecurityContext(
    pluginId: string,
    manifest: PluginManifest,
    customPolicy?: PluginSecurityPolicy
  ): PluginSecurityContext {
    const policy = customPolicy || this.determineSecurityPolicy(manifest);
    
    const context: PluginSecurityContext = {
      pluginId,
      policy,
      resourceUsage: {
        memoryUsage: 0,
        cpuTime: 0,
        networkRequests: 0,
        storageUsage: 0,
        apiCalls: {},
        lastUpdated: new Date()
      },
      violations: [],
      lastSecurityCheck: new Date()
    };

    if (policy.sandboxed) {
      context.sandbox = this.createSandboxConfig(policy);
    }

    this.securityContexts.set(pluginId, context);
    return context;
  }

  /**
   * Validate plugin permissions against security policy
   */
  validatePermissions(pluginId: string, requestedPermissions: string[]): {
    granted: string[];
    denied: string[];
    violations: SecurityViolation[];
  } {
    const context = this.securityContexts.get(pluginId);
    if (!context) {
      throw new PluginSecurityError(
        `No security context found for plugin: ${pluginId}`,
        pluginId,
        'NO_SECURITY_CONTEXT'
      );
    }

    const granted: string[] = [];
    const denied: string[] = [];
    const violations: SecurityViolation[] = [];

    for (const permission of requestedPermissions) {
      if (this.isPermissionAllowed(context.policy, permission)) {
        granted.push(permission);
      } else {
        denied.push(permission);
        
        const violation = this.createViolation(
          pluginId,
          SecurityViolationType.PERMISSION_DENIED,
          `Permission denied: ${permission}`,
          'medium',
          { permission, requestedPermissions },
          true
        );
        
        violations.push(violation);
        this.recordViolation(pluginId, violation);
      }
    }

    return { granted, denied, violations };
  }

  /**
   * Check if a plugin can access a specific API
   */
  checkAPIAccess(pluginId: string, apiName: string): {
    allowed: boolean;
    accessLevel: APIAccessLevel;
    violation?: SecurityViolation;
  } {
    const context = this.securityContexts.get(pluginId);
    if (!context) {
      throw new PluginSecurityError(
        `No security context found for plugin: ${pluginId}`,
        pluginId,
        'NO_SECURITY_CONTEXT'
      );
    }

    const { allowed, accessLevel } = this.isAPIAccessAllowed(context.policy, apiName);
    
    if (!allowed) {
      const violation = this.createViolation(
        pluginId,
        SecurityViolationType.UNAUTHORIZED_API_ACCESS,
        `Unauthorized API access: ${apiName}`,
        'high',
        { apiName },
        true
      );
      
      this.recordViolation(pluginId, violation);
      return { allowed: false, accessLevel: APIAccessLevel.NONE, violation };
    }

    // Track API usage
    this.trackAPIUsage(pluginId, apiName);

    return { allowed: true, accessLevel };
  }

  /**
   * Check if a plugin can access a domain
   */
  checkDomainAccess(pluginId: string, domain: string): {
    allowed: boolean;
    violation?: SecurityViolation;
  } {
    const context = this.securityContexts.get(pluginId);
    if (!context) {
      throw new PluginSecurityError(
        `No security context found for plugin: ${pluginId}`,
        pluginId,
        'NO_SECURITY_CONTEXT'
      );
    }

    const allowed = this.isDomainAllowed(context.policy, domain);
    
    if (!allowed) {
      const violation = this.createViolation(
        pluginId,
        SecurityViolationType.DOMAIN_RESTRICTION,
        `Domain access denied: ${domain}`,
        'medium',
        { domain },
        true
      );
      
      this.recordViolation(pluginId, violation);
      return { allowed: false, violation };
    }

    return { allowed: true };
  }

  /**
   * Update resource usage for a plugin
   */
  updateResourceUsage(pluginId: string, usage: Partial<ResourceUsage>): void {
    const context = this.securityContexts.get(pluginId);
    if (!context) {
      return;
    }

    const currentUsage = context.resourceUsage;
    context.resourceUsage = {
      ...currentUsage,
      ...usage,
      lastUpdated: new Date()
    };

    // Check resource limits
    this.checkResourceLimits(pluginId);
  }

  /**
   * Check resource limits and create violations if exceeded
   */
  checkResourceLimits(pluginId: string): SecurityViolation[] {
    const context = this.securityContexts.get(pluginId);
    if (!context) {
      return [];
    }

    const violations: SecurityViolation[] = [];
    const { policy, resourceUsage } = context;

    // Check memory usage
    if (policy.maxMemoryUsage && resourceUsage.memoryUsage > policy.maxMemoryUsage) {
      const violation = this.createViolation(
        pluginId,
        SecurityViolationType.RESOURCE_LIMIT_EXCEEDED,
        `Memory usage exceeded: ${resourceUsage.memoryUsage} > ${policy.maxMemoryUsage}`,
        'high',
        { limit: policy.maxMemoryUsage, actual: resourceUsage.memoryUsage, type: 'memory' },
        true
      );
      violations.push(violation);
      this.recordViolation(pluginId, violation);
    }

    // Check execution time (this would need to be tracked separately)
    if (policy.maxExecutionTime && resourceUsage.cpuTime > policy.maxExecutionTime) {
      const violation = this.createViolation(
        pluginId,
        SecurityViolationType.RESOURCE_LIMIT_EXCEEDED,
        `Execution time exceeded: ${resourceUsage.cpuTime} > ${policy.maxExecutionTime}`,
        'high',
        { limit: policy.maxExecutionTime, actual: resourceUsage.cpuTime, type: 'execution-time' },
        true
      );
      violations.push(violation);
      this.recordViolation(pluginId, violation);
    }

    return violations;
  }

  /**
   * Create a sandbox configuration
   */
  createSandboxConfig(policy: PluginSecurityPolicy): SandboxConfig {
    return {
      allowedGlobals: [
        'console',
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'Date',
        'JSON',
        'Math',
        'parseInt',
        'parseFloat',
        'encodeURIComponent',
        'decodeURIComponent'
      ],
      allowedModules: ['plugin-interface'],
      restrictedAPIs: [
        'eval',
        'Function',
        'document',
        'window',
        'location',
        'XMLHttpRequest',
        'fetch'
      ],
      resourceLimits: {
        maxMemoryUsage: policy.maxMemoryUsage || 10 * 1024 * 1024,
        maxExecutionTime: policy.maxExecutionTime || 5000,
        maxNetworkRequests: 100,
        maxStorageSize: 5 * 1024 * 1024
      },
      cspDirectives: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval'",
        "connect-src 'self'",
        "img-src 'self' data:",
        "style-src 'self' 'unsafe-inline'"
      ]
    };
  }

  /**
   * Execute code in a sandboxed environment
   */
  executeSandboxed(pluginId: string, code: string, context: any = {}): Promise<any> {
    const securityContext = this.securityContexts.get(pluginId);
    if (!securityContext) {
      throw new PluginSecurityError(
        `No security context found for plugin: ${pluginId}`,
        pluginId,
        'NO_SECURITY_CONTEXT'
      );
    }

    if (!securityContext.sandbox) {
      throw new PluginSecurityError(
        `Plugin ${pluginId} is not configured for sandboxed execution`,
        pluginId,
        'NO_SANDBOX_CONFIG'
      );
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Create execution timeout
      const timeout = setTimeout(() => {
        const violation = this.createViolation(
          pluginId,
          SecurityViolationType.RESOURCE_LIMIT_EXCEEDED,
          'Sandboxed execution timeout',
          'high',
          { maxExecutionTime: securityContext.sandbox!.resourceLimits.maxExecutionTime },
          true
        );
        this.recordViolation(pluginId, violation);
        reject(new PluginSecurityError('Execution timeout', pluginId, 'EXECUTION_TIMEOUT'));
      }, securityContext.sandbox.resourceLimits.maxExecutionTime);

      try {
        // Create restricted global scope
        const sandboxGlobals = this.createSandboxGlobals(securityContext.sandbox, context);
        
        // Execute code with restricted globals
        const result = this.executeWithRestrictions(code, sandboxGlobals);
        
        clearTimeout(timeout);
        
        // Update resource usage
        const executionTime = Date.now() - startTime;
        this.updateResourceUsage(pluginId, {
          cpuTime: securityContext.resourceUsage.cpuTime + executionTime
        });
        
        resolve(result);
        
      } catch (error) {
        clearTimeout(timeout);
        
        const violation = this.createViolation(
          pluginId,
          SecurityViolationType.SANDBOX_ESCAPE_ATTEMPT,
          `Sandbox execution error: ${(error as Error).message}`,
          'critical',
          { error: (error as Error).message, code: code.substring(0, 100) },
          true
        );
        this.recordViolation(pluginId, violation);
        
        reject(new PluginSecurityError(
          `Sandboxed execution failed: ${(error as Error).message}`,
          pluginId,
          'SANDBOX_EXECUTION_ERROR',
          error
        ));
      }
    });
  }

  /**
   * Get security violations for a plugin
   */
  getViolations(pluginId: string): SecurityViolation[] {
    const context = this.securityContexts.get(pluginId);
    return context ? [...context.violations] : [];
  }

  /**
   * Get all security violations
   */
  getAllViolations(): SecurityViolation[] {
    return [...this.globalViolations];
  }

  /**
   * Get security statistics
   */
  getSecurityStatistics() {
    const stats = {
      totalPlugins: this.securityContexts.size,
      totalViolations: this.globalViolations.length,
      violationsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      violationsByType: {} as Record<string, number>,
      pluginsWithViolations: 0,
      sandboxedPlugins: 0,
      trustedPlugins: 0
    };

    for (const violation of this.globalViolations) {
      stats.violationsBySeverity[violation.severity]++;
      stats.violationsByType[violation.type] = (stats.violationsByType[violation.type] || 0) + 1;
    }

    for (const context of this.securityContexts.values()) {
      if (context.violations.length > 0) {
        stats.pluginsWithViolations++;
      }
      if (context.policy.sandboxed) {
        stats.sandboxedPlugins++;
      }
      if (context.policy.trustedSource) {
        stats.trustedPlugins++;
      }
    }

    return stats;
  }

  /**
   * Add security event listener
   */
  addEventListener(listener: (violation: SecurityViolation) => void): void {
    this.securityEventListeners.add(listener);
  }

  /**
   * Remove security event listener
   */
  removeEventListener(listener: (violation: SecurityViolation) => void): void {
    this.securityEventListeners.delete(listener);
  }

  // Private helper methods

  private determineSecurityPolicy(manifest: PluginManifest): PluginSecurityPolicy {
    // Simple trust determination based on manifest properties
    if (manifest.metadata.author === 'system' || manifest.metadata.id.startsWith('system-')) {
      return DEFAULT_SECURITY_POLICIES.system;
    }

    // Check for dangerous permissions
    const dangerousPermissions = [PermissionType.DEBUGGER, PermissionType.MANAGEMENT, PermissionType.PRIVACY];
    const hasDangerousPermissions = manifest.capabilities.permissions.some(p => 
      dangerousPermissions.includes(p as PermissionType)
    );

    if (hasDangerousPermissions) {
      return DEFAULT_SECURITY_POLICIES.untrusted;
    }

    // Check for broad domain access
    const hasBroadAccess = manifest.capabilities.supportedDomains.includes('*') ||
      manifest.capabilities.supportedDomains.includes('<all_urls>');

    if (hasBroadAccess) {
      return DEFAULT_SECURITY_POLICIES.limited;
    }

    return DEFAULT_SECURITY_POLICIES.trusted;
  }

  private isPermissionAllowed(policy: PluginSecurityPolicy, permission: string): boolean {
    return policy.allowedPermissions.includes(permission);
  }

  private isAPIAccessAllowed(policy: PluginSecurityPolicy, apiName: string): {
    allowed: boolean;
    accessLevel: APIAccessLevel;
  } {
    // Check if API is explicitly allowed
    if (policy.allowedAPIs.includes('*') || policy.allowedAPIs.includes(apiName)) {
      return { allowed: true, accessLevel: APIAccessLevel.FULL };
    }

    // Check for pattern matches
    for (const allowedAPI of policy.allowedAPIs) {
      if (allowedAPI.endsWith('*') && apiName.startsWith(allowedAPI.slice(0, -1))) {
        return { allowed: true, accessLevel: APIAccessLevel.LIMITED };
      }
    }

    // Check for dangerous APIs
    const dangerousAPIs = ['chrome.debugger', 'chrome.management', 'chrome.privacy'];
    if (dangerousAPIs.includes(apiName)) {
      return { allowed: false, accessLevel: APIAccessLevel.DANGEROUS };
    }

    return { allowed: false, accessLevel: APIAccessLevel.NONE };
  }

  private isDomainAllowed(policy: PluginSecurityPolicy, domain: string): boolean {
    if (policy.allowedDomains.includes('*') || policy.allowedDomains.includes('<all_urls>')) {
      return true;
    }

    for (const allowedDomain of policy.allowedDomains) {
      if (allowedDomain === domain) {
        return true;
      }
      
      // Check wildcard patterns
      if (allowedDomain.includes('*')) {
        const pattern = new RegExp(allowedDomain.replace(/\*/g, '.*'));
        if (pattern.test(domain)) {
          return true;
        }
      }
    }

    return false;
  }

  private trackAPIUsage(pluginId: string, apiName: string): void {
    const context = this.securityContexts.get(pluginId);
    if (context) {
      const currentCount = context.resourceUsage.apiCalls[apiName] || 0;
      context.resourceUsage.apiCalls[apiName] = currentCount + 1;
      context.resourceUsage.lastUpdated = new Date();
    }
  }

  private createViolation(
    pluginId: string,
    type: SecurityViolationType,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context: any,
    blocked: boolean
  ): SecurityViolation {
    return {
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pluginId,
      type,
      description,
      timestamp: new Date(),
      severity,
      context,
      blocked
    };
  }

  private recordViolation(pluginId: string, violation: SecurityViolation): void {
    // Add to plugin-specific violations
    const context = this.securityContexts.get(pluginId);
    if (context) {
      context.violations.push(violation);
    }

    // Add to global violations
    this.globalViolations.push(violation);

    // Emit security event
    for (const listener of this.securityEventListeners) {
      try {
        listener(violation);
      } catch (error) {
        console.error('Error in security event listener:', error);
      }
    }

    console.warn(`Security violation in plugin ${pluginId}:`, violation);
  }

  private createSandboxGlobals(sandboxConfig: SandboxConfig, userContext: any): any {
    const globals: any = {};

    // Add allowed globals
    for (const globalName of sandboxConfig.allowedGlobals) {
      switch (globalName) {
        case 'console':
          globals.console = {
            log: (...args: any[]) => console.log(`[SANDBOX]`, ...args),
            error: (...args: any[]) => console.error(`[SANDBOX]`, ...args),
            warn: (...args: any[]) => console.warn(`[SANDBOX]`, ...args),
            debug: (...args: any[]) => console.debug(`[SANDBOX]`, ...args)
          };
          break;
        case 'setTimeout':
          globals.setTimeout = (callback: Function, delay: number) => {
            const limitedDelay = Math.min(delay, sandboxConfig.resourceLimits.maxExecutionTime);
            return setTimeout(callback, limitedDelay);
          };
          break;
        case 'clearTimeout':
          globals.clearTimeout = clearTimeout;
          break;
        case 'setInterval':
          globals.setInterval = (callback: Function, delay: number) => {
            const limitedDelay = Math.min(delay, 1000); // Minimum 1 second
            return setInterval(callback, limitedDelay);
          };
          break;
        case 'clearInterval':
          globals.clearInterval = clearInterval;
          break;
        default:
          if (typeof (globalThis as any)[globalName] !== 'undefined') {
            globals[globalName] = (globalThis as any)[globalName];
          }
          break;
      }
    }

    // Add user context
    Object.assign(globals, userContext);

    return globals;
  }

  private executeWithRestrictions(code: string, globals: any): any {
    // This is a simplified sandbox implementation
    // In a production environment, you'd want to use a more robust sandboxing solution
    const globalNames = Object.keys(globals);
    const globalValues = Object.values(globals);

    const wrappedCode = `
      'use strict';
      return (function(${globalNames.join(', ')}) {
        ${code}
      }).apply(null, arguments);
    `;

    const func = new Function(wrappedCode);
    return func.apply(null, globalValues);
  }
}