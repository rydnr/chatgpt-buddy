// Copyright 2025-today Semantest Team
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview WebSocket communication adapter for Semantest
 * @author Semantest Team
 * @module infrastructure/semantic-automation/websocket-communication
 */

import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Event } from '../../../domain/event';

/**
 * WebSocket message interface
 */
export interface WebSocketMessage {
  readonly type: string;
  readonly payload: Record<string, any>;
  readonly correlationId: string;
  readonly timestamp: Date;
  readonly clientId?: string;
  readonly version?: string;
}

/**
 * WebSocket connection configuration
 */
export interface WebSocketConfig {
  readonly url: string;
  readonly timeout?: number;
  readonly retries?: number;
  readonly headers?: Record<string, string>;
  readonly clientId?: string;
  readonly debug?: boolean;
}

/**
 * Connection status
 */
export interface ConnectionStatus {
  readonly connected: boolean;
  readonly url: string;
  readonly reconnectAttempts: number;
  readonly lastConnected?: Date;
  readonly lastDisconnected?: Date;
  readonly pendingMessages: number;
}

/**
 * Message handler function type
 */
export type MessageHandler = (message: WebSocketMessage) => Promise<void> | void;

/**
 * WebSocket communication adapter for Semantest framework
 * Provides reliable WebSocket communication with automatic reconnection and message correlation
 */
export class WebSocketCommunicationAdapter {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private pendingMessages = new Map<string, PendingMessage>();
  private messageHandlers = new Map<string, MessageHandler[]>();
  private eventListeners = new Map<string, Function[]>();
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(private config: WebSocketConfig) {
    this.validateConfig();
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.establishConnection();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      this.log('Connected to Semantest server', 'info');
      this.emit('connected', { 
        url: this.config.url,
        timestamp: new Date() 
      });
      
    } catch (error) {
      this.log(`Failed to connect: ${error.message}`, 'error');
      throw new Error(`WebSocket connection failed: ${error.message}`);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.ws) {
      return;
    }

    this.isConnected = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.ws.close(1000, 'Client disconnect');
    this.ws = null;
    
