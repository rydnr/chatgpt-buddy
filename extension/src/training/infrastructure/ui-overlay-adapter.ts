// TypeScript-EDA Training UI Overlay Adapter
// Infrastructure layer - adapts training UI to event-driven architecture

import { SecondaryAdapter } from 'typescript-eda';
import {
  UserGuidanceDisplayed,
  ElementSelected,
  UserActionConfirmed,
  UserActionCancelled,
  TrainingModeEnabled,
  TrainingModeDisabled,
  ExecutionContext,
  UserGuidanceData
} from '../domain/events/training-events';

export interface UIOverlayPort {
  showGuidance(guidance: UserGuidanceData): Promise<void>;
  hideGuidance(): Promise<void>;
  enableElementSelection(): Promise<void>;
  disableElementSelection(): Promise<void>;
  showConfirmation(element: Element, selector: string): Promise<boolean>;
  highlightElement(element: Element): void;
  removeHighlight(element: Element): void;
}

export class UIOverlayAdapter implements UIOverlayPort, SecondaryAdapter {
  private overlay: HTMLElement | null = null;
  private confirmationOverlay: HTMLElement | null = null;
  private isSelectionMode = false;
  private currentGuidance: UserGuidanceData | null = null;
  private elementSelectionHandler: ((event: MouseEvent) => void) | null = null;
  private mouseOverHandler: ((event: MouseEvent) => void) | null = null;
  private mouseOutHandler: ((event: MouseEvent) => void) | null = null;
  private onElementSelected: ((element: Element, selector: string) => void) | null = null;
  private onUserConfirmed: ((action: string, selector: string) => void) | null = null;
  private onUserCancelled: ((action: string, reason: string) => void) | null = null;

  constructor() {
    this.setupEventHandlers();
  }

  // Event handler registration
  public onElementSelectionEvent(handler: (element: Element, selector: string) => void): void {
    this.onElementSelected = handler;
  }

  public onUserConfirmationEvent(handler: (action: string, selector: string) => void): void {
    this.onUserConfirmed = handler;
  }

  public onUserCancellationEvent(handler: (action: string, reason: string) => void): void {
    this.onUserCancelled = handler;
  }

