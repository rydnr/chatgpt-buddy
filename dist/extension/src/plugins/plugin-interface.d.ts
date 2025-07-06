/**
 * @fileoverview Core plugin interfaces and types for Web-Buddy plugin system
 * @description Defines the plugin architecture interfaces, types, and contracts
 */
/**
 * Plugin metadata and identification
 */
export interface PluginMetadata {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    license?: string;
    homepage?: string;
    repository?: string;
}
/**
 * Plugin domain and capability specification
 */
export interface PluginCapabilities {
    supportedDomains: string[];
    contractDefinitions: WebBuddyContract[];
    permissions: string[];
    requiredAPIs: string[];
}
/**
 * Plugin lifecycle states
 */
export type PluginState = 'uninitialized' | 'initialized' | 'active' | 'inactive' | 'error' | 'destroyed';
/**
 * Plugin lifecycle events
 */
export interface PluginLifecycleEvent {
    type: 'initialize' | 'activate' | 'deactivate' | 'destroy' | 'error';
    pluginId: string;
    timestamp: string;
    data?: any;
    error?: string;
}
/**
 * Web-Buddy contract definition
 */
export interface WebBuddyContract {
    version: string;
    domain: string;
    title: string;
    description?: string;
    capabilities: Record<string, ContractCapability>;
    context?: ContractContext;
}
/**
 * Contract capability definition
 */
export interface ContractCapability {
    type: 'action' | 'form' | 'query' | 'navigation';
    description: string;
    selector: string;
    parameters?: ContractParameter[];
    returnType?: ContractReturnType;
    validation?: ContractValidation;
}
/**
 * Contract parameter definition
 */
export interface ContractParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    required: boolean;
    default?: any;
    validation?: ContractValidation;
}
/**
 * Contract return type definition
 */
export interface ContractReturnType {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'void';
    description?: string;
    schema?: any;
}
/**
 * Contract validation rules
 */
export interface ContractValidation {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    enum?: any[];
    custom?: (value: any) => boolean | string;
}
/**
 * Contract execution context
 */
export interface ContractContext {
    urlPatterns: string[];
    accessibility?: {
        ariaCompliant?: boolean;
        keyboardNavigation?: boolean;
    };
    performance?: {
        maxExecutionTime?: number;
        cacheResults?: boolean;
    };
}
/**
 * Plugin UI component definition
 */
export interface PluginUIComponent {
    id: string;
    type: 'panel' | 'toolbar' | 'modal' | 'sidebar' | 'popup' | 'overlay';
    name: string;
    description?: string;
    icon?: string;
    render(): HTMLElement | Promise<HTMLElement>;
    onMount?(): void | Promise<void>;
    onUnmount?(): void | Promise<void>;
    onUpdate?(props: any): void | Promise<void>;
    onShow?(): void | Promise<void>;
    onHide?(): void | Promise<void>;
    onResize?(dimensions: {
        width: number;
        height: number;
    }): void;
}
/**
 * Plugin menu item definition
 */
export interface PluginMenuItem {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    shortcut?: string;
    action: () => Promise<void> | void;
    submenu?: PluginMenuItem[];
    enabled?: () => boolean;
    visible?: () => boolean;
}
/**
 * Plugin event definition
 */
