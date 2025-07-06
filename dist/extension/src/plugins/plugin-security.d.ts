/**
 * @fileoverview Plugin Security System for Web-Buddy plugin architecture
 * @description Implements security policies, permissions, sandboxing, and capability restrictions
 */
import { PluginSecurityPolicy, PluginManifest } from './plugin-interface';
/**
 * Permission types
 */
export declare enum PermissionType {
    STORAGE = "storage",
    TABS = "tabs",
    DOWNLOADS = "downloads",
    NOTIFICATIONS = "notifications",
    COOKIES = "cookies",
    HISTORY = "history",
    BOOKMARKS = "bookmarks",
    DEBUGGER = "debugger",
    MANAGEMENT = "management",
    PRIVACY = "privacy",
    PROXY = "proxy"
}
/**
 * API access levels
 */
export declare enum APIAccessLevel {
    NONE = "none",
    READ_ONLY = "read-only",
    LIMITED = "limited",
    FULL = "full",
    DANGEROUS = "dangerous"
}
/**
 * Security violation types
 */
export declare enum SecurityViolationType {
    UNAUTHORIZED_API_ACCESS = "unauthorized-api-access",
    PERMISSION_DENIED = "permission-denied",
    DOMAIN_RESTRICTION = "domain-restriction",
    RESOURCE_LIMIT_EXCEEDED = "resource-limit-exceeded",
    SANDBOX_ESCAPE_ATTEMPT = "sandbox-escape-attempt",
    MALICIOUS_BEHAVIOR = "malicious-behavior"
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
 * Plugin security manager
 */
export declare class PluginSecurityManager {
    private securityContexts;
    private globalViolations;
    private securityEventListeners;
    /**
     * Create security context for a plugin
     */
    createSecurityContext(pluginId: string, manifest: PluginManifest, customPolicy?: PluginSecurityPolicy): PluginSecurityContext;
    /**
     * Validate plugin permissions against security policy
     */
    validatePermissions(pluginId: string, requestedPermissions: string[]): {
        granted: string[];
        denied: string[];
        violations: SecurityViolation[];
    };
    /**
     * Check if a plugin can access a specific API
     */
    checkAPIAccess(pluginId: string, apiName: string): {
        allowed: boolean;
        accessLevel: APIAccessLevel;
        violation?: SecurityViolation;
    };
    /**
     * Check if a plugin can access a domain
     */
    checkDomainAccess(pluginId: string, domain: string): {
        allowed: boolean;
        violation?: SecurityViolation;
    };
    /**
     * Update resource usage for a plugin
     */
    updateResourceUsage(pluginId: string, usage: Partial<ResourceUsage>): void;
    /**
     * Check resource limits and create violations if exceeded
     */
    checkResourceLimits(pluginId: string): SecurityViolation[];
    /**
     * Create a sandbox configuration
     */
    createSandboxConfig(policy: PluginSecurityPolicy): SandboxConfig;
    /**
     * Execute code in a sandboxed environment
     */
    executeSandboxed(pluginId: string, code: string, context?: any): Promise<any>;
    /**
     * Get security violations for a plugin
     */
    getViolations(pluginId: string): SecurityViolation[];
    /**
     * Get all security violations
     */
    getAllViolations(): SecurityViolation[];
    /**
     * Get security statistics
     */
    getSecurityStatistics(): {
        totalPlugins: number;
        totalViolations: number;
        violationsBySeverity: {
            low: number;
            medium: number;
            high: number;
            critical: number;
        };
        violationsByType: Record<string, number>;
        pluginsWithViolations: number;
        sandboxedPlugins: number;
        trustedPlugins: number;
    };
    /**
     * Add security event listener
     */
    addEventListener(listener: (violation: SecurityViolation) => void): void;
    /**
     * Remove security event listener
     */
    removeEventListener(listener: (violation: SecurityViolation) => void): void;
    private determineSecurityPolicy;
    private isPermissionAllowed;
    private isAPIAccessAllowed;
    private isDomainAllowed;
    private trackAPIUsage;
    private createViolation;
    private recordViolation;
    private createSandboxGlobals;
    private executeWithRestrictions;
}
export {};
//# sourceMappingURL=plugin-security.d.ts.map