  // UIOverlayPort implementation
  public async showGuidance(guidance: UserGuidanceData): Promise<void> {
    this.currentGuidance = guidance;
    
    // Create overlay element
    this.overlay = document.createElement('div');
    this.overlay.className = 'training-overlay eda-training-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    // Create guidance content
    const content = document.createElement('div');
    content.className = 'training-guidance-content';
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      text-align: center;
    `;

    content.innerHTML = this.generateGuidanceHTML(guidance);
    this.overlay.appendChild(content);

    // Add to DOM
    document.body.appendChild(this.overlay);

    // Enable element selection based on overlay type
    if (guidance.overlayType === 'prompt') {
      await this.enableElementSelection();
    }
  }

  public async hideGuidance(): Promise<void> {
    if (this.overlay && document.body.contains(this.overlay)) {
      document.body.removeChild(this.overlay);
    }
    this.overlay = null;
    this.currentGuidance = null;

    if (this.confirmationOverlay && document.body.contains(this.confirmationOverlay)) {
      document.body.removeChild(this.confirmationOverlay);
    }
    this.confirmationOverlay = null;

    await this.disableElementSelection();
  }

  public async enableElementSelection(): Promise<void> {
    if (this.isSelectionMode) return;

    this.isSelectionMode = true;
    document.body.style.cursor = 'crosshair';

    // Create and bind event handlers
    this.elementSelectionHandler = this.handleElementSelection.bind(this);
    this.mouseOverHandler = this.handleMouseOver.bind(this);
    this.mouseOutHandler = this.handleMouseOut.bind(this);

    // Add event listeners with capture to intercept before other handlers
    document.addEventListener('click', this.elementSelectionHandler, true);
    document.addEventListener('mouseover', this.mouseOverHandler, true);
    document.addEventListener('mouseout', this.mouseOutHandler, true);
  }

  public async disableElementSelection(): Promise<void> {
    if (!this.isSelectionMode) return;

    this.isSelectionMode = false;
    document.body.style.cursor = '';

    // Remove event listeners
    if (this.elementSelectionHandler) {
      document.removeEventListener('click', this.elementSelectionHandler, true);
    }
    if (this.mouseOverHandler) {
      document.removeEventListener('mouseover', this.mouseOverHandler, true);
    }
    if (this.mouseOutHandler) {
      document.removeEventListener('mouseout', this.mouseOutHandler, true);
    }

    // Clear handlers
    this.elementSelectionHandler = null;
    this.mouseOverHandler = null;
    this.mouseOutHandler = null;
  }

  public async showConfirmation(element: Element, selector: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmationOverlay = document.createElement('div');
      this.confirmationOverlay.className = 'training-confirmation-overlay';
      this.confirmationOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 600px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      `;

      content.innerHTML = `
        <div class="training-confirmation">
          <h3 style="margin: 0 0 16px 0; color: #2d5a27;">✅ Element Selected</h3>
          <p style="margin: 0 0 12px 0; color: #666;">
            <strong>Element:</strong> <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">${element.tagName.toLowerCase()}</code>
          </p>
          <p style="margin: 0 0 16px 0; color: #666;">
            <strong>Selector:</strong> <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">${selector}</code>
          </p>
          <p style="margin: 0 0 24px 0; font-weight: 500;">
            Do you want to automate this element for future <code>${this.currentGuidance?.messageType || 'unknown'}</code> requests?
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="confirm-automation" style="
              background: #2d5a27;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
            ">Yes, Automate</button>
            <button id="select-different" style="
              background: #f0f0f0;
              color: #333;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
            ">Select Different Element</button>
            <button id="cancel-training" style="
              background: #dc3545;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
            ">Cancel</button>
          </div>
        </div>
      `;

      this.confirmationOverlay.appendChild(content);
      document.body.appendChild(this.confirmationOverlay);

      // Handle button clicks
      const confirmBtn = content.querySelector('#confirm-automation');
      const selectDifferentBtn = content.querySelector('#select-different');
      const cancelBtn = content.querySelector('#cancel-training');

      confirmBtn?.addEventListener('click', () => {
        this.onUserConfirmed?.(this.currentGuidance?.messageType || 'unknown', selector);
        this.removeConfirmationOverlay();
        resolve(true);
      });

      selectDifferentBtn?.addEventListener('click', () => {
        this.removeConfirmationOverlay();
        // Re-enable element selection
        this.enableElementSelection();
        resolve(false);
      });

      cancelBtn?.addEventListener('click', () => {
        this.onUserCancelled?.(this.currentGuidance?.messageType || 'unknown', 'User cancelled');
        this.removeConfirmationOverlay();
        resolve(false);
      });
    });
  }

  public highlightElement(element: Element): void {
    if (element instanceof HTMLElement) {
      element.style.outline = '3px solid #007bff';
      element.style.outlineOffset = '2px';
      element.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
    }
  }

  public removeHighlight(element: Element): void {
    if (element instanceof HTMLElement) {
      element.style.outline = '';
      element.style.outlineOffset = '';
      element.style.backgroundColor = '';
    }
  }

  // Private methods

  private setupEventHandlers(): void {
    // Global keyboard handler for canceling training
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isSelectionMode) {
        this.onUserCancelled?.('keyboard', 'User pressed Escape');
        this.hideGuidance();
      }
    });
  }

  private generateGuidanceHTML(guidance: UserGuidanceData): string {
    const emoji = this.getEmojiForMessageType(guidance.messageType);
    
    return `
      <h3 style="margin: 0 0 16px 0; color: #2d5a27;">
        ${emoji} Training Mode Active
      </h3>
      <div style="margin: 0 0 16px 0; padding: 16px; background: #f8f9fa; border-radius: 8px; text-align: left;">
        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
          <strong>Message Type:</strong> <code>${guidance.messageType}</code>
        </p>
        <p style="margin: 0; color: #333;">
          ${guidance.instructions}
        </p>
      </div>
      ${guidance.overlayType === 'prompt' ? `
        <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
          Click on the element you want to automate, or press <strong>Escape</strong> to cancel.
        </p>
      ` : ''}
      <button onclick="this.closest('.training-overlay').style.display='none'" style="
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
      ">Cancel Training</button>
    `;
  }

  private getEmojiForMessageType(messageType: string): string {
    switch (messageType) {
      case 'FillTextRequested': return '✏️';
      case 'ClickElementRequested': return '👆';
      case 'SelectProjectRequested': return '📁';
      case 'SelectChatRequested': return '💬';
      default: return '🎯';
    }
  }

  private handleElementSelection(event: MouseEvent): void {
    // Don't interfere with training overlay interactions
    if (this.isTrainingOverlayElement(event.target as Element)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const selectedElement = event.target as Element;
    const selector = this.generateOptimalSelector(selectedElement);

    // Disable selection temporarily
    this.disableElementSelection();

    // Remove any existing highlights
    this.removeHighlightFromAllElements();

    // Trigger element selection event
    this.onElementSelected?.(selectedElement, selector);

    // Show confirmation dialog
    this.showConfirmation(selectedElement, selector);
  }

  private handleMouseOver(event: MouseEvent): void {
    if (!this.isSelectionMode || this.isTrainingOverlayElement(event.target as Element)) {
      return;
    }

    this.highlightElement(event.target as Element);
  }

  private handleMouseOut(event: MouseEvent): void {
    if (!this.isSelectionMode || this.isTrainingOverlayElement(event.target as Element)) {
      return;
    }

    this.removeHighlight(event.target as Element);
  }

  private isTrainingOverlayElement(element: Element): boolean {
    return element.closest('.training-overlay, .training-confirmation-overlay') !== null;
  }

  private removeHighlightFromAllElements(): void {
    const highlightedElements = document.querySelectorAll('[style*="outline"]');
    highlightedElements.forEach(el => this.removeHighlight(el));
  }

  private removeConfirmationOverlay(): void {
    if (this.confirmationOverlay && document.body.contains(this.confirmationOverlay)) {
      document.body.removeChild(this.confirmationOverlay);
    }
    this.confirmationOverlay = null;
  }

  private generateOptimalSelector(element: Element): string {
    // Priority-based selector generation
    const selectors: Array<{ selector: string; priority: number }> = [];

    // Priority 1: ID (most reliable)
    if (element.id) {
      selectors.push({ selector: `#${element.id}`, priority: 1 });
    }

    // Priority 2: data-testid (testing-friendly)
    const testId = element.getAttribute('data-testid');
    if (testId) {
      selectors.push({ selector: `[data-testid="${testId}"]`, priority: 2 });
    }

    // Priority 3: name attribute (form elements)
    const name = element.getAttribute('name');
    if (name) {
      selectors.push({ 
        selector: `${element.tagName.toLowerCase()}[name="${name}"]`, 
        priority: 3 
      });
    }

    // Priority 4: unique class combination
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0 && classes.length <= 3) {
        selectors.push({ 
          selector: `.${classes.join('.')}`, 
          priority: 4 
        });
      }
    }

    // Priority 5: type attribute (input elements)
    const type = element.getAttribute('type');
    if (type) {
      selectors.push({ 
        selector: `${element.tagName.toLowerCase()}[type="${type}"]`, 
        priority: 5 
      });
    }

    // Priority 6: tag name (least specific)
    selectors.push({ 
      selector: element.tagName.toLowerCase(), 
      priority: 6 
    });

    // Return highest priority selector that's unique
    selectors.sort((a, b) => a.priority - b.priority);
    
    for (const selectorObj of selectors) {
      const elements = document.querySelectorAll(selectorObj.selector);
      if (elements.length === 1 && elements[0] === element) {
        return selectorObj.selector;
      }
    }

    // Fallback to first selector if none are unique
    return selectors[0].selector;
  }
}