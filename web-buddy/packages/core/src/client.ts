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

import { v4 as uuidv4 } from 'uuid';
import { EventResponse, WebBuddyEvent } from './events/base';
import { AutomationRequestedEvent, AutomationEventFactory } from './events/automation';

/**
 * Configuration interface for WebBuddyClient
 */
export interface WebBuddyClientConfig {
  serverUrl: string;
  timeout?: number;
  apiKey?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Generic Web-Buddy client that provides low-level event-driven API
 * This is the core layer that domain-specific clients build upon
 * Now supports the learning automation system with event-based communication
 */
export class WebBuddyClient {
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;
  
  constructor(private config: WebBuddyClientConfig) {
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000; // 1 second default
  }
  
  /**
   * Core API: Generic event dispatching
   * This is the foundation that all domain-specific wrappers use
   * 
   * @param event - Event object or legacy message for backward compatibility
   * @param options - Optional configuration for this specific event
   * @returns Promise resolving to the event response
   */
  async sendEvent(
    event: WebBuddyEvent | Record<string, any>,
    options?: {
      correlationId?: string;
      tabId?: number;
      timeout?: number;
    }
  ): Promise<any> {
    // Handle both new event objects and legacy message format
    const eventData = this.normalizeEventData(event, options);
    return this.dispatchEvent(eventData, options);
  }
  
  /**
   * Legacy API: Generic message sending (deprecated, use sendEvent instead)
   * Maintained for backward compatibility
   */
  async sendMessage(
    message: Record<string, any>,
    options?: {
      correlationId?: string;
      tabId?: number;
      timeout?: number;
    }
  ): Promise<any> {
    const correlationId = options?.correlationId || this.generateCorrelationId();
    const timeout = options?.timeout || this.timeout;
    
    const requestPayload = {
      ...message,
      correlationId,
      timestamp: new Date().toISOString(),
      ...(options?.tabId && { tabId: options.tabId })
    };
    
    return this.executeWithRetry(async () => {
      const response = await this.makeHttpRequest('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(requestPayload)
      }, timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown server error');
      }
      
      return result.data;
    });
  }
  
  /**
   * New API: Request automation for a specific action
   * This triggers the learning loop if no implementation exists
   */
  async requestAutomation(
    action: string,
    parameters: Record<string, any>,
    options?: {
      website?: string;
      tabId?: number;
      context?: Record<string, any>;
      expectedOutcome?: string;
      timeout?: number;
    }
  ): Promise<any> {
    const event = new AutomationRequestedEvent(
      {
        action,
        parameters,
        context: options?.context,
        expectedOutcome: options?.expectedOutcome
      },
      undefined,
      options?.website,
      options?.tabId
    );
    
    return this.sendEvent(event, { timeout: options?.timeout });
  }
  
  /**
   * Convenience method: Request search automation
   */
  async requestSearch(
    query: string,
    website: string,
    options?: {
      tabId?: number;
      context?: Record<string, any>;
      timeout?: number;
    }
  ): Promise<any> {
    const event = AutomationEventFactory.createSearchRequest(query, website, options?.context);
    return this.sendEvent(event, { 
      tabId: options?.tabId,
      timeout: options?.timeout 
    });
  }
  
  /**
   * Convenience method: Request login automation
   */
  async requestLogin(
    credentials: { username: string; password?: string },
    website: string,
    options?: {
      tabId?: number;
      context?: Record<string, any>;
      timeout?: number;
    }
  ): Promise<any> {
    const event = AutomationEventFactory.createLoginRequest(credentials, website, options?.context);
    return this.sendEvent(event, {
      tabId: options?.tabId,
      timeout: options?.timeout
    });
  }
  
  /**
   * Internal method to normalize event data
   */
  private normalizeEventData(
    event: WebBuddyEvent | Record<string, any>,
    options?: { correlationId?: string; tabId?: number }
  ): WebBuddyEvent {
    // If it's already a proper event, return as-is
    if ('eventId' in event && 'timestamp' in event) {
      return event as WebBuddyEvent;
    }
    
    // Convert legacy message format to event format
    const messageData = event as Record<string, any>;
    const eventType = Object.keys(messageData)[0] || 'unknownEvent';
    
    return {
      type: eventType,
      payload: messageData[eventType] || messageData,
      correlationId: options?.correlationId || this.generateCorrelationId(),
      timestamp: new Date(),
      eventId: `legacy-${Date.now()}-${uuidv4().substr(0, 8)}`,
      tabId: options?.tabId
    };
  }
  
  /**
   * Internal method to dispatch events
   */
  private async dispatchEvent(
    event: WebBuddyEvent,
    options?: { timeout?: number }
  ): Promise<any> {
    const timeout = options?.timeout || this.timeout;
    
    return this.executeWithRetry(async () => {
      const response = await this.makeHttpRequest('/api/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(event)
      }, timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown server error');
      }
      
      return result.data;
    });
  }
  
  /**
   * Batch message sending for efficiency
   * Useful for complex operations that require multiple steps
   * 
   * @param messages - Array of messages to send
   * @returns Promise resolving to array of responses
   */
  async sendMessages(
    messages: Record<string, any>[],
    options?: {
      tabId?: number;
      timeout?: number;
      parallel?: boolean;
    }
  ): Promise<any[]> {
    const parallel = options?.parallel ?? true;
    
    if (parallel) {
      // Execute all messages in parallel for better performance
      const promises = messages.map(message => 
        this.sendMessage(message, {
          tabId: options?.tabId,
          timeout: options?.timeout
        })
      );
      return Promise.all(promises);
    } else {
      // Execute messages sequentially
      const results: any[] = [];
      for (const message of messages) {
        const result = await this.sendMessage(message, {
          tabId: options?.tabId,
          timeout: options?.timeout
        });
        results.push(result);
      }
      return results;
    }
  }
  
  /**
   * Health check to verify server connectivity
   */
  async ping(): Promise<{ success: boolean; latency: number }> {
    const startTime = Date.now();
    
    try {
      await this.sendMessage({ PING: { timestamp: startTime } });
      return {
        success: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime
      };
    }
  }
  
  /**
   * Generates a unique correlation ID for message tracking
   */
  private generateCorrelationId(): string {
    return `web-buddy-${Date.now()}-${uuidv4().substr(0, 8)}`;
  }
  
  /**
   * Makes HTTP request with timeout support
   */
  private async makeHttpRequest(
    path: string,
    init: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(`${this.config.serverUrl}${path}`, {
        ...init,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Executes operation with retry logic
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.retryAttempts) {
          break; // Last attempt, don't wait
        }
        
        // Wait before retrying (exponential backoff)
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`Operation failed after ${this.retryAttempts} attempts: ${lastError.message}`);
  }
}