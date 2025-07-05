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
  
  // Lifecycle hooks
  render(): HTMLElement | Promise<HTMLElement>;
  onMount?(): void | Promise<void>;
  onUnmount?(): void | Promise<void>;
  onUpdate?(props: any): void | Promise<void>;
  
  // Event handlers
  onShow?(): void | Promise<void>;
  onHide?(): void | Promise<void>;
  onResize?(dimensions: { width: number; height: number }): void;
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
  // Plugin-scoped storage
  set(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  
  // Cross-plugin shared storage
  setShared(namespace: string, key: string, value: any): Promise<void>;
  getShared(namespace: string, key: string): Promise<any>;
  removeShared(namespace: string, key: string): Promise<void>;
  
  // Configuration storage
  getConfig(): Promise<PluginConfiguration>;
  setConfig(config: Partial<PluginConfiguration>): Promise<void>;
  
  // Migration support
  migrate(version: string, migrationFn: (oldData: any) => any): Promise<void>;
}

/**
 * Plugin messaging service interface
 */
export interface PluginMessaging {
  // Direct messaging between plugins
  sendMessage(fromPlugin: string, toPlugin: string, message: any): Promise<any>;
  
  // Publish-subscribe pattern
  publish(topic: string, data: any): Promise<void>;
  subscribe(topic: string, handler: PluginEventHandler): void;
  unsubscribe(topic: string, handler: PluginEventHandler): void;
  
  // Request-response pattern
  request(pluginId: string, request: any): Promise<any>;
  respond(requestId: string, response: any): Promise<void>;
  
  // Broadcast messaging
  broadcast(message: any): Promise<void>;
}

/**
 * Plugin event bus interface
 */
export interface PluginEventBus {
  emit(event: PluginEvent): Promise<void>;
  on(eventType: string, handler: PluginEventHandler): void;
  off(eventType: string, handler: PluginEventHandler): void;
  once(eventType: string, handler: PluginEventHandler): void;
  
  // Event filtering and routing
  filter(predicate: (event: PluginEvent) => boolean): PluginEventBus;
  pipe(transformer: (event: PluginEvent) => PluginEvent): PluginEventBus;
  
  // Event history and replay
  getHistory(pluginId?: string): PluginEvent[];
  replay(fromTimestamp?: string): Promise<void>;
}

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
  
  // Structured logging
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: any): void;
  
  // Performance tracking
  time(label: string): void;
  timeEnd(label: string): void;
  
  // Plugin-specific context
  child(context: any): PluginLogger;
}

/**
 * Tab manager service interface
 */
export interface TabManager {
  getCurrentTab(): Promise<chrome.tabs.Tab | null>;
  getAllTabs(): Promise<chrome.tabs.Tab[]>;
  switchToTab(tabId: number): Promise<void>;
  findTabByTitle(title: string): Promise<chrome.tabs.Tab | null>;
  findTabByUrl(url: string): Promise<chrome.tabs.Tab | null>;
  
  // Tab events
  onTabCreated(callback: (tab: chrome.tabs.Tab) => void): void;
  onTabUpdated(callback: (tabId: number, changeInfo: any, tab: chrome.tabs.Tab) => void): void;
  onTabRemoved(callback: (tabId: number, removeInfo: any) => void): void;
  onTabActivated(callback: (activeInfo: { tabId: number; windowId: number }) => void): void;
}

/**
 * Extension API wrapper interface
 */
export interface ExtensionAPI {
  // Chrome APIs wrapper
  runtime: typeof chrome.runtime;
  tabs: typeof chrome.tabs;
  storage: typeof chrome.storage;
  permissions: typeof chrome.permissions;
  
  // Custom extension utilities
  sendMessage(message: any): Promise<any>;
  broadcastMessage(message: any): Promise<void>;
  executeScript(tabId: number, details: chrome.tabs.InjectDetails): Promise<any[]>;
  insertCSS(tabId: number, details: chrome.tabs.InjectDetails): Promise<void>;
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
  
  // Contract discovery
  discover(): Promise<WebBuddyContract[]>;
  validate(contract: WebBuddyContract): Promise<{ valid: boolean; errors: string[] }>;
  
