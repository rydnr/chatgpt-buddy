"use strict";
/**
 * @fileoverview Contract Discovery Adapter
 * @description Adapter for discovering and managing web application contracts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractDiscovery = exports.ContractDiscoveryAdapter = exports.ContractsDiscoveredEvent = void 0;
const storage_1 = require("../storage");
/**
 * Event emitted when contracts are discovered
 */
class ContractsDiscoveredEvent extends CustomEvent {
    constructor(contracts) {
        super('web-buddy:contracts-discovered', {
            detail: contracts,
            bubbles: true,
            cancelable: false
        });
    }
}
exports.ContractsDiscoveredEvent = ContractsDiscoveredEvent;
/**
 * Contract discovery and management adapter for Web-Buddy extension
 */
class ContractDiscoveryAdapter {
    constructor() {
        this.discoveredContracts = new Map();
        this.isInitialized = false;
    }
    /**
     * Initialize contract discovery
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        console.log('🔍 Initializing contract discovery adapter...');
        // Set up DOM observer for dynamic contract discovery
        this.setupDOMObserver();
        // Set up message handlers for contract communication
        this.setupMessageHandlers();
        // Perform initial contract discovery
        await this.discoverContracts();
        // Start periodic discovery
        this.startPeriodicDiscovery();
        this.isInitialized = true;
        console.log('✅ Contract discovery adapter initialized');
    }
    /**
     * Discover contracts on the current page
     */
    async discoverContracts() {
        const contracts = [];
        try {
            // Method 1: Discover from meta tags
            contracts.push(...this.discoverFromMetaTags());
            // Method 2: Discover from JSON-LD scripts
            contracts.push(...this.discoverFromJsonLD());
            // Method 3: Discover from custom elements
            contracts.push(...this.discoverFromCustomElements());
            // Method 4: Discover from data attributes
            contracts.push(...this.discoverFromDataAttributes());
            // Method 5: Discover from window events (contract library communication)
            contracts.push(...this.discoverFromWindowEvents());
            // Store discovered contracts
            for (const contract of contracts) {
                await this.registerContract(contract);
            }
            if (contracts.length > 0) {
                console.log(`🎯 Discovered ${contracts.length} contract(s) on ${window.location.hostname}`);
                // Emit discovery event
                window.dispatchEvent(new ContractsDiscoveredEvent(contracts));
                // Notify background script
                chrome.runtime.sendMessage({
                    type: 'contracts:discovered',
                    contracts: contracts,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                });
            }
            return contracts;
        }
        catch (error) {
            console.error('❌ Contract discovery failed:', error);
            return [];
        }
    }
    /**
     * Register a contract for use by the extension
     */
    async registerContract(contract) {
        try {
            // Validate contract
            const validation = this.validateContract(contract);
            if (!validation.valid) {
                console.warn('⚠️ Contract validation failed:', validation.errors);
                return;
            }
            // Generate contract ID
            const contractId = this.generateContractId(contract);
            // Store in memory
            this.discoveredContracts.set(contractId, contract);
            // Convert to automation patterns for existing storage system
            const patterns = this.convertContractToPatterns(contract);
            for (const pattern of patterns) {
                await storage_1.webBuddyStorage.saveAutomationPattern(pattern);
            }
            console.log(`✅ Registered contract: ${contract.title} (${contractId})`);
        }
        catch (error) {
            console.error('❌ Failed to register contract:', error);
        }
    }
    /**
     * Get all discovered contracts
     */
    getDiscoveredContracts() {
        return Array.from(this.discoveredContracts.values());
    }
    /**
     * Get contracts by domain
     */
    getContractsByDomain(domain) {
        return this.getDiscoveredContracts().filter(contract => contract.domain === domain || this.domainMatches(domain, contract.domain));
    }
    /**
     * Execute capability using contract
     */
    async executeCapability(contractId, capabilityName, parameters = {}) {
        const contract = this.discoveredContracts.get(contractId);
        if (!contract) {
            throw new Error(`Contract not found: ${contractId}`);
        }
        const capability = contract.capabilities[capabilityName];
        if (!capability) {
            throw new Error(`Capability not found: ${capabilityName} in contract ${contractId}`);
        }
        // Execute capability based on type
        return this.executeCapabilityAction(capability, parameters);
    }
    /**
     * Validate contract structure
     */
    validateContract(contract) {
        const errors = [];
        if (!contract.version) {
            errors.push('Contract version is required');
        }
        if (!contract.domain) {
            errors.push('Contract domain is required');
        }
        if (!contract.title) {
            errors.push('Contract title is required');
        }
        if (!contract.capabilities || Object.keys(contract.capabilities).length === 0) {
            errors.push('Contract must have at least one capability');
        }
        // Validate capabilities
        for (const [name, capability] of Object.entries(contract.capabilities || {})) {
            if (!capability.type || !capability.description || !capability.selector) {
                errors.push(`Capability ${name} is missing required fields`);
            }
        }
        return { valid: errors.length === 0, errors };
    }
    /**
     * Convert contract to automation patterns for existing storage
     */
    convertContractToPatterns(contract) {
        const patterns = [];
        for (const [name, capability] of Object.entries(contract.capabilities)) {
            const selector = typeof capability.selector === 'string'
                ? capability.selector
                : capability.selector.primary;
            patterns.push({
                url: window.location.href,
                domain: contract.domain,
                action: name,
                selector: selector,
                parameters: {
                    type: capability.type,
                    description: capability.description,
                    timeout: capability.timeout,
                    retries: capability.retries
                },
                success: true,
                contextHash: this.generateContextHash(),
                userConfirmed: true // Auto-confirm contract-based patterns
            });
        }
        return patterns;
    }
    /**
     * Execute capability action
     */
    async executeCapabilityAction(capability, parameters) {
        const selector = typeof capability.selector === 'string'
            ? capability.selector
            : capability.selector.primary;
        // Find element
        const element = await this.findElement(capability.selector, capability.timeout);
        if (!element) {
            throw new Error(`Element not found: ${selector}`);
        }
        // Execute based on capability type
        switch (capability.type) {
            case 'action':
                return this.executeAction(element, parameters);
            case 'form':
                return this.executeFormAction(element, parameters);
            case 'query':
                return this.executeQuery(element, parameters);
            case 'navigation':
                return this.executeNavigation(element, parameters);
            default:
                throw new Error(`Unsupported capability type: ${capability.type}`);
        }
    }
    /**
     * Find element using selector definition
     */
    async findElement(selectorDef, timeout = 5000) {
        if (typeof selectorDef === 'string') {
            return document.querySelector(selectorDef);
        }
        // Try primary selector
        let element = document.querySelector(selectorDef.primary);
        if (element) {
            return element;
        }
        // Try fallback selectors
        if (selectorDef.fallback) {
            for (const fallbackSelector of selectorDef.fallback) {
                element = document.querySelector(fallbackSelector);
                if (element) {
                    return element;
                }
            }
        }
        return null;
    }
    /**
     * Execute action capability
     */
    async executeAction(element, parameters) {
        if (element instanceof HTMLElement) {
            element.click();
            return { success: true, action: 'click', element: element.tagName };
        }
        throw new Error('Element is not clickable');
    }
    /**
     * Execute form capability
     */
    async executeFormAction(element, parameters) {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            const value = parameters.value || parameters.text || '';
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, action: 'fillInput', value, element: element.tagName };
        }
        throw new Error('Element is not a form input');
    }
    /**
     * Execute query capability
     */
    async executeQuery(element, parameters) {
        return {
            success: true,
            action: 'query',
            data: {
                textContent: element.textContent,
                innerHTML: element.innerHTML,
                attributes: Array.from(element.attributes).reduce((acc, attr) => {
                    acc[attr.name] = attr.value;
                    return acc;
                }, {})
            }
        };
    }
    /**
     * Execute navigation capability
     */
    async executeNavigation(element, parameters) {
        if (element instanceof HTMLAnchorElement) {
            const href = element.href;
            if (parameters.newTab) {
                window.open(href, '_blank');
            }
            else {
                window.location.href = href;
            }
            return { success: true, action: 'navigation', href };
        }
        throw new Error('Element is not a navigation link');
    }
    /**
     * Discover contracts from meta tags
     */
    discoverFromMetaTags() {
        const contracts = [];
        const metaTags = document.querySelectorAll('meta[name^="web-buddy-contract"]');
        metaTags.forEach(tag => {
            const content = tag.getAttribute('content');
            if (content) {
                try {
                    const contract = JSON.parse(content);
                    contracts.push(contract);
                }
                catch (error) {
                    console.warn('Invalid contract in meta tag:', error);
                }
            }
        });
        return contracts;
    }
    /**
     * Discover contracts from JSON-LD scripts
     */
    discoverFromJsonLD() {
        const contracts = [];
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        scripts.forEach(script => {
            try {
                const data = JSON.parse(script.textContent || '');
                if (data['@type'] === 'WebBuddyContract') {
                    contracts.push(data);
                }
            }
            catch (error) {
                // Ignore invalid JSON-LD
            }
        });
        return contracts;
    }
    /**
     * Discover contracts from custom elements
     */
    discoverFromCustomElements() {
        const contracts = [];
        const contractElements = document.querySelectorAll('web-buddy-contract');
        contractElements.forEach(element => {
            const contractData = element.textContent;
            if (contractData) {
                try {
                    const contract = JSON.parse(contractData);
                    contracts.push(contract);
                }
                catch (error) {
                    console.warn('Invalid contract in custom element:', error);
                }
            }
        });
        return contracts;
    }
    /**
     * Discover contracts from data attributes
     */
    discoverFromDataAttributes() {
        const contracts = [];
        const elements = document.querySelectorAll('[data-automation-contract]');
        elements.forEach(element => {
            const contractData = element.getAttribute('data-automation-contract');
            if (contractData) {
                try {
                    const contract = JSON.parse(contractData);
                    contracts.push(contract);
                }
                catch (error) {
                    console.warn('Invalid contract in data attribute:', error);
                }
            }
        });
        return contracts;
    }
    /**
     * Discover contracts from window events (contract library communication)
     */
    discoverFromWindowEvents() {
        // This will be populated by listening to contract registration events
        return [];
    }
    /**
     * Set up DOM observer for dynamic contract discovery
     */
    setupDOMObserver() {
        this.domObserver = new MutationObserver((mutations) => {
            let shouldRediscover = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node;
                            // Check for contract-related elements
                            if (element.tagName === 'WEB-BUDDY-CONTRACT' ||
                                element.hasAttribute('data-automation-contract') ||
                                element.querySelector('web-buddy-contract, [data-automation-contract]')) {
                                shouldRediscover = true;
                            }
                        }
                    });
                }
            });
            if (shouldRediscover) {
                // Debounce rediscovery
                setTimeout(() => this.discoverContracts(), 100);
            }
        });
        this.domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    /**
     * Set up message handlers for contract communication
     */
    setupMessageHandlers() {
        // Listen for contract registration events from the contract library
        window.addEventListener('web-buddy:contract-registered', (event) => {
            const contract = event.detail;
            this.registerContract(contract);
        });
        // Listen for contract discovery requests
        window.addEventListener('message', (event) => {
            if (event.data.type === 'web-buddy:request-contracts') {
                const contracts = this.getDiscoveredContracts();
                event.source?.postMessage({
                    type: 'web-buddy:contracts-response',
                    contracts,
                    correlationId: event.data.correlationId
                }, event.origin);
            }
        });
    }
    /**
     * Start periodic contract discovery
     */
    startPeriodicDiscovery() {
        this.discoveryInterval = window.setInterval(() => {
            this.discoverContracts();
        }, 10000); // Every 10 seconds
    }
    /**
     * Stop periodic contract discovery
     */
    stopDiscovery() {
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
            this.discoveryInterval = undefined;
        }
        if (this.domObserver) {
            this.domObserver.disconnect();
            this.domObserver = undefined;
        }
    }
    /**
     * Generate unique contract ID
     */
    generateContractId(contract) {
        return `${contract.domain}_${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    }
    /**
     * Check if domain matches pattern
     */
    domainMatches(domain, pattern) {
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(domain);
        }
        return domain === pattern;
    }
    /**
     * Generate context hash for pattern matching
     */
    generateContextHash() {
        const context = {
            domain: window.location.hostname,
            path: window.location.pathname,
            title: document.title,
            bodyClasses: Array.from(document.body.classList).sort().join(' '),
            elementCount: document.querySelectorAll('*').length
        };
        return btoa(JSON.stringify(context)).slice(0, 16);
    }
}
exports.ContractDiscoveryAdapter = ContractDiscoveryAdapter;
// Global contract discovery adapter instance
exports.contractDiscovery = new ContractDiscoveryAdapter();
//# sourceMappingURL=contract-discovery-adapter.js.map