export interface PluginEvent {
    type: string;
    source: string;
    target?: string;
    data: any;
    timestamp: string;
    correlationId?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Plugin event handler function
 */
export type PluginEventHandler = (event: PluginEvent) => Promise<void> | void;
/**
 * Plugin configuration schema
 */
export interface PluginConfiguration {
    enabled: boolean;
    settings: Record<string, any>;
    domains: string[];
    permissions: string[];
    uiPreferences: {
        theme?: 'light' | 'dark' | 'auto';
        language?: string;
        notifications?: boolean;
    };
}
/**
 * Plugin storage service interface
 */
export interface PluginStorageService {
    set(key: string, value: any): Promise<void>;
    get(key: string): Promise<any>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    setShared(namespace: string, key: string, value: any): Promise<void>;
    getShared(namespace: string, key: string): Promise<any>;
    removeShared(namespace: string, key: string): Promise<void>;
    getConfig(): Promise<PluginConfiguration>;
    setConfig(config: Partial<PluginConfiguration>): Promise<void>;
    migrate(version: string, migrationFn: (oldData: any) => any): Promise<void>;
}
/**
 * Plugin messaging service interface
 */
export interface PluginMessaging {
    sendMessage(fromPlugin: string, toPlugin: string, message: any): Promise<any>;
    publish(topic: string, data: any): Promise<void>;
    subscribe(topic: string, handler: PluginEventHandler): void;
    unsubscribe(topic: string, handler: PluginEventHandler): void;
    request(pluginId: string, request: any): Promise<any>;
    respond(requestId: string, response: any): Promise<void>;
    broadcast(message: any): Promise<void>;
    getStatistics(): any;
}
/**
 * Plugin event bus interface
 */
export interface PluginEventBus {
    emit(event: PluginEvent): Promise<void>;
    on(eventType: string, handler: PluginEventHandler): void;
    off(eventType: string, handler: PluginEventHandler): void;
    once(eventType: string, handler: PluginEventHandler): void;
    filter(predicate: (event: PluginEvent) => boolean): PluginEventBus;
    pipe(transformer: (event: PluginEvent) => PluginEvent): PluginEventBus;
    getHistory(pluginId?: string): PluginEvent[];
    replay(fromTimestamp?: string): Promise<void>;
    getStatistics(): any;
}
/**
 * Plugin logger interface
 */
export interface PluginLogger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, error?: Error, ...args: any[]): void;
    log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: any): void;
    time(label: string): void;
    timeEnd(label: string): void;
    child(context: any): PluginLogger;
}
/**
 * Basic tab interface
 */
export interface WebBuddyTab {
    id?: number;
    url?: string;
    title?: string;
    active?: boolean;
    windowId?: number;
}
/**
 * Tab manager service interface
 */
export interface TabManager {
    getCurrentTab(): Promise<WebBuddyTab | null>;
    getAllTabs(): Promise<WebBuddyTab[]>;
    switchToTab(tabId: number): Promise<void>;
    findTabByTitle(title: string): Promise<WebBuddyTab | null>;
    findTabByUrl(url: string): Promise<WebBuddyTab | null>;
    onTabCreated(callback: (tab: WebBuddyTab) => void): void;
    onTabUpdated(callback: (tabId: number, changeInfo: any, tab: WebBuddyTab) => void): void;
    onTabRemoved(callback: (tabId: number, removeInfo: any) => void): void;
    onTabActivated(callback: (activeInfo: {
        tabId: number;
        windowId: number;
    }) => void): void;
}
/**
 * Extension API wrapper interface
 */
export interface ExtensionAPI {
    runtime: any;
    tabs: any;
    storage: any;
    permissions: any;
    sendMessage(message: any): Promise<any>;
    broadcastMessage(message: any): Promise<void>;
    executeScript(tabId: number, details: any): Promise<any[]>;
    insertCSS(tabId: number, details: any): Promise<void>;
}
/**
 * Contract registry service interface
 */
export interface ContractRegistry {
    register(contract: WebBuddyContract): Promise<void>;
    unregister(contractId: string): Promise<void>;
    get(contractId: string): Promise<WebBuddyContract | null>;
    getByDomain(domain: string): Promise<WebBuddyContract[]>;
    getAll(): Promise<WebBuddyContract[]>;
    discover(): Promise<WebBuddyContract[]>;
    validate(contract: WebBuddyContract): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    execute(contractId: string, capability: string, parameters: any): Promise<any>;
    canExecute(contractId: string, capability: string): Promise<boolean>;
}
/**
 * Contract execution service interface
 */
export interface ContractExecutionService {
    executeCapability(contractId: string, capability: string, parameters: any): Promise<any>;
    validateParameters(contractId: string, capability: string, parameters: any): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    getExecutionHistory(): Promise<any[]>;
    setExecutionContext(context: any): void;
    getExecutionContext(): any;
    getExecutionStats(): Promise<any>;
    clearExecutionHistory(): Promise<void>;
}
/**
 * Plugin context interface - provides services to plugins
 */
export interface PluginContext {
    readonly pluginId: string;
    readonly metadata: PluginMetadata;
    contractRegistry: ContractRegistry;
    executionService: ContractExecutionService;
    storageService: PluginStorageService;
    tabManager: TabManager;
    extensionAPI: ExtensionAPI;
    messaging: PluginMessaging;
    eventBus: PluginEventBus;
    config: PluginConfiguration;
    logger: PluginLogger;
    createUIComponent(definition: Omit<PluginUIComponent, 'id'>): PluginUIComponent;
    createMenuItem(definition: Omit<PluginMenuItem, 'id'>): PluginMenuItem;
    getState(): PluginState;
    setState(state: PluginState): void;
    getDependency<T = any>(dependencyId: string): Promise<T | null>;
    hasDependency(dependencyId: string): boolean;
}
/**
 * Main plugin interface - implemented by all plugins
 */
