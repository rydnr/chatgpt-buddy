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

/**
 * Base interface for all Web-Buddy messages
 * Provides the fundamental structure for event-driven communication
 */
export interface WebBuddyMessage {
  readonly type: string;
  readonly payload: Record<string, any>;
  readonly correlationId: string;
  readonly timestamp: Date;
  readonly website?: string;
  readonly tabId?: number;
}

/**
 * Abstract base class for all Web-Buddy messages
 * Implements common functionality and ensures consistent structure
 */
export abstract class BaseMessage implements WebBuddyMessage {
  public abstract readonly type: string;
  public readonly timestamp = new Date();
  public readonly correlationId: string;
  
  constructor(
    public readonly payload: Record<string, any>,
    correlationId?: string,
    public readonly website?: string,
    public readonly tabId?: number
  ) {
    this.correlationId = correlationId || this.generateCorrelationId();
  }
  
  /**
   * Generates a unique correlation ID for message tracking
   */
  private generateCorrelationId(): string {
    return `web-buddy-${Date.now()}-${uuidv4().substr(0, 8)}`;
  }
  
  /**
   * Serializes the message to JSON format for network transmission
   */
  toJSON(): WebBuddyMessage {
    return {
      type: this.type,
      payload: this.payload,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      website: this.website,
      tabId: this.tabId
    };
  }
  
  /**
   * Creates a message from JSON data
   */
  static fromJSON(data: WebBuddyMessage): BaseMessage {
    // This would be implemented by specific message classes
    throw new Error('fromJSON must be implemented by concrete message classes');
  }
}

/**
 * Interface for message handlers that process Web-Buddy messages
 */
export interface MessageHandler {
  handle(message: WebBuddyMessage): Promise<any>;
}

/**
 * Response structure for message handling results
 */
export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
  correlationId: string;
  timestamp: Date;
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(
  data: any,
  correlationId: string
): MessageResponse {
  return {
    success: true,
    data,
    correlationId,
    timestamp: new Date()
  };
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  correlationId: string
): MessageResponse {
  return {
    success: false,
    error,
    correlationId,
    timestamp: new Date()
  };
}