/*
                        Web-Buddy Core

    Copyright (C) 2025-today  rydnr@acm-sl.org

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/// <reference types="chrome" />

import { WebBuddyEvent, EventHandler, EventResponse, createSuccessResponse, createErrorResponse } from './events/base';
import { UserGuidanceRequestedEvent, UserGuidanceProvidedEvent, AutomationImplementedEvent, AutomationRequestedEvent } from './events/automation';
import { WebBuddyMessage } from './messages/base'; // Legacy support
import { AutomationManager, ReusePreference } from './learning/automation-manager';
import { StoredAutomation } from './storage/automation-storage';

/**
 * Interface for learning user interface components
 */
interface LearningUserInterface {
  showGuidanceDialog(event: UserGuidanceRequestedEvent): Promise<UserGuidanceProvidedEvent>;
  showReuseDialog(automation: StoredAutomation, event: AutomationRequestedEvent): Promise<ReusePreference>;
  showRecordingIndicator(): void;
  hideRecordingIndicator(): void;
  showScriptReview(script: string): Promise<{ approved: boolean; modifiedScript?: string }>;
}

/**
 * Interface for Playwright recording functionality
 */
interface PlaywrightRecorder {
  startRecording(context: RecordingContext): void;
  stopRecording(): PlaywrightScript;
  isRecording(): boolean;
  getRecordedActions(): RecordedAction[];
}

interface RecordingContext {
  eventId: string;
  action: string;
  parameters: Record<string, any>;
  website: string;
}

interface PlaywrightScript {
  script: string;
  templatedScript: string;
  actions: RecordedAction[];
  metadata: {
    recordingDuration: number;
    stepCount: number;
    screenshots?: string[];
  };
}

interface RecordedAction {
  type: 'click' | 'fill' | 'select' | 'wait' | 'navigate' | 'keyboard';
  selector: string;
  value?: string;
  timestamp: number;
  screenshot?: string;
  metadata: Record<string, any>;
}

/**
 * Configuration for the Web-Buddy extension
 */
export interface WebBuddyExtensionConfig {
  serverUrl: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  extensionId?: string;
}

/**
 * Generic Web-Buddy extension that handles browser-side automation
 * Now includes learning capabilities and user guidance workflows
 * Domain-specific extensions register their handlers with this class
 */
export class WebBuddyExtension {
  private handlers = new Map<string, EventHandler>();
  private learningUI?: LearningUserInterface;
  private playwrightRecorder?: PlaywrightRecorder;
  private automationManager?: AutomationManager;
  private websocket?: WebSocket;
  private reconnectAttempts = 0;
  private heartbeatTimer?: NodeJS.Timeout;
  private readonly extensionId: string;
  
  constructor(private config: WebBuddyExtensionConfig) {
    this.extensionId = config.extensionId || this.generateExtensionId();
    this.initializeLearningSystem();
  }
  
