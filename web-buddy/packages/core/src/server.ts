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

import { WebBuddyEvent, EventHandler, EventResponse, createSuccessResponse, createErrorResponse } from './events/base';
import { AutomationRequestedEvent, UserGuidanceRequestedEvent } from './events/automation';
import { WebBuddyMessage } from './messages/base'; // Legacy support

/**
 * Configuration interface for WebBuddyServer
 */
export interface WebBuddyServerConfig {
  port?: number;
  host?: string;
  cors?: {
    enabled: boolean;
    origins?: string[];
  };
  rateLimit?: {
    enabled: boolean;
    windowMs?: number;
    maxRequests?: number;
  };
  authentication?: {
    enabled: boolean;
    apiKeys?: string[];
  };
}

/**
 * Extension connection interface for WebSocket management
 */
export interface ExtensionConnection {
  id: string;
  websocket: any; // WebSocket instance
  tabId?: number;
  lastSeen: Date;
  metadata?: Record<string, any>;
}

/**
 * Generic Web-Buddy server that provides event routing infrastructure
 * Domain-specific implementations register their handlers with this server
 * Now supports the learning automation system with event-driven architecture
 */
export class WebBuddyServer {
  private handlers = new Map<string, EventHandler>();
  private eventListeners = new Map<string, Array<(event: WebBuddyEvent) => void>>();
  private extensions = new Map<string, ExtensionConnection>();
  private messageQueue = new Map<string, WebBuddyMessage[]>();
  
  constructor(private config: WebBuddyServerConfig = {}) {}
  
