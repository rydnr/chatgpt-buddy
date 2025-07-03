/**
 * Message Handler interface and base implementation
 * 
 * Provides the contract for handling domain-specific messages
 */

import { WebBuddyMessage } from '../types/web-buddy-types';

/**
 * Interface that all domain-specific handlers must implement
 */
export interface MessageHandler {
  handle(message: WebBuddyMessage): Promise<any>;
}

/**
 * Base implementation with common handler functionality
 */
export abstract class BaseMessageHandler implements MessageHandler {
  /**
   * Handle a message - must be implemented by domain-specific handlers
   */
  abstract handle(message: WebBuddyMessage): Promise<any>;

  /**
   * Utility: Wait for element to appear in DOM
   */
  protected async waitForElement(selector: string, timeout = 5000): Promise<Element> {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) return resolve(element);
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Utility: Add realistic delay for human-like behavior
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Utility: Simulate typing with realistic speed
   */
  protected async typeText(element: HTMLInputElement, text: string): Promise<void> {
    element.focus();
    element.value = '';

    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await this.delay(50 + Math.random() * 50); // Realistic typing variation
    }
  }

  /**
   * Utility: Safe element interaction with error handling
   */
  protected async safeClick(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);
    if (element instanceof HTMLElement) {
      element.click();
    } else {
      throw new Error(`Element ${selector} is not clickable`);
    }
  }

  /**
   * Utility: Extract text content safely
   */
  protected extractText(element: Element | null): string {
    return element?.textContent?.trim() || '';
  }

  /**
   * Utility: Extract attribute safely
   */
  protected extractAttribute(element: Element | null, attribute: string): string {
    return element?.getAttribute(attribute) || '';
  }
}