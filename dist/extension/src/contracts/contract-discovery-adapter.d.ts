/**
 * @fileoverview Contract Discovery Adapter
 * @description Adapter for discovering and managing web application contracts
 */
interface WebBuddyContract {
    version: string;
    domain: string;
    title: string;
    description?: string;
    capabilities: Record<string, AutomationCapability>;
    selectors?: Record<string, SelectorDefinition>;
    workflows?: Record<string, WorkflowDefinition>;
    context?: ContractContext;
    metadata?: ContractMetadata;
}
interface AutomationCapability {
    type: 'action' | 'query' | 'form' | 'navigation' | 'file' | 'wait';
    description: string;
    selector: string | SelectorDefinition;
    parameters?: ParameterDefinition[];
    validation?: ValidationRules;
    timeout?: number;
    retries?: number;
    conditions?: ExecutionCondition[];
    examples?: CapabilityExample[];
    returnType?: ReturnTypeDefinition;
}
interface SelectorDefinition {
    primary: string;
    fallback?: string[];
    wait?: WaitCondition;
    frame?: string;
    shadowRoot?: boolean;
    validator?: string;
}
interface ParameterDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';
    description?: string;
    required?: boolean;
    defaultValue?: any;
    validation?: ValidationConstraints;
}
interface WorkflowDefinition {
    description: string;
    parameters?: ParameterDefinition[];
    steps: WorkflowStep[];
}
interface WorkflowStep {
    capability: string;
    parameters?: Record<string, any>;
    condition?: ExecutionCondition;
}
interface ContractContext {
    urlPatterns?: string[];
    titlePatterns?: string[];
    prerequisites?: Prerequisite[];
    customElements?: string[];
    accessibility?: AccessibilityContext;
}
interface ContractMetadata {
    author?: string;
    version?: string;
    lastUpdated?: string;
    tags?: string[];
    category?: string;
}
interface ValidationRules {
    elementExists?: boolean;
    elementVisible?: boolean;
    elementEnabled?: boolean;
    customValidator?: string;
}
interface ExecutionCondition {
    type: 'url' | 'element' | 'text' | 'custom';
    urlPattern?: string;
    elementSelector?: string;
    textContent?: string;
    customCondition?: string;
}
interface CapabilityExample {
    description: string;
    parameters: Record<string, any>;
    expectedResult?: any;
}
interface ReturnTypeDefinition {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    schema?: any;
}
interface WaitCondition {
    type: 'visible' | 'present' | 'hidden' | 'enabled' | 'text' | 'custom';
    timeout?: number;
    text?: string;
    customCondition?: string;
}
interface ValidationConstraints {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: any[];
    min?: number;
    max?: number;
}
interface Prerequisite {
    type: 'authentication' | 'element' | 'url' | 'custom';
    description: string;
    required?: boolean;
    selector?: string;
    urlPattern?: string;
    customCheck?: string;
}
interface AccessibilityContext {
    requiresScreenReader?: boolean;
    keyboardNavigation?: boolean;
    ariaCompliant?: boolean;
    minimumContrast?: number;
}
/**
 * Event emitted when contracts are discovered
 */
export declare class ContractsDiscoveredEvent extends CustomEvent<WebBuddyContract[]> {
    constructor(contracts: WebBuddyContract[]);
}
/**
 * Contract discovery and management adapter for Web-Buddy extension
 */
export declare class ContractDiscoveryAdapter {
    private discoveredContracts;
    private discoveryInterval?;
    private domObserver?;
    private isInitialized;
    /**
     * Initialize contract discovery
     */
    initialize(): Promise<void>;
    /**
     * Discover contracts on the current page
     */
    discoverContracts(): Promise<WebBuddyContract[]>;
    /**
     * Register a contract for use by the extension
     */
    registerContract(contract: WebBuddyContract): Promise<void>;
    /**
     * Get all discovered contracts
     */
    getDiscoveredContracts(): WebBuddyContract[];
    /**
     * Get contracts by domain
     */
    getContractsByDomain(domain: string): WebBuddyContract[];
    /**
     * Execute capability using contract
     */
    executeCapability(contractId: string, capabilityName: string, parameters?: Record<string, any>): Promise<any>;
    /**
     * Validate contract structure
     */
    private validateContract;
    /**
     * Convert contract to automation patterns for existing storage
     */
    private convertContractToPatterns;
    /**
     * Execute capability action
     */
    private executeCapabilityAction;
    /**
     * Find element using selector definition
     */
    private findElement;
    /**
     * Execute action capability
     */
    private executeAction;
    /**
     * Execute form capability
     */
    private executeFormAction;
    /**
     * Execute query capability
     */
    private executeQuery;
    /**
     * Execute navigation capability
     */
    private executeNavigation;
    /**
     * Discover contracts from meta tags
     */
    private discoverFromMetaTags;
    /**
     * Discover contracts from JSON-LD scripts
     */
    private discoverFromJsonLD;
    /**
     * Discover contracts from custom elements
     */
    private discoverFromCustomElements;
    /**
     * Discover contracts from data attributes
     */
    private discoverFromDataAttributes;
    /**
     * Discover contracts from window events (contract library communication)
     */
    private discoverFromWindowEvents;
    /**
     * Set up DOM observer for dynamic contract discovery
     */
    private setupDOMObserver;
    /**
     * Set up message handlers for contract communication
     */
    private setupMessageHandlers;
    /**
     * Start periodic contract discovery
     */
    private startPeriodicDiscovery;
    /**
     * Stop periodic contract discovery
     */
    stopDiscovery(): void;
    /**
     * Generate unique contract ID
     */
    private generateContractId;
    /**
     * Check if domain matches pattern
     */
    private domainMatches;
    /**
     * Generate context hash for pattern matching
     */
    private generateContextHash;
}
export declare const contractDiscovery: ContractDiscoveryAdapter;
export {};
//# sourceMappingURL=contract-discovery-adapter.d.ts.map