  /**
   * Registers an event handler for a specific event type
   * Domain implementations use this to register their handlers
   * 
   * @param eventType - The type of event to handle
   * @param handler - The handler that will process events of this type
   */
  registerHandler(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, handler);
  }
  
  /**
   * Initializes learning components
   */
  private initializeLearningSystem(): void {
    this.learningUI = new BrowserLearningUI();
    this.playwrightRecorder = new BrowserPlaywrightRecorder();
    this.automationManager = new AutomationManager();
    
    // Register built-in handlers for learning events
    this.registerHandler('userGuidanceRequested', {
      handle: this.handleUserGuidanceRequest.bind(this),
      canHandle: (eventType: string) => eventType === 'userGuidanceRequested'
    });
    
    this.registerHandler('automationRequested', {
      handle: this.handleAutomationRequest.bind(this),
      canHandle: (eventType: string) => eventType === 'automationRequested'
    });
  }
  
  /**
   * Unregisters an event handler
   * 
   * @param eventType - The event type to unregister
   */
  unregisterHandler(eventType: string): void {
    this.handlers.delete(eventType);
  }
  
  /**
   * Connects to the Web-Buddy server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.config.serverUrl.replace(/^http/, 'ws');
        this.websocket = new WebSocket(`${wsUrl}/extension/${this.extensionId}`);
        
        this.websocket.onopen = () => {
          console.log('Web-Buddy extension connected to server');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };
        
        this.websocket.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Check if it's a new event format or legacy message
            if ('eventId' in data) {
              // New event format
              await this.handleEvent(data as WebBuddyEvent);
            } else {
              // Legacy message format
              await this.handleMessage(data as WebBuddyMessage);
            }
          } catch (error) {
            console.error('Error handling event/message:', error);
          }
        };
        
        this.websocket.onclose = () => {
          console.log('Web-Buddy extension disconnected from server');
          this.stopHeartbeat();
          this.attemptReconnect();
        };
        
        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Disconnects from the Web-Buddy server
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }
  }
  
  /**
   * Handles an incoming event from the server
   * 
   * @param event - The event to handle
   */
  private async handleEvent(event: WebBuddyEvent): Promise<void> {
    let response: EventResponse;
    
    try {
      // Find handler for event type
      const handler = this.handlers.get(event.type);
      if (!handler) {
        response = createErrorResponse(
          `No handler registered for event type: ${event.type}`,
          event.correlationId,
          event.eventId
        );
      } else {
        // Execute handler
        const result = await handler.handle(event);
        response = createSuccessResponse(result, event.correlationId, event.eventId);
      }
      
    } catch (error) {
      response = createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error',
        event.correlationId,
        event.eventId
      );
    }
    
    // Send response back to server
    this.sendResponse(response);
  }
  
  /**
   * Legacy method for backward compatibility
   */
  private async handleMessage(message: any): Promise<void> {
    // Convert legacy message to event format
    const event: WebBuddyEvent = {
      type: message.type || 'unknownEvent',
      payload: message.payload || message,
      correlationId: message.correlationId || 'legacy-unknown',
      timestamp: new Date(),
      eventId: `legacy-ext-${Date.now()}`,
      website: message.website,
      tabId: message.tabId
    };
    
    return this.handleEvent(event);
  }
  
  /**
   * Sends a response back to the server
   * 
   * @param response - The response to send
   */
  private sendResponse(response: EventResponse): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(response));
    }
  }
  
  /**
   * Handles automation requests - implements the "reuse this automation?" workflow
   */
  private async handleAutomationRequest(event: WebBuddyEvent): Promise<any> {
    const automationEvent = event as AutomationRequestedEvent;
    
    if (!this.automationManager || !this.learningUI) {
      throw new Error('Learning system not initialized');
    }
    
    // Check for existing automations and user preferences
    const result = await this.automationManager.handleAutomationRequest(automationEvent);
    
    switch (result.action) {
      case 'execute':
        // Execute existing automation immediately
        return await this.executeStoredAutomation(result.automation!, automationEvent);
        
      case 'reuse-prompt':
        // Show "reuse this automation?" dialog
        return await this.handleReusePrompt(result.automation!, automationEvent);
        
      case 'record-new':
        // Start recording new automation
        return await this.startNewRecording(automationEvent);
        
      default:
        throw new Error(`Unknown automation action: ${result.action}`);
    }
  }

  /**
   * Handles user guidance requests for automation learning
   */
  private async handleUserGuidanceRequest(event: WebBuddyEvent): Promise<any> {
    const guidanceEvent = event as UserGuidanceRequestedEvent;
    
    if (!this.learningUI) {
      throw new Error('Learning UI not initialized');
    }
    
    // Show guidance dialog to user
    const userResponse = await this.learningUI.showGuidanceDialog(guidanceEvent);
    
    // Handle user's choice
    if (userResponse.payload.response.action === 'record') {
      await this.startAutomationRecording(guidanceEvent);
    }
    
    // Send user response back to server
    this.sendEventToServer(userResponse);
    
    return {
      status: 'guidanceHandled',
      userChoice: userResponse.payload.response.action
    };
  }
  
  /**
   * Starts automation recording process
   */
  private async startAutomationRecording(guidanceEvent: UserGuidanceRequestedEvent): Promise<void> {
    if (!this.playwrightRecorder || !this.learningUI) {
      throw new Error('Recording components not initialized');
    }
    
    // Show recording indicator
    this.learningUI.showRecordingIndicator();
    
    // Start recording
    this.playwrightRecorder.startRecording({
      eventId: guidanceEvent.payload.requestEventId,
      action: 'automation', // We'll get this from the original request
      parameters: {},
      website: guidanceEvent.website || window.location.hostname
    });
    
    // Set up stop recording listener (user will click a "done" button)
    this.setupRecordingControls(guidanceEvent);
  }
  
  /**
   * Sets up recording control UI
   */
  private setupRecordingControls(guidanceEvent: UserGuidanceRequestedEvent): void {
    // This would inject a small floating UI with "Done Recording" button
    // For now, we'll use a simple setTimeout as a placeholder
    
    // In a real implementation, this would show a floating button
    // that the user can click when they're done demonstrating the automation
    console.log('Recording started. Click "Done" when finished demonstrating the automation.');
    
    // Simulate user clicking "done" after some time (in real implementation, this would be user-triggered)
    setTimeout(() => {
      this.stopAutomationRecording(guidanceEvent);
    }, 30000); // 30 seconds timeout for demo
  }
  
  /**
   * Stops recording and processes the result
   */
  private async stopAutomationRecording(guidanceEvent: UserGuidanceRequestedEvent): Promise<void> {
    if (!this.playwrightRecorder || !this.learningUI) {
      return;
    }
    
    // Stop recording
    const recordingResult = this.playwrightRecorder.stopRecording();
    
    // Hide recording indicator
    this.learningUI.hideRecordingIndicator();
    
    // Show script review dialog
    const reviewResult = await this.learningUI.showScriptReview(recordingResult.script);
    
    if (reviewResult.approved) {
      // Create automation implemented event
      const implementedEvent = new AutomationImplementedEvent(
        {
          requestEventId: guidanceEvent.payload.requestEventId,
          action: 'automation', // Would come from original request
          playwrightScript: recordingResult.script,
          templatedScript: reviewResult.modifiedScript || recordingResult.templatedScript,
          metadata: {
            recordedAt: new Date(),
            websiteUrl: window.location.href,
            recordingDuration: recordingResult.metadata.recordingDuration,
            stepCount: recordingResult.metadata.stepCount,
            elements: recordingResult.actions.map(action => ({
              selector: action.selector,
              action: action.type,
              value: action.value,
              timestamp: action.timestamp
            })),
            screenshots: recordingResult.metadata.screenshots
          }
        },
        guidanceEvent.correlationId,
        guidanceEvent.website,
        guidanceEvent.tabId
      );
      
      // Send implementation to server for storage
      this.sendEventToServer(implementedEvent);
    }
  }
  
  /**
   * Execute a stored automation
   */
  private async executeStoredAutomation(automation: StoredAutomation, event: AutomationRequestedEvent): Promise<any> {
    if (!this.automationManager) {
      throw new Error('Automation manager not initialized');
    }
    
    const result = await this.automationManager.executeAutomation(
      automation.id,
      event.payload.parameters,
      event.payload.context
    );
    
    return {
      status: 'executed',
      automation: {
        id: automation.id,
        action: automation.action,
        lastUsed: automation.metadata.lastUsed
      },
      result: result.result,
      executionTime: result.executionTime,
      success: result.success
    };
  }

  /**
   * Handle reuse prompt dialog
   */
  private async handleReusePrompt(automation: StoredAutomation, event: AutomationRequestedEvent): Promise<any> {
    if (!this.learningUI || !this.automationManager) {
      throw new Error('Learning system not initialized');
    }
    
    // Show reuse dialog to user
    const userChoice = await this.learningUI.showReuseDialog(automation, event);
    
    // Save user preference if specified
    if (userChoice.doNotAskFor) {
      this.automationManager.setUserPreference(
        event.type,
        event.payload.action,
        event.website || 'any',
        userChoice
      );
    }
    
    // Handle user's choice
    switch (userChoice.action) {
      case 'reuse':
        return await this.executeStoredAutomation(automation, event);
      case 'record-new':
        return await this.startNewRecording(event);
      case 'skip':
        return { status: 'skipped', message: 'User chose to skip automation' };
      default:
        throw new Error(`Unknown user choice: ${userChoice.action}`);
    }
  }

  /**
   * Start recording a new automation
   */
  private async startNewRecording(event: AutomationRequestedEvent): Promise<any> {
    // Create a user guidance event to start the recording workflow
    const guidanceEvent = new UserGuidanceRequestedEvent(
      {
        requestEventId: event.eventId,
        guidanceType: 'record',
        prompt: `No automation exists for "${event.payload.action}". Would you like to record one?`,
        options: [
          {
            id: 'record',
            label: 'Record New Automation',
            description: 'Start recording your actions to create an automation'
          },
          {
            id: 'cancel',
            label: 'Cancel',
            description: 'Skip automation for now'
          }
        ],
        timeoutMs: 300000 // 5 minutes
      },
      event.correlationId,
      event.website,
      event.tabId
    );
    
    return await this.handleUserGuidanceRequest(guidanceEvent);
  }

  /**
   * Sends an event to the server
   */
  private sendEventToServer(event: WebBuddyEvent): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(event));
    }
  }
  
  /**
   * Attempts to reconnect to the server
   */
  private attemptReconnect(): void {
    const maxAttempts = this.config.maxReconnectAttempts || 5;
    const interval = this.config.reconnectInterval || 5000;
    
    if (this.reconnectAttempts >= maxAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${maxAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will retry automatically
      });
    }, interval);
  }
  
  /**
   * Starts the heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    const interval = this.config.heartbeatInterval || 30000; // 30 seconds
    
    this.heartbeatTimer = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'HEARTBEAT',
          timestamp: new Date().toISOString(),
          extensionId: this.extensionId
        }));
      }
    }, interval);
  }
  
  /**
   * Stops the heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
  
  /**
   * Generates a unique extension ID
   */
  private generateExtensionId(): string {
    return `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Gets the extension ID
   */
  getExtensionId(): string {
    return this.extensionId;
  }
  
  /**
   * Checks if the extension is connected to the server
   */
  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }
  
  /**
   * Gets registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

/**
 * Browser-based implementation of learning user interface
 */
class BrowserLearningUI implements LearningUserInterface {
  private currentDialog?: HTMLElement;
  private recordingIndicator?: HTMLElement;
  
  async showReuseDialog(automation: StoredAutomation, event: AutomationRequestedEvent): Promise<ReusePreference> {
    return new Promise((resolve) => {
      const dialog = this.createReuseDialog(automation, event, (preference) => {
        this.removeDialog();
        resolve(preference);
      });
      
      document.body.appendChild(dialog);
      this.currentDialog = dialog;
    });
  }
  
  async showGuidanceDialog(event: UserGuidanceRequestedEvent): Promise<UserGuidanceProvidedEvent> {
    return new Promise((resolve) => {
      // Create modal dialog
      const dialog = this.createGuidanceDialog(event, (response) => {
        this.removeDialog();
        
        const userResponse = new UserGuidanceProvidedEvent(
          {
            requestEventId: event.payload.requestEventId,
            guidanceRequestId: event.eventId,
            response,
            providedAt: new Date()
          },
          event.correlationId,
          event.website,
          event.tabId
        );
        
        resolve(userResponse);
      });
      
      // Add to page
      document.body.appendChild(dialog);
      this.currentDialog = dialog;
    });
  }
  
  showRecordingIndicator(): void {
    const indicator = document.createElement('div');
    indicator.id = 'web-buddy-recording-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      ">
        🔴 Recording Web Automation...
        <div style="font-size: 12px; margin-top: 5px;">
          Demonstrate the action you want to automate
        </div>
      </div>
    `;
    
    document.body.appendChild(indicator);
    this.recordingIndicator = indicator;
  }
  
  hideRecordingIndicator(): void {
    if (this.recordingIndicator) {
      this.recordingIndicator.remove();
      this.recordingIndicator = undefined;
    }
  }
  
  async showScriptReview(script: string): Promise<{ approved: boolean; modifiedScript?: string }> {
    return new Promise((resolve) => {
      const dialog = this.createScriptReviewDialog(script, (result) => {
        this.removeDialog();
        resolve(result);
      });
      
      document.body.appendChild(dialog);
      this.currentDialog = dialog;
    });
  }
  
  private createGuidanceDialog(
    event: UserGuidanceRequestedEvent,
    onResponse: (response: any) => void
  ): HTMLElement {
    const dialog = document.createElement('div');
    dialog.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
      ">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 10px;
          max-width: 500px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        ">
          <h2 style="margin: 0 0 15px 0; color: #333;">
            ${event.payload.guidanceType === 'record' ? '🤖 Automation Learning' : '❓ User Guidance Needed'}
          </h2>
          <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
            ${event.payload.prompt}
          </p>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            ${event.payload.options?.map(option => `
              <button 
                onclick="handleGuidanceChoice('${option.id}')"
                style="
                  padding: 8px 16px;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
                  font-size: 14px;
                  ${option.id === 'record' ? 'background: #007cba; color: white;' : 'background: #f0f0f0; color: #333;'}
                "
              >
                ${option.label}
              </button>
            `).join('') || ''}
          </div>
        </div>
      </div>
    `;
    
    // Add event handler
    (window as any).handleGuidanceChoice = (optionId: string) => {
      onResponse({
        action: optionId,
        selectedOptionId: optionId
      });
    };
    
    return dialog;
  }
  
  private createScriptReviewDialog(
    script: string,
    onResponse: (result: { approved: boolean; modifiedScript?: string }) => void
  ): HTMLElement {
    const dialog = document.createElement('div');
    dialog.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
      ">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 10px;
          max-width: 700px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        ">
          <h2 style="margin: 0 0 15px 0; color: #333;">📝 Review Generated Script</h2>
          <p style="margin: 0 0 15px 0; color: #666;">
            Review the generated Playwright script and make any necessary adjustments:
          </p>
          <textarea 
            id="script-editor"
            style="
              width: 100%;
              height: 300px;
              font-family: monospace;
              font-size: 12px;
              border: 1px solid #ddd;
              border-radius: 5px;
              padding: 10px;
              resize: vertical;
            "
          >${script}</textarea>
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px;">
            <button 
              onclick="handleScriptReview(false)"
              style="
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                background: #f0f0f0;
                color: #333;
              "
            >
              Cancel
            </button>
            <button 
              onclick="handleScriptReview(true)"
              style="
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                background: #007cba;
                color: white;
              "
            >
              Approve & Save
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add event handler
    (window as any).handleScriptReview = (approved: boolean) => {
      const textarea = dialog.querySelector('#script-editor') as HTMLTextAreaElement;
      onResponse({
        approved,
        modifiedScript: approved ? textarea.value : undefined
      });
    };
    
    return dialog;
  }
  
  private createReuseDialog(
    automation: StoredAutomation,
    event: AutomationRequestedEvent,
    onResponse: (preference: ReusePreference) => void
  ): HTMLElement {
    const dialog = document.createElement('div');
    const lastUsed = automation.metadata.lastUsed 
      ? new Date(automation.metadata.lastUsed).toLocaleDateString()
      : 'Never';
    
    dialog.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
      ">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 10px;
          max-width: 600px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        ">
          <h2 style="margin: 0 0 15px 0; color: #333;">
            🔄 Reuse Existing Automation?
          </h2>
          <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <strong>Found automation for "${automation.action}"</strong><br>
            <small style="color: #666;">
              • Used ${automation.metadata.useCount} times<br>
              • Last used: ${lastUsed}<br>
              • Confidence: ${Math.round(automation.metadata.confidence * 100)}%<br>
              • Website: ${automation.website}
            </small>
          </div>
          <details style="margin-bottom: 20px;">
            <summary style="cursor: pointer; font-weight: bold; margin-bottom: 10px;">
              📋 Preview Script (click to expand)
            </summary>
            <pre style="
              background: #f4f4f4;
              padding: 10px;
              border-radius: 5px;
              font-size: 11px;
              overflow-x: auto;
              max-height: 200px;
              overflow-y: auto;
            ">${automation.playwrightScript}</pre>
          </details>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px;">
              <input type="checkbox" id="dont-ask-checkbox" style="margin-right: 8px;">
              Don't ask again for:
            </label>
            <select id="dont-ask-duration" style="margin-left: 20px; padding: 5px;">
              <option value="">This time only</option>
              <option value="times-5">Next 5 times</option>
              <option value="times-10">Next 10 times</option>
              <option value="duration-30">Next 30 minutes</option>
              <option value="duration-60">Next 60 minutes</option>
              <option value="duration-1440">Next 24 hours</option>
            </select>
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button 
              onclick="handleReuseChoice('skip')"
              style="
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                background: #f0f0f0;
                color: #333;
              "
            >
              Skip
            </button>
            <button 
              onclick="handleReuseChoice('record-new')"
              style="
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                background: #ffc107;
                color: #333;
              "
            >
              Record New
            </button>
            <button 
              onclick="handleReuseChoice('reuse')"
              style="
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                background: #007cba;
                color: white;
              "
            >
              ✅ Reuse This
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add event handler
    (window as any).handleReuseChoice = (action: string) => {
      const dontAskCheckbox = dialog.querySelector('#dont-ask-checkbox') as HTMLInputElement;
      const durationSelect = dialog.querySelector('#dont-ask-duration') as HTMLSelectElement;
      
      let doNotAskFor: ReusePreference['doNotAskFor'] = undefined;
      
      if (dontAskCheckbox.checked && durationSelect.value) {
        const [type, valueStr] = durationSelect.value.split('-');
        doNotAskFor = {
          type: type as 'times' | 'duration',
          value: parseInt(valueStr)
        };
      }
      
      onResponse({
        action: action as 'reuse' | 'record-new' | 'skip',
        doNotAskFor
      });
    };
    
    return dialog;
  }

  private removeDialog(): void {
    if (this.currentDialog) {
      this.currentDialog.remove();
      this.currentDialog = undefined;
    }
  }
}

/**
 * Browser-based implementation of Playwright recorder
 */
class BrowserPlaywrightRecorder implements PlaywrightRecorder {
  private recording = false;
  private actions: RecordedAction[] = [];
  private startTime = 0;
  private context?: RecordingContext;
  
  startRecording(context: RecordingContext): void {
    this.recording = true;
    this.actions = [];
    this.startTime = Date.now();
    this.context = context;
    
    // Set up event listeners for recording
    this.setupEventListeners();
  }
  
  stopRecording(): PlaywrightScript {
    this.recording = false;
    this.removeEventListeners();
    
    const script = this.generatePlaywrightScript();
    const templatedScript = this.templateScript(script);
    
    return {
      script,
      templatedScript,
      actions: this.actions,
      metadata: {
        recordingDuration: Date.now() - this.startTime,
        stepCount: this.actions.length
      }
    };
  }
  
  isRecording(): boolean {
    return this.recording;
  }
  
  getRecordedActions(): RecordedAction[] {
    return [...this.actions];
  }
  
  private setupEventListeners(): void {
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('input', this.handleInput, true);
    document.addEventListener('change', this.handleChange, true);
  }
  
  private removeEventListeners(): void {
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('input', this.handleInput, true);
    document.removeEventListener('change', this.handleChange, true);
  }
  
  private handleClick = (event: Event): void => {
    if (!this.recording) return;
    
    const target = event.target as HTMLElement;
    const selector = this.generateSelector(target);
    
    this.actions.push({
      type: 'click',
      selector,
      timestamp: Date.now() - this.startTime,
      metadata: {
        tagName: target.tagName,
        className: target.className,
        text: target.textContent?.trim()?.substring(0, 50)
      }
    });
  };
  
  private handleInput = (event: Event): void => {
    if (!this.recording) return;
    
    const target = event.target as HTMLInputElement;
    const selector = this.generateSelector(target);
    
    this.actions.push({
      type: 'fill',
      selector,
      value: target.value,
      timestamp: Date.now() - this.startTime,
      metadata: {
        inputType: target.type,
        placeholder: target.placeholder
      }
    });
  };
  
  private handleChange = (event: Event): void => {
    if (!this.recording) return;
    
    const target = event.target as HTMLSelectElement;
    if (target.tagName === 'SELECT') {
      const selector = this.generateSelector(target);
      
      this.actions.push({
        type: 'select',
        selector,
        value: target.value,
        timestamp: Date.now() - this.startTime,
        metadata: {
          selectedText: target.options[target.selectedIndex]?.text
        }
      });
    }
  };
  
  private generateSelector(element: HTMLElement): string {
    // Simple selector generation - in a real implementation, this would be more sophisticated
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      return `.${element.className.split(' ')[0]}`;
    }
    
    // Fallback to tag name and position
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element);
      return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
    }
    
    return element.tagName.toLowerCase();
  }
  
  private generatePlaywrightScript(): string {
    let script = `// Auto-generated Playwright script\n`;
    script += `import { test, expect } from '@playwright/test';\n\n`;
    script += `test('recorded automation', async ({ page }) => {\n`;
    script += `  await page.goto('${window.location.href}');\n\n`;
    
    for (const action of this.actions) {
      switch (action.type) {
        case 'click':
          script += `  await page.click('${action.selector}');\n`;
          break;
        case 'fill':
          script += `  await page.fill('${action.selector}', '${action.value}');\n`;
          break;
        case 'select':
          script += `  await page.selectOption('${action.selector}', '${action.value}');\n`;
          break;
      }
    }
    
    script += `});\n`;
    return script;
  }
  
  private templateScript(script: string): string {
    // Replace hardcoded values with payload placeholders
    let templatedScript = script;
    
    // This is a simple implementation - a real version would be more sophisticated
    if (this.context?.parameters) {
      for (const [key, value] of Object.entries(this.context.parameters)) {
        const regex = new RegExp(`'${value}'`, 'g');
        templatedScript = templatedScript.replace(regex, `\${payload.${key}}`);
      }
    }
    
    return templatedScript;
  }
}