  // Contract execution
  execute(contractId: string, capability: string, parameters: any): Promise<any>;
  canExecute(contractId: string, capability: string): Promise<boolean>;
}

/**
 * Contract execution service interface
 */
export interface ContractExecutionService {
  executeCapability(contractId: string, capability: string, parameters: any): Promise<any>;
  validateParameters(contractId: string, capability: string, parameters: any): Promise<{ valid: boolean; errors: string[] }>;
  getExecutionHistory(): Promise<any[]>;
  
  // Execution context
  setExecutionContext(context: any): void;
  getExecutionContext(): any;
  
  // Performance monitoring
  getExecutionStats(): Promise<any>;
  clearExecutionHistory(): Promise<void>;
}

/**
 * Plugin context interface - provides services to plugins
 */
export interface PluginContext {
  // Plugin metadata
  readonly pluginId: string;
  readonly metadata: PluginMetadata;
  
  // Core services
  contractRegistry: ContractRegistry;
  executionService: ContractExecutionService;
  storageService: PluginStorageService;
  
  // Browser integration
  tabManager: TabManager;
  extensionAPI: ExtensionAPI;
  
  // Plugin communication
  messaging: PluginMessaging;
  eventBus: PluginEventBus;
  
  // Configuration and logging
  config: PluginConfiguration;
  logger: PluginLogger;
  
  // Utility methods
  createUIComponent(definition: Omit<PluginUIComponent, 'id'>): PluginUIComponent;
  createMenuItem(definition: Omit<PluginMenuItem, 'id'>): PluginMenuItem;
  
  // Lifecycle management
  getState(): PluginState;
  setState(state: PluginState): void;
  
  // Plugin dependencies
  getDependency<T = any>(dependencyId: string): Promise<T | null>;
  hasDependency(dependencyId: string): boolean;
}

/**
 * Main plugin interface - implemented by all plugins
 */
export interface WebBuddyPlugin {
  // Plugin metadata
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  
  // Plugin capabilities
  readonly metadata: PluginMetadata;
  readonly capabilities: PluginCapabilities;
  
  // Plugin state
  readonly state: PluginState;
  
  // Plugin lifecycle hooks
  initialize(context: PluginContext): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  destroy(): Promise<void>;
  
  // Contract and automation
  getContracts(): WebBuddyContract[];
  executeCapability(capability: string, params: any): Promise<any>;
  validateCapability(capability: string, params: any): Promise<{ valid: boolean; errors: string[] }>;
  
  // UI integration
  getUIComponents(): PluginUIComponent[];
  getMenuItems(): PluginMenuItem[];
  
  // Event handling
  onEvent(event: PluginEvent): Promise<void>;
  
  // Configuration
  getDefaultConfig(): PluginConfiguration;
  onConfigChange(config: PluginConfiguration): Promise<void>;
  
  // Health and diagnostics
  healthCheck(): Promise<{ healthy: boolean; issues: string[] }>;
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
} as const;

/**
 * Plugin error types
 */
export class PluginError extends Error {
  constructor(
    message: string,
    public readonly pluginId: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

export class PluginLoadError extends PluginError {
  constructor(message: string, pluginId: string, details?: any) {
    super(message, pluginId, 'PLUGIN_LOAD_ERROR', details);
    this.name = 'PluginLoadError';
  }
}

export class PluginInitializationError extends PluginError {
  constructor(message: string, pluginId: string, details?: any) {
    super(message, pluginId, 'PLUGIN_INITIALIZATION_ERROR', details);
    this.name = 'PluginInitializationError';
  }
}

export class PluginExecutionError extends PluginError {
  constructor(message: string, pluginId: string, details?: any) {
    super(message, pluginId, 'PLUGIN_EXECUTION_ERROR', details);
    this.name = 'PluginExecutionError';
  }
}

export class PluginSecurityError extends PluginError {
  constructor(message: string, pluginId: string, details?: any) {
    super(message, pluginId, 'PLUGIN_SECURITY_ERROR', details);
    this.name = 'PluginSecurityError';
  }
}

export class PluginDependencyError extends PluginError {
  constructor(message: string, pluginId: string, details?: any) {
    super(message, pluginId, 'PLUGIN_DEPENDENCY_ERROR', details);
    this.name = 'PluginDependencyError';
  }
}