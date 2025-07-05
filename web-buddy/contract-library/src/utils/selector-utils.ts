/**
 * @fileoverview Selector Utilities
 * @description Utility functions for working with CSS selectors and element selection
 */

import { SelectorDefinition, WaitCondition } from '../types/contract-types';

/**
 * Selector utility class with robust element selection strategies
 */
export class SelectorUtils {
  /**
   * Find element using selector definition with fallback strategies
   */
  public static async findElement(
    selectorDef: SelectorDefinition,
    context: Document | Element = document,
    timeout: number = 5000
  ): Promise<Element | null> {
    // Wait for conditions if specified
    if (selectorDef.wait) {
      const waitSuccess = await this.waitForCondition(selectorDef.wait, timeout);
      if (!waitSuccess) {
        console.warn('Wait condition failed for selector');
      }
    }

    // Try primary selector
    let element = this.querySelectorWithFrame(selectorDef.primary, context, selectorDef.frame, selectorDef.shadowRoot);
    
    if (element && this.validateElement(element, selectorDef.validator)) {
      return element;
    }

    // Try fallback selectors
    if (selectorDef.fallback) {
      for (const fallbackSelector of selectorDef.fallback) {
        element = this.querySelectorWithFrame(fallbackSelector, context, selectorDef.frame, selectorDef.shadowRoot);
        if (element && this.validateElement(element, selectorDef.validator)) {
          return element;
        }
      }
    }

    return null;
  }

  /**
   * Find all elements matching selector definition
   */
  public static async findElements(
    selectorDef: SelectorDefinition,
    context: Document | Element = document,
    timeout: number = 5000
  ): Promise<Element[]> {
    // Wait for conditions if specified
    if (selectorDef.wait) {
      await this.waitForCondition(selectorDef.wait, timeout);
    }

    const elements: Element[] = [];

    // Try primary selector
    let foundElements = this.querySelectorAllWithFrame(selectorDef.primary, context, selectorDef.frame, selectorDef.shadowRoot);
    elements.push(...foundElements.filter(el => this.validateElement(el, selectorDef.validator)));

    // Try fallback selectors if no elements found
    if (elements.length === 0 && selectorDef.fallback) {
      for (const fallbackSelector of selectorDef.fallback) {
        foundElements = this.querySelectorAllWithFrame(fallbackSelector, context, selectorDef.frame, selectorDef.shadowRoot);
        const validElements = foundElements.filter(el => this.validateElement(el, selectorDef.validator));
        if (validElements.length > 0) {
          elements.push(...validElements);
          break;
        }
      }
    }

    return elements;
  }

  /**
   * Query selector with iframe and shadow DOM support
   */
  private static querySelectorWithFrame(
    selector: string,
    context: Document | Element,
    frameSelector?: string,
    includeShadowRoot?: boolean
  ): Element | null {
    let searchContext = context;

    // Navigate to iframe if specified
    if (frameSelector) {
      const frame = context.querySelector(frameSelector) as HTMLIFrameElement;
      if (frame?.contentDocument) {
        searchContext = frame.contentDocument;
      } else {
        return null;
      }
    }

    // Search in shadow DOM if specified
    if (includeShadowRoot) {
      return this.querySelectorInShadowDOM(selector, searchContext);
    }

    return searchContext.querySelector(selector);
  }

  /**
   * Query all selectors with iframe and shadow DOM support
   */
  private static querySelectorAllWithFrame(
    selector: string,
    context: Document | Element,
    frameSelector?: string,
    includeShadowRoot?: boolean
  ): Element[] {
    let searchContext = context;

    // Navigate to iframe if specified
    if (frameSelector) {
      const frame = context.querySelector(frameSelector) as HTMLIFrameElement;
      if (frame?.contentDocument) {
        searchContext = frame.contentDocument;
      } else {
        return [];
      }
    }

    // Search in shadow DOM if specified
    if (includeShadowRoot) {
      return this.querySelectorAllInShadowDOM(selector, searchContext);
    }

    return Array.from(searchContext.querySelectorAll(selector));
  }

  /**
   * Search for element in shadow DOM
   */
  private static querySelectorInShadowDOM(selector: string, context: Document | Element): Element | null {
    // First try regular query
    const element = context.querySelector(selector);
    if (element) return element;

    // Then search in shadow roots
    const elementsWithShadow = context.querySelectorAll('*');
    for (const el of elementsWithShadow) {
      if (el.shadowRoot) {
        const shadowElement = this.querySelectorInShadowDOM(selector, el.shadowRoot);
        if (shadowElement) return shadowElement;
      }
    }

    return null;
  }

  /**
   * Search for all elements in shadow DOM
   */
  private static querySelectorAllInShadowDOM(selector: string, context: Document | Element): Element[] {
    const elements: Element[] = [];

    // First try regular query
    elements.push(...Array.from(context.querySelectorAll(selector)));

    // Then search in shadow roots
    const elementsWithShadow = context.querySelectorAll('*');
    for (const el of elementsWithShadow) {
      if (el.shadowRoot) {
        elements.push(...this.querySelectorAllInShadowDOM(selector, el.shadowRoot));
      }
    }

    return elements;
  }

  /**
   * Validate element using custom validator function
   */
  private static validateElement(element: Element, validatorCode?: string): boolean {
    if (!validatorCode) return true;

    try {
      const validator = new Function('element', validatorCode);
      return Boolean(validator(element));
    } catch (error) {
      console.warn('Selector validator function failed:', error);
      return true; // Default to valid if validator fails
    }
  }

