/**
 * @fileoverview ARIA Integration
 * @description Integration utilities for ARIA accessibility standards
 */

import { WebBuddyContract, AutomationCapability, SelectorDefinition } from '../types/contract-types';
import { contractRegistry } from '../contract-registry';
import { SelectorUtils } from '../utils/selector-utils';

/**
 * ARIA roles to capability type mapping
 */
const ARIA_ROLE_MAPPING: Record<string, string> = {
  'button': 'action',
  'link': 'navigation',
  'textbox': 'form',
  'searchbox': 'form',
  'combobox': 'form',
  'listbox': 'query',
  'grid': 'query',
  'table': 'query',
  'tab': 'navigation',
  'menuitem': 'action',
  'checkbox': 'form',
  'radio': 'form',
  'slider': 'form',
  'spinbutton': 'form'
};

/**
 * ARIA integration for accessibility-based automation
 */
export class AriaIntegration {
  private static ariaObserver?: MutationObserver;
  private static discoveredElements = new WeakSet<Element>();

  /**
   * Initialize ARIA integration
   */
  public static initialize(): void {
    this.observeAriaElements();
    this.discoverExistingAriaElements();
  }

  /**
   * Create contract from ARIA-enabled elements
   */
  public static createAriaContract(
    domain: string,
    title: string,
    description?: string
  ): WebBuddyContract {
    const capabilities: Record<string, AutomationCapability> = {};
    const selectors: Record<string, SelectorDefinition> = {};

    // Discover all ARIA elements
    const ariaElements = this.findAriaElements();
    
    for (const element of ariaElements) {
      const capability = this.createCapabilityFromAriaElement(element);
      const selector = this.createSelectorFromAriaElement(element);
      
      if (capability && selector) {
        const name = this.generateCapabilityName(element);
        capabilities[name] = capability;
        selectors[name] = selector;
      }
    }

    return {
      version: '1.0.0',
      domain,
      title,
      description,
      capabilities,
      selectors,
      context: {
        accessibility: {
          requiresScreenReader: false,
          keyboardNavigation: true,
          ariaCompliant: true
        }
      }
    };
  }

  /**
   * Find all ARIA-enabled elements
   */
  public static findAriaElements(): Element[] {
    const elements: Element[] = [];
    
    // Find elements with ARIA roles
    const roleElements = document.querySelectorAll('[role]');
    elements.push(...Array.from(roleElements));
    
    // Find elements with ARIA labels
    const labelElements = document.querySelectorAll('[aria-label], [aria-labelledby]');
    elements.push(...Array.from(labelElements));
    
    // Find elements with ARIA states
    const stateElements = document.querySelectorAll('[aria-expanded], [aria-checked], [aria-selected]');
    elements.push(...Array.from(stateElements));
    
    // Remove duplicates
    return Array.from(new Set(elements));
  }

  /**
   * Create capability from ARIA element
   */
  public static createCapabilityFromAriaElement(element: Element): AutomationCapability | null {
    const role = element.getAttribute('role');
    const label = element.getAttribute('aria-label') || 
                  element.getAttribute('aria-labelledby') || 
                  element.textContent?.trim();
    
    if (!role && !label) {
      return null;
    }

    const capabilityType = role ? ARIA_ROLE_MAPPING[role] : 'action';
    if (!capabilityType) {
      return null;
    }

    const capability: AutomationCapability = {
      type: capabilityType as any,
      description: label || `Interact with ${role || 'element'}`,
      selector: this.createSelectorFromAriaElement(element)
    };

    // Add role-specific enhancements
    this.enhanceCapabilityByRole(capability, element, role);
    
    return capability;
  }

  /**
   * Create selector from ARIA element
   */
  public static createSelectorFromAriaElement(element: Element): SelectorDefinition {
    const selectors: string[] = [];
    
    const role = element.getAttribute('role');
    const label = element.getAttribute('aria-label');
    const labelledBy = element.getAttribute('aria-labelledby');
    const id = element.id;
    
    // Priority 1: Role + Label combination
    if (role && label) {
      selectors.push(`[role="${role}"][aria-label="${label}"]`);
    }
    
    // Priority 2: Role + ID
    if (role && id) {
      selectors.push(`[role="${role}"]#${id}`);
    }
    
    // Priority 3: Label only
    if (label) {
      selectors.push(`[aria-label="${label}"]`);
    }
    
    // Priority 4: Role only
    if (role) {
      selectors.push(`[role="${role}"]`);
    }
    
    // Priority 5: Labelledby
    if (labelledBy) {
      selectors.push(`[aria-labelledby="${labelledBy}"]`);
    }
    
    // Priority 6: ID fallback
    if (id) {
      selectors.push(`#${id}`);
    }
    
    return {
      primary: selectors[0] || element.tagName.toLowerCase(),
      fallback: selectors.slice(1),
      validator: `
        return element.getAttribute('role') === '${role}' || 
               element.getAttribute('aria-label') === '${label}' ||
               element.id === '${id}';
      `
    };
  }

