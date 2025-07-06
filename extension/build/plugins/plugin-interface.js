/**
 * @fileoverview Core plugin interfaces and types for Web-Buddy plugin system
 * @description Defines the plugin architecture interfaces, types, and contracts
 */
/// <reference path="./chrome-types.d.ts" />
/**
 * Standard plugin events
 */
export const PluginEvents = {
    // Lifecycle events
    PLUGIN_LOADED: 'plugin:loaded',
    PLUGIN_INITIALIZED: 'plugin:initialized',
    PLUGIN_ACTIVATED: 'plugin:activated',
    PLUGIN_DEACTIVATED: 'plugin:deactivated',
    PLUGIN_DESTROYED: 'plugin:destroyed',
    PLUGIN_ERROR: 'plugin:error',
    // Contract events
    CONTRACT_DISCOVERED: 'contract:discovered',
    CONTRACT_REGISTERED: 'contract:registered',
    CONTRACT_EXECUTED: 'contract:executed',
    CONTRACT_FAILED: 'contract:failed',
    // Automation events
    AUTOMATION_STARTED: 'automation:started',
    AUTOMATION_COMPLETED: 'automation:completed',
    AUTOMATION_FAILED: 'automation:failed',
    // UI events
    UI_COMPONENT_MOUNTED: 'ui:component:mounted',
    UI_COMPONENT_UNMOUNTED: 'ui:component:unmounted',
    UI_INTERACTION: 'ui:interaction',
    // System events
    SYSTEM_READY: 'system:ready',
    SYSTEM_SHUTDOWN: 'system:shutdown',
    ERROR_OCCURRED: 'error:occurred'
};
/**
 * Plugin error types
 */
export class PluginError extends Error {
    constructor(message, pluginId, code, details) {
        super(message);
        this.pluginId = pluginId;
        this.code = code;
        this.details = details;
        this.name = 'PluginError';
    }
}
export class PluginLoadError extends PluginError {
    constructor(message, pluginId, details) {
        super(message, pluginId, 'PLUGIN_LOAD_ERROR', details);
        this.name = 'PluginLoadError';
    }
}
export class PluginInitializationError extends PluginError {
    constructor(message, pluginId, details) {
        super(message, pluginId, 'PLUGIN_INITIALIZATION_ERROR', details);
        this.name = 'PluginInitializationError';
    }
}
export class PluginExecutionError extends PluginError {
    constructor(message, pluginId, details) {
        super(message, pluginId, 'PLUGIN_EXECUTION_ERROR', details);
        this.name = 'PluginExecutionError';
    }
}
export class PluginSecurityError extends PluginError {
    constructor(message, pluginId, details) {
        super(message, pluginId, 'PLUGIN_SECURITY_ERROR', details);
        this.name = 'PluginSecurityError';
    }
}
export class PluginDependencyError extends PluginError {
    constructor(message, pluginId, details) {
        super(message, pluginId, 'PLUGIN_DEPENDENCY_ERROR', details);
        this.name = 'PluginDependencyError';
    }
}
