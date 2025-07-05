/**
 * @fileoverview Contract Registry
 * @description Registration and discovery system for Web-Buddy contracts
 */

import { WebBuddyContract, ValidationResult } from './types/contract-types';
import { ContractValidator } from './contract-validator';

/**
 * Event fired when a contract is registered
 */
export class ContractRegisteredEvent extends CustomEvent<WebBuddyContract> {
  constructor(contract: WebBuddyContract) {
    super('web-buddy:contract-registered', {
      detail: contract,
      bubbles: true,
      cancelable: false
    });
  }
}

/**
 * Event fired when contracts are discovered
 */
export class ContractsDiscoveredEvent extends CustomEvent<WebBuddyContract[]> {
  constructor(contracts: WebBuddyContract[]) {
    super('web-buddy:contracts-discovered', {
      detail: contracts,
      bubbles: true,
      cancelable: false
    });
  }
}

/**
 * Contract registry for managing automation contracts
 */
export class ContractRegistry {
  private static instance: ContractRegistry;
  private contracts: Map<string, WebBuddyContract> = new Map();
  private validator = new ContractValidator();
  private discoveryInterval?: number;

  private constructor() {
    this.setupDOMObserver();
    this.setupMessageHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ContractRegistry {
    if (!ContractRegistry.instance) {
      ContractRegistry.instance = new ContractRegistry();
    }
    return ContractRegistry.instance;
  }

  /**
   * Register a contract
   */
  public register(contract: WebBuddyContract): ValidationResult {
    // Validate contract before registration
    const validation = this.validator.validate(contract);
    if (!validation.valid) {
      console.error('Contract validation failed:', validation.errors);
      return validation;
    }

    // Store contract
    const contractId = this.generateContractId(contract);
    this.contracts.set(contractId, contract);

    // Emit registration event
    const event = new ContractRegisteredEvent(contract);
    window.dispatchEvent(event);

    // Update page metadata
    this.updatePageMetadata(contract);

    console.log(`✅ Registered contract: ${contract.title} (${contractId})`);
    return validation;
  }

  /**
   * Get all registered contracts
   */
  public getAll(): WebBuddyContract[] {
    return Array.from(this.contracts.values());
  }

  /**
   * Get contracts by domain
   */
  public getByDomain(domain: string): WebBuddyContract[] {
    return this.getAll().filter(contract => 
      contract.domain === domain || 
      this.domainMatches(domain, contract.domain)
    );
  }

  /**
   * Get contract by ID
   */
  public getById(contractId: string): WebBuddyContract | undefined {
    return this.contracts.get(contractId);
  }

  /**
   * Find contracts that support a specific capability
   */
  public findByCapability(capabilityName: string): WebBuddyContract[] {
    return this.getAll().filter(contract => 
      contract.capabilities[capabilityName] !== undefined
    );
  }

  /**
   * Discover contracts on the current page
   */
  public async discoverContracts(): Promise<WebBuddyContract[]> {
    const discovered: WebBuddyContract[] = [];

    // Discover from meta tags
    discovered.push(...this.discoverFromMetaTags());

    // Discover from custom elements
    discovered.push(...this.discoverFromCustomElements());

    // Discover from JSON-LD scripts
    discovered.push(...this.discoverFromJsonLD());

    // Discover from data attributes
    discovered.push(...this.discoverFromDataAttributes());

    // Register discovered contracts
    for (const contract of discovered) {
      this.register(contract);
    }

    // Emit discovery event
    if (discovered.length > 0) {
      const event = new ContractsDiscoveredEvent(discovered);
      window.dispatchEvent(event);
    }

    return discovered;
  }

  /**
   * Start automatic contract discovery
   */
  public startAutoDiscovery(intervalMs: number = 5000): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }

    this.discoveryInterval = window.setInterval(() => {
      this.discoverContracts();
    }, intervalMs);

