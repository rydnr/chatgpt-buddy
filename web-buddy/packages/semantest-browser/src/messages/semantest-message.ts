/*
                        Semantest Browser Automation Framework

    Copyright (C) 2025-today  Semantest Team

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

/**
 * @fileoverview Semantest message system
 * @description Core message types for intelligent web automation communication
 */

import { MessagePriority } from '../types/semantest-types';

/**
 * Core Semantest message interface
 */
export interface SemanTestMessage {
  /** Message type identifier */
  readonly type: string;
  
  /** Message payload data */
  readonly payload: Record<string, any>;
  
  /** Correlation ID for request tracking */
  readonly correlationId: string;
  
  /** Message timestamp */
  readonly timestamp: Date;
  
  /** Target domain */
  readonly domain?: string;
  
  /** Message priority */
  readonly priority?: MessagePriority;
  
  /** Message timeout in milliseconds */
  readonly timeout?: number;
  
  /** Enable retry on failure */
  readonly enableRetry?: boolean;
  
  /** Maximum retry attempts */
  readonly maxRetries?: number;
  
  /** Client identification */
  readonly clientId?: string;
  
  /** Message version */
  readonly version?: string;
}

/**
 * Base implementation of Semantest message
 */
export abstract class BaseSemanTestMessage implements SemanTestMessage {
  public abstract readonly type: string;
  public readonly timestamp = new Date();
  
  constructor(
    public readonly payload: Record<string, any>,
    public readonly correlationId: string,
    public readonly domain?: string,
    public readonly priority: MessagePriority = 'normal',
    public readonly timeout?: number,
    public readonly enableRetry: boolean = true,
    public readonly maxRetries: number = 3,
    public readonly clientId?: string,
    public readonly version: string = '2.0.0'
  ) {}

  /**
   * Convert message to JSON for transmission
   */
  toJSON(): Record<string, any> {
    return {
      type: this.type,
      payload: this.payload,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      domain: this.domain,
      priority: this.priority,
      timeout: this.timeout,
      enableRetry: this.enableRetry,
      maxRetries: this.maxRetries,
      clientId: this.clientId,
      version: this.version
    };
  }

  /**
   * Create message from JSON
   */
  static fromJSON(json: any): SemanTestMessage {
    return {
      type: json.type,
      payload: json.payload || {},
      correlationId: json.correlationId,
      timestamp: new Date(json.timestamp),
      domain: json.domain,
      priority: json.priority || 'normal',
      timeout: json.timeout,
      enableRetry: json.enableRetry ?? true,
      maxRetries: json.maxRetries || 3,
      clientId: json.clientId,
      version: json.version || '2.0.0'
    };
  }

  /**
   * Validate message structure
   */
  static validate(message: any): boolean {
    return !!(
      message &&
      typeof message.type === 'string' &&
      message.type.length > 0 &&
      message.payload &&
      typeof message.payload === 'object' &&
      typeof message.correlationId === 'string' &&
      message.correlationId.length > 0
    );
  }

  /**
   * Create error response message
   */
  static createErrorResponse(
    originalMessage: SemanTestMessage,
    error: Error | string
  ): SemanTestMessage {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    return {
      type: 'ERROR_RESPONSE',
      payload: {
        originalType: originalMessage.type,
        error: errorMessage,
        originalPayload: originalMessage.payload
      },
      correlationId: originalMessage.correlationId,
      timestamp: new Date(),
      domain: originalMessage.domain,
      priority: 'high',
      clientId: originalMessage.clientId,
      version: '2.0.0'
    };
  }

  /**
   * Create success response message
   */
  static createSuccessResponse(
    originalMessage: SemanTestMessage,
    result: any
  ): SemanTestMessage {
    return {
      type: 'SUCCESS_RESPONSE',
      payload: {
        originalType: originalMessage.type,
        result: result,
        originalPayload: originalMessage.payload
      },
      correlationId: originalMessage.correlationId,
      timestamp: new Date(),
      domain: originalMessage.domain,
      priority: originalMessage.priority || 'normal',
      clientId: originalMessage.clientId,
      version: '2.0.0'
    };
  }
}