  /**
   * Check if element is accessible
   */
  public static isElementAccessible(element: Element): boolean {
    // Check if element has proper ARIA attributes
    const hasRole = element.hasAttribute('role');
    const hasLabel = element.hasAttribute('aria-label') || 
                    element.hasAttribute('aria-labelledby') || 
                    element.textContent?.trim();
    
    // Check if element is not hidden from screen readers
    const ariaHidden = element.getAttribute('aria-hidden') === 'true';
    const tabIndex = element.getAttribute('tabindex');
    const isHidden = ariaHidden || tabIndex === '-1';
    
    return (hasRole || hasLabel) && !isHidden;
  }

  /**
   * Get accessibility information for element
   */
  public static getAccessibilityInfo(element: Element): {
    role?: string;
    name?: string;
    description?: string;
    state?: Record<string, string>;
    properties?: Record<string, string>;
  } {
    const info: any = {};
    
    // Get role
    const role = element.getAttribute('role');
    if (role) {
      info.role = role;
    }
    
    // Get accessible name
    const label = element.getAttribute('aria-label');
    const labelledBy = element.getAttribute('aria-labelledby');
    const textContent = element.textContent?.trim();
    
    if (label) {
      info.name = label;
    } else if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) {
        info.name = labelElement.textContent?.trim();
      }
    } else if (textContent) {
      info.name = textContent;
    }
    
    // Get description
    const describedBy = element.getAttribute('aria-describedby');
    if (describedBy) {
      const descElement = document.getElementById(describedBy);
      if (descElement) {
        info.description = descElement.textContent?.trim();
      }
    }
    
    // Get states
    const states: Record<string, string> = {};
    const ariaStates = ['expanded', 'checked', 'selected', 'pressed', 'disabled'];
    
    for (const state of ariaStates) {
      const value = element.getAttribute(`aria-${state}`);
      if (value !== null) {
        states[state] = value;
      }
    }
    
    if (Object.keys(states).length > 0) {
      info.state = states;
    }
    
    // Get properties
    const properties: Record<string, string> = {};
    const ariaProperties = ['required', 'readonly', 'multiline', 'autocomplete'];
    
    for (const prop of ariaProperties) {
      const value = element.getAttribute(`aria-${prop}`);
      if (value !== null) {
        properties[prop] = value;
      }
    }
    
    if (Object.keys(properties).length > 0) {
      info.properties = properties;
    }
    
    return info;
  }

  /**
   * Create keyboard navigation selector
   */
  public static createKeyboardSelector(element: Element): SelectorDefinition {
    const tabIndex = element.getAttribute('tabindex');
    const role = element.getAttribute('role');
    
    let primary = '';
    const fallback: string[] = [];
    
    // Focus-able elements
    if (tabIndex && tabIndex !== '-1') {
      primary = `[tabindex="${tabIndex}"]`;
    } else if (role) {
      primary = `[role="${role}"]`;
    }
    
    // Add keyboard interaction hints
    if (role === 'button' || element.tagName === 'BUTTON') {
      fallback.push('[role="button"]', 'button');
    }
    
    if (role === 'link' || element.tagName === 'A') {
      fallback.push('[role="link"]', 'a[href]');
    }
    
    return {
      primary: primary || element.tagName.toLowerCase(),
      fallback,
      validator: `
        return element.tabIndex >= 0 || 
               element.getAttribute('role') === '${role}' ||
               ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
      `
    };
  }

  /**
   * Execute accessibility-aware automation
   */
  public static async executeAccessibleAction(
    element: Element,
    action: 'click' | 'focus' | 'type' | 'select',
    parameters?: Record<string, any>
  ): Promise<void> {
    // Check if element is accessible
    if (!this.isElementAccessible(element)) {
      console.warn('Element may not be accessible to screen readers');
    }
    
    // Ensure element is focusable
    if (element instanceof HTMLElement) {
      // Focus the element first
      element.focus();
      
      // Announce action to screen readers
      this.announceAction(element, action, parameters);
      
      // Execute action
      switch (action) {
        case 'click':
          element.click();
          break;
        case 'focus':
          element.focus();
          break;
        case 'type':
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = parameters?.text || '';
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
          break;
        case 'select':
          if (element instanceof HTMLSelectElement) {
            element.selectedIndex = parameters?.index || 0;
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
          break;
      }
      
      // Update ARIA states if needed
      this.updateAriaStates(element, action, parameters);
    }
  }

  /**
   * Enhance capability based on ARIA role
   */
  private static enhanceCapabilityByRole(
    capability: AutomationCapability,
    element: Element,
    role: string | null
  ): void {
    if (!role) return;
    
    switch (role) {
      case 'button':
        capability.validation = {
          elementExists: true,
          elementVisible: true,
          elementEnabled: true
        };
        break;
        
      case 'textbox':
      case 'searchbox':
        capability.parameters = [{
          name: 'text',
          type: 'string',
          description: 'Text to input',
          required: true
        }];
        break;
        
      case 'combobox':
        capability.parameters = [{
          name: 'value',
          type: 'string',
          description: 'Value to select',
          required: true
        }];
        break;
        
      case 'checkbox':
        capability.parameters = [{
          name: 'checked',
          type: 'boolean',
          description: 'Check state',
          required: true
        }];
        break;
    }
  }

  /**
   * Generate capability name from element
   */
  private static generateCapabilityName(element: Element): string {
    const role = element.getAttribute('role');
    const label = element.getAttribute('aria-label') || 
                  element.textContent?.trim();
    
    let name = '';
    
    if (label) {
      name = label.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    } else if (role) {
      name = role;
    } else {
      name = element.tagName.toLowerCase();
    }
    
    return name + '_' + Date.now();
  }

  /**
   * Observe ARIA elements for dynamic discovery
   */
  private static observeAriaElements(): void {
    if (this.ariaObserver) return;
    
    this.ariaObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              this.processAriaElement(element);
            }
          });
        } else if (mutation.type === 'attributes') {
          const element = mutation.target as Element;
          if (mutation.attributeName?.startsWith('aria-') || 
              mutation.attributeName === 'role') {
            this.processAriaElement(element);
          }
        }
      }
    });
    
    this.ariaObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['role', 'aria-label', 'aria-labelledby', 'aria-describedby']
    });
  }

  /**
   * Process ARIA element for contract discovery
   */
  private static processAriaElement(element: Element): void {
    if (this.discoveredElements.has(element)) return;
    
    if (this.isElementAccessible(element)) {
      this.discoveredElements.add(element);
      
      // Could emit event for dynamic contract registration
      element.dispatchEvent(new CustomEvent('web-buddy:aria-discovered', {
        detail: {
          element,
          accessibility: this.getAccessibilityInfo(element)
        },
        bubbles: true
      }));
    }
  }

  /**
   * Discover existing ARIA elements
   */
  private static discoverExistingAriaElements(): void {
    const elements = this.findAriaElements();
    for (const element of elements) {
      this.processAriaElement(element);
    }
  }

  /**
   * Announce action to screen readers
   */
  private static announceAction(
    element: Element,
    action: string,
    parameters?: Record<string, any>
  ): void {
    const announcement = `Executing ${action} on ${element.getAttribute('aria-label') || element.textContent}`;
    
    // Create live region for announcement
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.textContent = announcement;
    
    document.body.appendChild(liveRegion);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }

  /**
   * Update ARIA states after action
   */
  private static updateAriaStates(
    element: Element,
    action: string,
    parameters?: Record<string, any>
  ): void {
    const role = element.getAttribute('role');
    
    switch (role) {
      case 'button':
        if (element.hasAttribute('aria-pressed')) {
          const pressed = element.getAttribute('aria-pressed') === 'true';
          element.setAttribute('aria-pressed', (!pressed).toString());
        }
        break;
        
      case 'checkbox':
        if (parameters?.checked !== undefined) {
          element.setAttribute('aria-checked', parameters.checked.toString());
        }
        break;
        
      case 'tab':
        if (action === 'click') {
          element.setAttribute('aria-selected', 'true');
          // Unselect other tabs in same group
          const tablist = element.closest('[role="tablist"]');
          if (tablist) {
            const otherTabs = tablist.querySelectorAll('[role="tab"]');
            otherTabs.forEach(tab => {
              if (tab !== element) {
                tab.setAttribute('aria-selected', 'false');
              }
            });
          }
        }
        break;
    }
  }
}

// Auto-initialize ARIA integration
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AriaIntegration.initialize();
  });
} else {
  AriaIntegration.initialize();
}