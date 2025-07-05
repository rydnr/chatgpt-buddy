/**
 * @fileoverview Web Components Integration
 * @description Integration utilities for Web Components and Custom Elements
 */

import { WebBuddyContract, AutomationCapability, SelectorDefinition } from '../types/contract-types';
import { contractRegistry } from '../contract-registry';
import { SelectorUtils } from '../utils/selector-utils';

/**
 * Web Components integration for contract discovery and automation
 */
export class WebComponentsIntegration {
  private static customElementObserver?: MutationObserver;
  private static registeredComponents = new Set<string>();

  /**
   * Initialize Web Components integration
   */
  public static initialize(): void {
    this.observeCustomElements();
    this.discoverExistingComponents();
  }

  /**
   * Register a custom element as automation-capable
   */
  public static registerCustomElement(
    tagName: string,
    contract: WebBuddyContract
  ): void {
    if (this.registeredComponents.has(tagName)) {
      console.warn(`Custom element ${tagName} already registered`);
      return;
    }

    // Register the contract
    contractRegistry.register(contract);
    this.registeredComponents.add(tagName);

    // Add automation capabilities to custom element prototype
    this.enhanceCustomElementPrototype(tagName, contract);

    console.log(`✅ Registered custom element: ${tagName}`);
  }

  /**
   * Discover contracts in custom elements
   */
  public static discoverCustomElementContracts(element: Element): WebBuddyContract[] {
    const contracts: WebBuddyContract[] = [];

    // Check for contract data attribute
    const contractData = element.getAttribute('data-automation-contract');
    if (contractData) {
      try {
        const contract = JSON.parse(contractData) as WebBuddyContract;
        contracts.push(contract);
      } catch (error) {
        console.warn('Invalid contract data in custom element:', error);
      }
    }

    // Check for contract in shadow DOM
    if (element.shadowRoot) {
      const shadowContracts = this.discoverShadowDOMContracts(element.shadowRoot);
      contracts.push(...shadowContracts);
    }

    return contracts;
  }

  /**
   * Get automation capabilities for a custom element
   */
  public static getElementCapabilities(element: Element): AutomationCapability[] {
    const capabilities: AutomationCapability[] = [];
    const tagName = element.tagName.toLowerCase();

    // Get contract for this element type
    const contracts = contractRegistry.getAll().filter(contract => 
      contract.context?.customElements?.includes(tagName)
    );

    for (const contract of contracts) {
      capabilities.push(...Object.values(contract.capabilities));
    }

    return capabilities;
  }

  /**
   * Execute capability on custom element
   */
  public static async executeCapability(
    element: Element,
    capabilityName: string,
    parameters?: Record<string, any>
  ): Promise<any> {
    const capabilities = this.getElementCapabilities(element);
    const capability = capabilities.find(cap => cap.description === capabilityName);

    if (!capability) {
      throw new Error(`Capability "${capabilityName}" not found for element`);
    }

    return this.executeCapabilityOnElement(element, capability, parameters);
  }

  /**
   * Create selector for custom element with slot support
   */
  public static createSlotSelector(
    tagName: string,
    slotName?: string,
    slotContent?: string
  ): SelectorDefinition {
    let primary = tagName;
    const fallback: string[] = [];

    if (slotName) {
      primary += ` [slot="${slotName}"]`;
      fallback.push(`${tagName} slot[name="${slotName}"]`);
    }

    if (slotContent) {
      fallback.push(`${tagName}:contains("${slotContent}")`);
    }

    return {
      primary,
      fallback,
      shadowRoot: true,
      validator: `
        return element.tagName.toLowerCase() === '${tagName}';
      `
    };
  }