    // Initial discovery
    this.discoverContracts();
  }

  /**
   * Stop automatic contract discovery
   */
  public stopAutoDiscovery(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = undefined;
    }
  }

  /**
   * Export contracts for sharing
   */
  public exportContracts(): string {
    return JSON.stringify(this.getAll(), null, 2);
  }

  /**
   * Import contracts from JSON
   */
  public importContracts(json: string): ValidationResult {
    try {
      const contracts: WebBuddyContract[] = JSON.parse(json);
      const results: ValidationResult = {
        valid: true,
        errors: [],
        warnings: []
      };

      for (const contract of contracts) {
        const validation = this.register(contract);
        if (!validation.valid) {
          results.valid = false;
          results.errors.push(...validation.errors);
        }
        results.warnings.push(...validation.warnings);
      }

      return results;
    } catch (error) {
      return {
        valid: false,
        errors: [{
          path: 'root',
          message: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'INVALID_JSON'
        }],
        warnings: []
      };
    }
  }

  /**
   * Generate unique contract ID
   */
  private generateContractId(contract: WebBuddyContract): string {
    return `${contract.domain}_${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
  }

  /**
   * Check if domain matches pattern
   */
  private domainMatches(domain: string, pattern: string): boolean {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(domain);
    }
    return domain === pattern;
  }

  /**
   * Update page metadata with contract information
   */
  private updatePageMetadata(contract: WebBuddyContract): void {
    // Add meta tag for contract availability
    let metaTag = document.querySelector('meta[name="web-buddy-contract"]') as HTMLMetaElement;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'web-buddy-contract';
      document.head.appendChild(metaTag);
    }
    metaTag.content = 'available';

    // Add contract details as data attributes on body
    document.body.setAttribute('data-web-buddy-contract-title', contract.title);
    document.body.setAttribute('data-web-buddy-contract-version', contract.version);
    document.body.setAttribute('data-web-buddy-capabilities', 
      Object.keys(contract.capabilities).join(','));
  }

  /**
   * Discover contracts from meta tags
   */
  private discoverFromMetaTags(): WebBuddyContract[] {
    const contracts: WebBuddyContract[] = [];
    
    const metaTags = document.querySelectorAll('meta[name^="web-buddy-contract"]');
    metaTags.forEach(tag => {
      const content = tag.getAttribute('content');
      if (content) {
        try {
          const contract = JSON.parse(content) as WebBuddyContract;
          contracts.push(contract);
        } catch (error) {
          console.warn('Invalid contract in meta tag:', error);
        }
      }
    });

    return contracts;
  }

  /**
   * Discover contracts from custom elements
   */
  private discoverFromCustomElements(): WebBuddyContract[] {
    const contracts: WebBuddyContract[] = [];
    
    const contractElements = document.querySelectorAll('web-buddy-contract');
    contractElements.forEach(element => {
      const contractData = element.textContent;
      if (contractData) {
        try {
          const contract = JSON.parse(contractData) as WebBuddyContract;
          contracts.push(contract);
        } catch (error) {
          console.warn('Invalid contract in custom element:', error);
        }
      }
    });

    return contracts;
  }

  /**
   * Discover contracts from JSON-LD scripts
   */
  private discoverFromJsonLD(): WebBuddyContract[] {
    const contracts: WebBuddyContract[] = [];
    
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data['@type'] === 'WebBuddyContract') {
          contracts.push(data as WebBuddyContract);
        }
      } catch (error) {
        // Ignore invalid JSON-LD
      }
    });

    return contracts;
  }

  /**
   * Discover contracts from data attributes
   */
  private discoverFromDataAttributes(): WebBuddyContract[] {
    const contracts: WebBuddyContract[] = [];
    
    const elements = document.querySelectorAll('[data-automation-contract]');
    elements.forEach(element => {
      const contractData = element.getAttribute('data-automation-contract');
      if (contractData) {
        try {
          const contract = JSON.parse(contractData) as WebBuddyContract;
          contracts.push(contract);
        } catch (error) {
          console.warn('Invalid contract in data attribute:', error);
        }
      }
    });

    return contracts;
  }

  /**
   * Set up DOM observer for dynamic contract discovery
   */
  private setupDOMObserver(): void {
    const observer = new MutationObserver((mutations) => {
      let shouldRediscover = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
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

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Set up message handlers for browser extension communication
   */
  private setupMessageHandlers(): void {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'web-buddy:request-contracts') {
        const contracts = this.getAll();
        event.source?.postMessage({
          type: 'web-buddy:contracts-response',
          contracts,
          correlationId: event.data.correlationId
        }, event.origin);
      }
    });
  }
}

/**
 * Global contract registry instance
 */
export const contractRegistry = ContractRegistry.getInstance();

/**
 * Convenience function to register a contract
 */
export function registerContract(contract: WebBuddyContract): ValidationResult {
  return contractRegistry.register(contract);
}

/**
 * Convenience function to discover contracts
 */
export function discoverContracts(): Promise<WebBuddyContract[]> {
  return contractRegistry.discoverContracts();
}

// Auto-start discovery when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    contractRegistry.startAutoDiscovery();
  });
} else {
  contractRegistry.startAutoDiscovery();
}