  /**
   * Wait for condition to be met
   */
  private static async waitForCondition(wait: WaitCondition, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 100;

    while (Date.now() - startTime < (wait.timeout || timeout)) {
      if (this.checkCondition(wait)) {
        return true;
      }
      await this.sleep(checkInterval);
    }

    return false;
  }

  /**
   * Check if wait condition is met
   */
  private static checkCondition(wait: WaitCondition): boolean {
    switch (wait.type) {
      case 'visible':
        return this.isElementVisible();
      case 'present':
        return this.isElementPresent();
      case 'hidden':
        return !this.isElementVisible();
      case 'enabled':
        return this.isElementEnabled();
      case 'text':
        return this.hasText(wait.text || '');
      case 'custom':
        return this.executeCustomCondition(wait.customCondition || '');
      default:
        return true;
    }
  }

  /**
   * Check if any element is visible
   */
  private static isElementVisible(): boolean {
    // This is a simplified check - in practice, this would check specific elements
    return document.body.style.display !== 'none';
  }

  /**
   * Check if any element is present
   */
  private static isElementPresent(): boolean {
    // This is a simplified check - in practice, this would check specific elements
    return document.body.children.length > 0;
  }

  /**
   * Check if any element is enabled
   */
  private static isElementEnabled(): boolean {
    // This is a simplified check - in practice, this would check specific elements
    return true;
  }

  /**
   * Check if page contains specific text
   */
  private static hasText(text: string): boolean {
    return document.body.textContent?.includes(text) || false;
  }

  /**
   * Execute custom condition function
   */
  private static executeCustomCondition(conditionCode: string): boolean {
    try {
      const condition = new Function(conditionCode);
      return Boolean(condition());
    } catch (error) {
      console.warn('Custom wait condition failed:', error);
      return false;
    }
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate robust selector for an element
   */
  public static generateRobustSelector(element: Element): SelectorDefinition {
    const selectors: string[] = [];

    // Try data attributes first (most stable)
    const testId = element.getAttribute('data-testid') || 
                   element.getAttribute('data-test') ||
                   element.getAttribute('test-id');
    if (testId) {
      selectors.push(`[data-testid="${testId}"]`);
    }

    // Try ARIA attributes
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      selectors.push(`[aria-label="${ariaLabel}"]`);
    }

    const role = element.getAttribute('role');
    if (role) {
      selectors.push(`[role="${role}"]`);
    }

    // Try ID (if stable-looking)
    const id = element.id;
    if (id && this.isStableId(id)) {
      selectors.push(`#${id}`);
    }

    // Try class names (if stable-looking)
    const stableClasses = Array.from(element.classList).filter(cls => this.isStableClass(cls));
    if (stableClasses.length > 0) {
      selectors.push(`.${stableClasses.join('.')}`);
    }

    // Fallback to tag + attributes
    const tagName = element.tagName.toLowerCase();
    const name = element.getAttribute('name');
    if (name) {
      selectors.push(`${tagName}[name="${name}"]`);
    }

    const type = element.getAttribute('type');
    if (type) {
      selectors.push(`${tagName}[type="${type}"]`);
    }

    // Last resort: tag + text content
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length > 0 && textContent.length < 50) {
      selectors.push(`${tagName}:contains("${textContent}")`);
    }

    return {
      primary: selectors[0] || tagName,
      fallback: selectors.slice(1),
      validator: `
        return element.tagName.toLowerCase() === '${tagName}' &&
               element.textContent?.trim() === '${textContent?.replace(/'/g, "\\'")}';
      `
    };
  }

  /**
   * Check if ID appears stable (not auto-generated)
   */
  private static isStableId(id: string): boolean {
    // Avoid IDs that look auto-generated
    const unstablePatterns = [
      /^[a-f0-9]{8,}$/i,  // Long hex strings
      /^\d+$/,             // Pure numbers
      /^react-/,           // React auto-generated
      /^ember\d+/,         // Ember auto-generated
      /-\d{4,}$/,          // Ends with long numbers
    ];

    return !unstablePatterns.some(pattern => pattern.test(id));
  }

  /**
   * Check if class name appears stable
   */
  private static isStableClass(className: string): boolean {
    // Avoid classes that look auto-generated or framework-specific
    const unstablePatterns = [
      /^[a-f0-9]{6,}$/i,   // Long hex strings
      /^\w+_\w+_[a-f0-9]+/, // CSS modules
      /^css-\w+/,          // Styled components
      /^sc-\w+/,           // Styled components
      /^jsx-\d+/,          // JSX auto-generated
    ];

    return !unstablePatterns.some(pattern => pattern.test(className));
  }

  /**
   * Get element's position and dimensions
   */
  public static getElementBounds(element: Element): DOMRect {
    return element.getBoundingClientRect();
  }

  /**
   * Check if element is currently visible in viewport
   */
  public static isElementInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Scroll element into view if needed
   */
  public static scrollToElement(element: Element, behavior: ScrollBehavior = 'smooth'): void {
    element.scrollIntoView({ behavior, block: 'center', inline: 'center' });
  }

  /**
   * Highlight element for debugging/training purposes
   */
  public static highlightElement(element: Element, duration: number = 2000): void {
    const originalStyle = element.getAttribute('style') || '';
    const highlightStyle = 'outline: 3px solid #ff6b6b; outline-offset: 2px; background-color: rgba(255, 107, 107, 0.1);';
    
    element.setAttribute('style', originalStyle + '; ' + highlightStyle);

    setTimeout(() => {
      element.setAttribute('style', originalStyle);
    }, duration);
  }
}