/**
 * Standard Semantest message types
 */
export const SEMANTEST_MESSAGE_TYPES = {
  // Core communication
  PING: 'SEMANTEST_PING',
  PONG: 'SEMANTEST_PONG',
  
  // Contract operations
  EXECUTE_CONTRACT: 'SEMANTEST_EXECUTE_CONTRACT',
  VALIDATE_CONTRACT: 'SEMANTEST_VALIDATE_CONTRACT',
  DISCOVER_CAPABILITIES: 'SEMANTEST_DISCOVER_CAPABILITIES',
  
  // Server operations
  GET_SERVER_INFO: 'SEMANTEST_GET_SERVER_INFO',
  GET_CLIENT_STATUS: 'SEMANTEST_GET_CLIENT_STATUS',
  
  // AI and learning
  ENABLE_AI_LEARNING: 'SEMANTEST_ENABLE_AI_LEARNING',
  TRAIN_AUTOMATION: 'SEMANTEST_TRAIN_AUTOMATION',
  GET_LEARNING_STATUS: 'SEMANTEST_GET_LEARNING_STATUS',
  
  // Monitoring and diagnostics
  GET_PERFORMANCE_METRICS: 'SEMANTEST_GET_PERFORMANCE_METRICS',
  HEALTH_CHECK: 'SEMANTEST_HEALTH_CHECK',
  
  // Responses
  SUCCESS_RESPONSE: 'SEMANTEST_SUCCESS_RESPONSE',
  ERROR_RESPONSE: 'SEMANTEST_ERROR_RESPONSE',
  
  // Events
  CONTRACT_DISCOVERED: 'SEMANTEST_CONTRACT_DISCOVERED',
  AUTOMATION_COMPLETED: 'SEMANTEST_AUTOMATION_COMPLETED',
  LEARNING_UPDATED: 'SEMANTEST_LEARNING_UPDATED',
  PERFORMANCE_ALERT: 'SEMANTEST_PERFORMANCE_ALERT'
} as const;

/**
 * Specific message implementations
 */

export class PingMessage extends BaseSemanTestMessage {
  public readonly type = SEMANTEST_MESSAGE_TYPES.PING;
  
  constructor(
    message: string,
    correlationId: string,
    timestamp?: Date
  ) {
    super(
      { message, timestamp: timestamp || new Date() },
      correlationId,
      undefined,
      'low'
    );
  }
}

export class PongMessage extends BaseSemanTestMessage {
  public readonly type = SEMANTEST_MESSAGE_TYPES.PONG;
  
  constructor(
    originalMessage: string,
    responseMessage: string,
    correlationId: string,
    serverInfo?: any
  ) {
    super(
      { 
        originalMessage, 
        responseMessage, 
        serverInfo,
        timestamp: new Date()
      },
      correlationId,
      undefined,
      'low'
    );
  }
}

export class ExecuteContractMessage extends BaseSemanTestMessage {
  public readonly type = SEMANTEST_MESSAGE_TYPES.EXECUTE_CONTRACT;
  
  constructor(
    contractId: string,
    parameters: Record<string, any>,
    correlationId: string,
    domain?: string
  ) {
    super(
      { contractId, parameters },
      correlationId,
      domain,
      'high'
    );
  }
}

export class DiscoverCapabilitiesMessage extends BaseSemanTestMessage {
  public readonly type = SEMANTEST_MESSAGE_TYPES.DISCOVER_CAPABILITIES;
  
  constructor(
    domain: string,
    correlationId: string,
    includeExamples: boolean = true
  ) {
    super(
      { domain, includeExamples },
      correlationId,
      domain,
      'normal'
    );
  }
}

export class ValidateContractMessage extends BaseSemanTestMessage {
  public readonly type = SEMANTEST_MESSAGE_TYPES.VALIDATE_CONTRACT;
  
  constructor(
    contract: any,
    correlationId: string,
    strict: boolean = false
  ) {
    super(
      { contract, strict },
      correlationId,
      contract.domain,
      'normal'
    );
  }
}