  /**
   * Registers an event handler for a specific event type
   * Domain implementations use this to register their handlers
   * 
   * @param eventType - The type of event to handle (e.g., 'searchRequested', 'automationRequested')
   * @param handler - The handler that will process events of this type
   */
  registerHandler(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, handler);
  }
  
  /**
   * Registers an event listener for a specific event type
   * Used for reactive programming and event-driven workflows
   */
  addEventListener(eventType: string, listener: (event: WebBuddyEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
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
   * Removes an event listener
   */
  removeEventListener(eventType: string, listener: (event: WebBuddyEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Gets all registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
  
  /**
   * Handles an incoming event by routing it to the appropriate handler
   * Also triggers event listeners for reactive workflows
   * 
   * @param event - The event to handle
   * @returns Promise resolving to event response
   */
  async handleEvent(event: WebBuddyEvent): Promise<EventResponse> {
    try {
      // Validate event structure
      if (!event.type || !event.correlationId || !event.eventId) {
        return createErrorResponse(
          'Invalid event: missing type, correlationId, or eventId',
          event.correlationId || 'unknown',
          event.eventId || 'unknown'
        );
      }
      
      // Trigger event listeners first (non-blocking)
      this.triggerEventListeners(event);
      
      // Find handler for event type
      const handler = this.handlers.get(event.type);
      if (!handler) {
        // For automation events, trigger learning workflow if no handler exists
        if (event.type === 'automationRequested') {
          return await this.handleAutomationLearning(event as AutomationRequestedEvent);
        }
        
        return createErrorResponse(
          `No handler registered for event type: ${event.type}`,
          event.correlationId,
          event.eventId
        );
      }
      
      // Execute handler
      const result = await handler.handle(event);
      
      return createSuccessResponse(result, event.correlationId, event.eventId);
      
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error',
        event.correlationId,
        event.eventId
      );
    }
  }
  
  /**
   * Legacy method for backward compatibility
   */
  async handleMessage(message: any): Promise<EventResponse> {
    // Convert legacy message to event format
    const event: WebBuddyEvent = {
      type: message.type || 'unknownEvent',
      payload: message.payload || message,
      correlationId: message.correlationId || 'legacy-unknown',
      timestamp: new Date(),
      eventId: `legacy-${Date.now()}`,
      website: message.website,
      tabId: message.tabId
    };
    
    return this.handleEvent(event);
  }
  
  /**
   * Triggers event listeners for reactive workflows
   */
  private triggerEventListeners(event: WebBuddyEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      // Execute listeners asynchronously to avoid blocking main flow
      Promise.all(listeners.map(async (listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Event listener error for ${event.type}:`, error);
        }
      }));
    }
  }
  
  /**
   * Handles automation learning workflow when no implementation exists
   */
  private async handleAutomationLearning(event: AutomationRequestedEvent): Promise<EventResponse> {
    // Check if we have a stored implementation for this action
    // This would integrate with the storage system we'll build later
    
    // For now, trigger user guidance request
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
    
    // Forward to browser extension for user interaction
    await this.forwardToExtension('default', guidanceEvent);
    
    return createSuccessResponse(
      {
        status: 'learningTriggered',
        message: 'User guidance requested for automation learning',
        guidanceEventId: guidanceEvent.eventId
      },
      event.correlationId,
      event.eventId
    );
  }
  
  /**
   * Registers a browser extension connection
   * 
   * @param connection - Extension connection details
   */
  registerExtension(connection: ExtensionConnection): void {
    this.extensions.set(connection.id, connection);
  }
  
  /**
   * Unregisters a browser extension connection
   * 
   * @param extensionId - ID of the extension to unregister
   */
  unregisterExtension(extensionId: string): void {
    this.extensions.delete(extensionId);
  }
  
  /**
   * Gets an extension connection by ID
   * 
   * @param extensionId - ID of the extension
   * @returns Extension connection or undefined if not found
   */
  getExtension(extensionId: string): ExtensionConnection | undefined {
    return this.extensions.get(extensionId);
  }
  
  /**
   * Gets all active extension connections
   */
  getActiveExtensions(): ExtensionConnection[] {
    return Array.from(this.extensions.values());
  }
  
  /**
   * Forwards a message to a specific browser extension
   * 
   * @param extensionId - Target extension ID
   * @param message - Message to forward
   * @returns Promise resolving to success status
   */
  async forwardToExtension(extensionId: string, message: WebBuddyMessage): Promise<boolean> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }
    
    try {
      // Send message via WebSocket
      extension.websocket.send(JSON.stringify(message));
      extension.lastSeen = new Date();
      return true;
    } catch (error) {
      // Remove dead connection
      this.extensions.delete(extensionId);
      throw new Error(`Failed to forward message to extension ${extensionId}: ${error}`);
    }
  }
  
  /**
   * Broadcasts a message to all active extensions
   * 
   * @param message - Message to broadcast
   * @returns Array of extension IDs that successfully received the message
   */
  async broadcastToExtensions(message: WebBuddyMessage): Promise<string[]> {
    const successful: string[] = [];
    const failed: string[] = [];
    
    for (const [extensionId, extension] of this.extensions) {
      try {
        extension.websocket.send(JSON.stringify(message));
        extension.lastSeen = new Date();
        successful.push(extensionId);
      } catch (error) {
        failed.push(extensionId);
      }
    }
    
    // Clean up failed connections
    failed.forEach(id => this.extensions.delete(id));
    
    return successful;
  }
  
  /**
   * Queues a message for delivery when an extension connects
   * 
   * @param extensionId - Target extension ID
   * @param message - Message to queue
   */
  queueMessage(extensionId: string, message: WebBuddyMessage): void {
    const queue = this.messageQueue.get(extensionId) || [];
    queue.push(message);
    this.messageQueue.set(extensionId, queue);
  }
  
  /**
   * Delivers queued messages to a newly connected extension
   * 
   * @param extensionId - Extension ID that just connected
   */
  async deliverQueuedMessages(extensionId: string): Promise<void> {
    const queue = this.messageQueue.get(extensionId) || [];
    if (queue.length === 0) return;
    
    for (const message of queue) {
      try {
        await this.forwardToExtension(extensionId, message);
      } catch (error) {
        console.error(`Failed to deliver queued message to ${extensionId}:`, error);
      }
    }
    
    // Clear the queue after delivery
    this.messageQueue.delete(extensionId);
  }
  
  /**
   * Cleans up stale connections and old queued messages
   * Should be called periodically
   */
  cleanup(maxAge: number = 300000): void { // 5 minutes default
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - maxAge);
    
    // Remove stale extensions
    for (const [extensionId, extension] of this.extensions) {
      if (extension.lastSeen < staleThreshold) {
        this.extensions.delete(extensionId);
      }
    }
    
    // Clean up queued messages for non-existent extensions
    for (const extensionId of this.messageQueue.keys()) {
      if (!this.extensions.has(extensionId)) {
        this.messageQueue.delete(extensionId);
      }
    }
  }
  
  /**
   * Gets server statistics
   */
  getStats(): {
    activeExtensions: number;
    registeredHandlers: number;
    queuedMessages: number;
  } {
    return {
      activeExtensions: this.extensions.size,
      registeredHandlers: this.handlers.size,
      queuedMessages: Array.from(this.messageQueue.values()).reduce(
        (total, queue) => total + queue.length,
        0
      )
    };
  }
}