    this.log('Disconnected from Semantest server', 'info');
    this.emit('disconnected', { 
      url: this.config.url,
      timestamp: new Date() 
    });
  }

  /**
   * Send message through WebSocket
   */
  async sendMessage(type: string, payload: Record<string, any>, options?: {
    correlationId?: string;
    timeout?: number;
    expectResponse?: boolean;
  }): Promise<any> {
    if (!this.isConnected) {
      await this.connect();
    }

    const message = this.createMessage(type, payload, options?.correlationId);
    
    if (options?.expectResponse) {
      return new Promise((resolve, reject) => {
        const timeoutMs = options?.timeout || this.config.timeout || 30000;
        const timeoutId = setTimeout(() => {
          this.pendingMessages.delete(message.correlationId);
          reject(new Error(`Message timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        this.pendingMessages.set(message.correlationId, {
          resolve,
          reject,
          timeoutId,
          message,
          retryCount: 0
        });

        this.sendMessageToServer(message);
      });
    } else {
      this.sendMessageToServer(message);
    }
  }

  /**
   * Register message handler for specific message type
   */
  onMessage(messageType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  /**
   * Remove message handler
   */
  offMessage(messageType: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Register event listener
   */
  on(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return {
      connected: this.isConnected,
      url: this.config.url,
      reconnectAttempts: this.reconnectAttempts,
      pendingMessages: this.pendingMessages.size
    };
  }

  /**
   * Send domain event through WebSocket
   */
  async publishEvent(event: Event): Promise<void> {
    await this.sendMessage('DOMAIN_EVENT', {
      eventType: event.constructor.name,
      payload: event.payload,
      timestamp: new Date()
    });
  }

  /**
   * Private methods
   */

  private validateConfig(): void {
    if (!this.config.url) {
      throw new Error('WebSocket URL is required');
    }

    if (!this.config.url.startsWith('ws://') && !this.config.url.startsWith('wss://')) {
      throw new Error('WebSocket URL must start with ws:// or wss://');
    }
  }

  private async establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsOptions: any = {
        headers: {
          'User-Agent': 'Semantest WebSocket Client/2.0',
          ...this.config.headers
        }
      };

      this.ws = new WebSocket(this.config.url, wsOptions);

      this.ws.on('open', () => {
        this.setupWebSocketHandlers();
        resolve();
      });

      this.ws.on('error', (error) => {
        reject(error);
      });
    });
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleIncomingMessage(message);
      } catch (error) {
        this.log(`Failed to parse incoming message: ${error.message}`, 'error');
      }
    });

    this.ws.on('close', (code, reason) => {
      this.isConnected = false;
      this.log(`Connection closed: ${code} ${reason}`, 'warn');
      
      if (code !== 1000) { // Not a normal closure
        this.handleConnectionLoss();
      }
    });

    this.ws.on('error', (error) => {
      this.log(`WebSocket error: ${error.message}`, 'error');
      this.emit('error', { error, timestamp: new Date() });
    });
  }

  private createMessage(
    type: string, 
    payload: Record<string, any>, 
    correlationId?: string
  ): WebSocketMessage {
    return {
      type,
      payload,
      correlationId: correlationId || uuidv4(),
      timestamp: new Date(),
      clientId: this.config.clientId || 'semantest-client',
      version: '2.0.0'
    };
  }

  private sendMessageToServer(message: WebSocketMessage): void {
    if (!this.ws || !this.isConnected) {
      throw new Error('Not connected to WebSocket server');
    }

    try {
      this.ws.send(JSON.stringify(message));
      this.emit('message_sent', { 
        type: message.type, 
        correlationId: message.correlationId,
        timestamp: new Date() 
      });
      
      this.log(`Sent message: ${message.type} (${message.correlationId})`, 'debug');
      
    } catch (error) {
      this.log(`Failed to send message: ${error.message}`, 'error');
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  private async handleIncomingMessage(message: WebSocketMessage): Promise<void> {
    this.emit('message_received', { 
      type: message.type, 
      correlationId: message.correlationId,
      timestamp: new Date() 
    });

    // Handle pending message responses
    const pending = this.pendingMessages.get(message.correlationId);
    if (pending) {
      clearTimeout(pending.timeoutId);
      this.pendingMessages.delete(message.correlationId);

      if (message.type === 'ERROR_RESPONSE') {
        pending.reject(new Error(message.payload.error || 'Unknown error'));
      } else {
        pending.resolve(message.payload);
      }
      return;
    }

    // Handle message type handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(message);
        } catch (error) {
          this.log(`Message handler error: ${error.message}`, 'error');
        }
      }
    } else {
      // Handle unsolicited messages
      this.emit('unsolicited_message', { message, timestamp: new Date() });
    }
  }

  private async handleConnectionLoss(): Promise<void> {
    const maxRetries = this.config.retries || 3;
    
    if (this.reconnectAttempts >= maxRetries) {
      this.log('Maximum reconnection attempts reached', 'error');
      this.emit('connection_failed', { 
        attempts: this.reconnectAttempts, 
        timestamp: new Date() 
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
    
    this.log(`Attempting reconnection ${this.reconnectAttempts} in ${delay}ms`, 'info');
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.log(`Reconnection attempt ${this.reconnectAttempts} failed: ${error.message}`, 'error');
        this.handleConnectionLoss();
      }
    }, delay);
  }

  private emit(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          this.log(`Event listener error: ${error.message}`, 'error');
        }
      });
    }
  }

  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void {
    if (!this.config.debug && level === 'debug') {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [WebSocket Adapter] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'debug':
        console.log(`${prefix} ${message}`);
        break;
      case 'info':
        console.info(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
    }
  }
}

/**
 * Internal interface for pending messages
 */
interface PendingMessage {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeoutId: NodeJS.Timeout;
  message: WebSocketMessage;
  retryCount: number;
}