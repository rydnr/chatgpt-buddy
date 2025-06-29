/*
                        Web-Buddy Core - Event System

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

/**
 * Base interface for all Web-Buddy events
 * Events represent meaningful business occurrences that can change system state
 */
export interface WebBuddyEvent {
  readonly type: string;
  readonly payload: Record<string, any>;
  readonly correlationId: string;
  readonly timestamp: Date;
  readonly website?: string;
  readonly tabId?: number;
  readonly eventId: string;
}

/**
 * Enhanced event interface for automation learning system
 * Includes context about whether this is a learning scenario
 */
export interface AutomationEvent extends WebBuddyEvent {
  readonly eventType: 'request' | 'implementation' | 'success' | 'failure';
  readonly learningContext?: {
    isFirstTime: boolean;
    hasStoredImplementation: boolean;
    implementationId?: string;
    userGuidanceRequired?: boolean;
  };
}

/**
 * Abstract base class for all Web-Buddy events
 * Implements common functionality and ensures consistent structure
 */
export abstract class BaseEvent implements WebBuddyEvent {
  public abstract readonly type: string;
  public readonly timestamp = new Date();
  public readonly correlationId: string;
  public readonly eventId: string;
  
  constructor(
    public readonly payload: Record<string, any>,
    correlationId?: string,
    public readonly website?: string,
    public readonly tabId?: number
  ) {
    this.correlationId = correlationId || this.generateCorrelationId();
    this.eventId = this.generateEventId();
  }
  
  /**
   * Generates a unique correlation ID for event tracking across system boundaries
   */
  private generateCorrelationId(): string {
    return `web-buddy-${Date.now()}-${uuidv4().substr(0, 8)}`;
  }
  
  /**
   * Generates a unique event ID for this specific event instance
   */
  private generateEventId(): string {
    return `event-${Date.now()}-${uuidv4().substr(0, 12)}`;
  }
  
  /**
   * Serializes the event to JSON format for network transmission
   */
  toJSON(): WebBuddyEvent {
    return {
      type: this.type,
      payload: this.payload,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      website: this.website,
      tabId: this.tabId,
      eventId: this.eventId
    };
  }
  
  /**
   * Creates an event from JSON data
   */
  static fromJSON(data: WebBuddyEvent): BaseEvent {
    // This would be implemented by specific event classes
    throw new Error('fromJSON must be implemented by concrete event classes');
  }
}

/**
 * Interface for event handlers that process Web-Buddy events
 * Event handlers represent the business logic for responding to events
 */
export interface EventHandler {
  handle(event: WebBuddyEvent): Promise<any>;
  canHandle(eventType: string): boolean;
}

/**
 * Response structure for event handling results
 */
export interface EventResponse {
  success: boolean;
  data?: any;
  error?: string;
  correlationId: string;
  eventId: string;
  timestamp: Date;
  resultingEvents?: WebBuddyEvent[]; // Events that this handler might emit
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(
  data: any,
  correlationId: string,
  eventId: string,
  resultingEvents?: WebBuddyEvent[]
): EventResponse {
  return {
    success: true,
    data,
    correlationId,
    eventId,
    timestamp: new Date(),
    resultingEvents
  };
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  correlationId: string,
  eventId: string
): EventResponse {
  return {
    success: false,
    error,
    correlationId,
    eventId,
    timestamp: new Date()
  };
}

/**
 * Event priority levels for processing order
 */
export enum EventPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Event metadata for enhanced processing
 */
export interface EventMetadata {
  priority: EventPriority;
  retryCount: number;
  maxRetries: number;
  timeout: number;
  tags: string[];
}

/**
 * Enhanced event with metadata for advanced processing
 */
export interface MetadataEvent extends WebBuddyEvent {
  metadata: EventMetadata;
}