export interface WebBuddyPlugin {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly description: string;
    readonly author: string;
    readonly metadata: PluginMetadata;
    readonly capabilities: PluginCapabilities;
    readonly state: PluginState;
    initialize(context: PluginContext): Promise<void>;
    activate(): Promise<void>;
    deactivate(): Promise<void>;
    destroy(): Promise<void>;
    getContracts(): WebBuddyContract[];
    executeCapability(capability: string, params: any): Promise<any>;
    validateCapability(capability: string, params: any): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    getUIComponents(): PluginUIComponent[];
    getMenuItems(): PluginMenuItem[];
    onEvent(event: PluginEvent): Promise<void>;
    getDefaultConfig(): PluginConfiguration;
    onConfigChange(config: PluginConfiguration): Promise<void>;
    healthCheck(): Promise<{
        healthy: boolean;
        issues: string[];
    }>;
    getMetrics(): Promise<Record<string, any>>;
}
/**
 * Plugin manifest definition for discovery and loading
 */
export interface PluginManifest {
    metadata: PluginMetadata;
    capabilities: PluginCapabilities;
    entry: {
        script: string;
        className?: string;
        exports?: string;
    };
    dependencies?: string[];
    optionalDependencies?: string[];
    minimumWebBuddyVersion?: string;
    maximumWebBuddyVersion?: string;
}
/**
 * Plugin installation package
 */
export interface PluginPackage {
    manifest: PluginManifest;
    scripts: Record<string, string>;
    resources: Record<string, Blob | string>;
    signature?: string;
    checksum?: string;
}
/**
 * Plugin security policy
 */
export interface PluginSecurityPolicy {
    allowedDomains: string[];
    allowedPermissions: string[];
    allowedAPIs: string[];
    sandboxed: boolean;
    trustedSource: boolean;
    maxMemoryUsage?: number;
    maxExecutionTime?: number;
}
/**
 * Standard plugin events
 */
export declare const PluginEvents: {
    readonly PLUGIN_LOADED: "plugin:loaded";
    readonly PLUGIN_INITIALIZED: "plugin:initialized";
    readonly PLUGIN_ACTIVATED: "plugin:activated";
    readonly PLUGIN_DEACTIVATED: "plugin:deactivated";
    readonly PLUGIN_DESTROYED: "plugin:destroyed";
    readonly PLUGIN_ERROR: "plugin:error";
    readonly CONTRACT_DISCOVERED: "contract:discovered";
    readonly CONTRACT_REGISTERED: "contract:registered";
    readonly CONTRACT_EXECUTED: "contract:executed";
    readonly CONTRACT_FAILED: "contract:failed";
    readonly AUTOMATION_STARTED: "automation:started";
    readonly AUTOMATION_COMPLETED: "automation:completed";
    readonly AUTOMATION_FAILED: "automation:failed";
    readonly UI_COMPONENT_MOUNTED: "ui:component:mounted";
    readonly UI_COMPONENT_UNMOUNTED: "ui:component:unmounted";
    readonly UI_INTERACTION: "ui:interaction";
    readonly SYSTEM_READY: "system:ready";
    readonly SYSTEM_SHUTDOWN: "system:shutdown";
    readonly ERROR_OCCURRED: "error:occurred";
};
/**
 * Plugin error types
 */
export declare class PluginError extends Error {
    readonly pluginId: string;
    readonly code: string;
    readonly details?: any | undefined;
    constructor(message: string, pluginId: string, code: string, details?: any | undefined);
}
export declare class PluginLoadError extends PluginError {
    constructor(message: string, pluginId: string, details?: any);
}
export declare class PluginInitializationError extends PluginError {
    constructor(message: string, pluginId: string, details?: any);
}
export declare class PluginExecutionError extends PluginError {
    constructor(message: string, pluginId: string, details?: any);
}
export declare class PluginSecurityError extends PluginError {
    constructor(message: string, pluginId: string, details?: any);
}
export declare class PluginDependencyError extends PluginError {
    constructor(message: string, pluginId: string, details?: any);
}
//# sourceMappingURL=plugin-interface.d.ts.map