/**
 * Content script integration helper
 * Facilitates communication between background script and content scripts
 */
export class ContentScriptIntegration {
  private extension: WebBuddyExtension;
  
  constructor(extension: WebBuddyExtension) {
    this.extension = extension;
    this.setupContentScriptCommunication();
  }
  
  /**
   * Sets up communication with content scripts
   */
  private setupContentScriptCommunication(): void {
    // Listen for messages from content scripts
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
        if (message.type && message.correlationId) {
          // Forward content script messages to server
          this.handleContentScriptMessage(message)
            .then(sendResponse)
            .catch((error: Error) => {
              sendResponse({
                success: false,
                error: error.message,
                correlationId: message.correlationId
              });
            });
        }
        return true; // Indicates async response
      });
    }
  }
  
  /**
   * Handles messages from content scripts
   * 
   * @param message - Message from content script
   * @returns Promise resolving to response
   */
  private async handleContentScriptMessage(message: any): Promise<any> {
    // Convert content script message to WebBuddyEvent format
    const webBuddyEvent: WebBuddyEvent = {
      type: message.type,
      payload: message.payload || {},
      correlationId: message.correlationId,
      timestamp: new Date(),
      eventId: `content-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      tabId: message.tabId
    };
    
    // Find appropriate handler
    const handler = this.extension['handlers'].get(message.type);
    if (!handler) {
      throw new Error(`No handler registered for event type: ${message.type}`);
    }
    
    // Execute handler
    return await handler.handle(webBuddyEvent);
  }
  
  /**
   * Sends a message to a content script
   * 
   * @param tabId - ID of the tab containing the content script
   * @param message - Message to send
   * @returns Promise resolving to response from content script
   */
  async sendToContentScript(tabId: number, message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.sendMessage(tabId, message, (response: any) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      } else {
        reject(new Error('Chrome tabs API not available'));
      }
    });
  }
}