  /**
   * Observe custom elements for dynamic registration
   */
  private static observeCustomElements(): void {
    if (this.customElementObserver) {
      return;
    }

    this.customElementObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              this.processNewElement(element);
            }
          });
        }
      }
    });

    this.customElementObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Process new element for contract discovery
   */
  private static processNewElement(element: Element): void {
    // Check if it's a custom element
    if (element.tagName.includes('-')) {
      const contracts = this.discoverCustomElementContracts(element);
      for (const contract of contracts) {
        contractRegistry.register(contract);
      }
    }

    // Check child elements
    const customElements = element.querySelectorAll('*');
    for (const child of customElements) {
      if (child.tagName.includes('-')) {
        const contracts = this.discoverCustomElementContracts(child);
        for (const contract of contracts) {
          contractRegistry.register(contract);
        }
      }
    }
  }

  /**
   * Discover existing custom elements on page
   */
  private static discoverExistingComponents(): void {
    const customElements = document.querySelectorAll('*');
    for (const element of customElements) {
      if (element.tagName.includes('-')) {
        const contracts = this.discoverCustomElementContracts(element);
        for (const contract of contracts) {
          contractRegistry.register(contract);
        }
      }
    }
  }

  /**
   * Discover contracts in shadow DOM
   */
  private static discoverShadowDOMContracts(shadowRoot: ShadowRoot): WebBuddyContract[] {
    const contracts: WebBuddyContract[] = [];

    // Check for contract script tags
    const scripts = shadowRoot.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data['@type'] === 'WebBuddyContract') {
          contracts.push(data as WebBuddyContract);
        }
      } catch (error) {
        // Ignore invalid JSON
      }
    }

    // Check for contract meta tags
    const metaTags = shadowRoot.querySelectorAll('meta[name^="web-buddy-contract"]');
    for (const meta of metaTags) {
      const content = meta.getAttribute('content');
      if (content) {
        try {
          const contract = JSON.parse(content) as WebBuddyContract;
          contracts.push(contract);
        } catch (error) {
          // Ignore invalid JSON
        }
      }
    }

    return contracts;
  }

  /**
   * Enhance custom element prototype with automation capabilities
   */
  private static enhanceCustomElementPrototype(
    tagName: string,
    contract: WebBuddyContract
  ): void {
    // Get the custom element constructor
    const constructor = customElements.get(tagName);
    if (!constructor) {
      console.warn(`Custom element ${tagName} not found in registry`);
      return;
    }

    // Add automation methods to prototype
    const prototype = constructor.prototype;
    
    // Add capability execution methods
    for (const [name, capability] of Object.entries(contract.capabilities)) {
      const methodName = `execute${name.charAt(0).toUpperCase()}${name.slice(1)}`;
      
      prototype[methodName] = async function(parameters?: Record<string, any>) {
        return WebComponentsIntegration.executeCapabilityOnElement(
          this,
          capability,
          parameters
        );
      };
    }

    // Add contract metadata
    prototype.getAutomationContract = function() {
      return contract;
    };

    prototype.getAutomationCapabilities = function() {
      return Object.keys(contract.capabilities);
    };
  }

  /**
   * Execute capability on element
   */
  private static async executeCapabilityOnElement(
    element: Element,
    capability: AutomationCapability,
    parameters?: Record<string, any>
  ): Promise<any> {
    const selector = typeof capability.selector === 'string' 
      ? capability.selector 
      : capability.selector.primary;

    // Find target element within the component
    const targetElement = element.shadowRoot 
      ? element.shadowRoot.querySelector(selector) || element.querySelector(selector)
      : element.querySelector(selector);

    if (!targetElement) {
      throw new Error(`Target element not found: ${selector}`);
    }

    // Execute based on capability type
    switch (capability.type) {
      case 'action':
        return this.executeAction(targetElement, parameters);
      case 'query':
        return this.executeQuery(targetElement, parameters);
      case 'form':
        return this.executeForm(targetElement, parameters);
      case 'navigation':
        return this.executeNavigation(targetElement, parameters);
      default:
        throw new Error(`Unsupported capability type: ${capability.type}`);
    }
  }

  /**
   * Execute action capability
   */
  private static async executeAction(
    element: Element,
    parameters?: Record<string, any>
  ): Promise<void> {
    if (element instanceof HTMLElement) {
      // Scroll into view if needed
      SelectorUtils.scrollToElement(element);
      
      // Click the element
      element.click();
      
      // Dispatch custom event
      element.dispatchEvent(new CustomEvent('automation:action', {
        detail: { parameters },
        bubbles: true
      }));
    }
  }

  /**
   * Execute query capability
   */
  private static async executeQuery(
    element: Element,
    parameters?: Record<string, any>
  ): Promise<any> {
    const result = {
      textContent: element.textContent,
      value: element instanceof HTMLInputElement ? element.value : null,
      attributes: Array.from(element.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {} as Record<string, string>)
    };

    // Dispatch custom event
    element.dispatchEvent(new CustomEvent('automation:query', {
      detail: { parameters, result },
      bubbles: true
    }));

    return result;
  }

  /**
   * Execute form capability
   */
  private static async executeForm(
    element: Element,
    parameters?: Record<string, any>
  ): Promise<void> {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const value = parameters?.value || parameters?.text || '';
      
      // Clear existing value
      element.value = '';
      
      // Set new value
      element.value = value;
      
      // Dispatch input events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Dispatch custom event
      element.dispatchEvent(new CustomEvent('automation:form', {
        detail: { parameters, value },
        bubbles: true
      }));
    }
  }

  /**
   * Execute navigation capability
   */
  private static async executeNavigation(
    element: Element,
    parameters?: Record<string, any>
  ): Promise<void> {
    if (element instanceof HTMLAnchorElement) {
      const href = element.href;
      
      // Dispatch custom event before navigation
      element.dispatchEvent(new CustomEvent('automation:navigation', {
        detail: { parameters, href },
        bubbles: true
      }));
      
      // Navigate
      if (parameters?.newTab) {
        window.open(href, '_blank');
      } else {
        window.location.href = href;
      }
    }
  }
}

// Auto-initialize Web Components integration
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    WebComponentsIntegration.initialize();
  });
} else {
  WebComponentsIntegration.initialize();
}