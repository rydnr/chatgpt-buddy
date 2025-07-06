/**
 * @fileoverview WebSocket connection adapter for browser extension
 * @description Manages WebSocket connections to Web-Buddy server using event-driven patterns
 * @author Web-Buddy Team
 */

import { Adapter, AdapterFor, Port } from '../../stubs/typescript-eda-stubs';
import { 
  ConnectionRequestedEvent,
  ConnectionEstablishedEvent,
  ConnectionLostEvent,
  MessageReceivedEvent 
} from '../events/background-events';

/**
 * Port interface for WebSocket connection management
 */
export abstract class WebSocketConnectionPort extends Port {
  public readonly name = 'WebSocketConnectionPort';
  
  public abstract connect(serverUrl: string): Promise<void>;
  public abstract disconnect(): Promise<void>;
  public abstract send(message: any): Promise<void>;
  public abstract isConnected(): boolean;
}

/**
 * WebSocket connection adapter for browser extension
 * Handles connection lifecycle and message passing
 */
@AdapterFor(WebSocketConnectionPort)
export class WebSocketConnectionAdapter extends WebSocketConnectionPort {
  private ws: WebSocket | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  private connectionConfig = {
    heartbeatInterval: 10000,
    reconnectDelay: 5000,
    maxReconnectAttempts: 5,
    currentAttempts: 0
  };

  /**
   * Establish WebSocket connection to server
   */
  public async connect(serverUrl: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('⚠️ Already connected to WebSocket');
      return;
    }

    console.log(`🔌 Connecting to WebSocket: ${serverUrl}`);
    
    try {
      this.ws = new WebSocket(serverUrl);
      this.setupWebSocketHandlers();
      
      // Wait for connection to open
      return new Promise((resolve, reject) => {
        if (!this.ws) return reject(new Error('WebSocket not initialized'));
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.connectionConfig.currentAttempts = 0;
          this.startHeartbeat();
          resolve();
        };
        
        this.ws.onerror = (error) => {
          console.error('❌ WebSocket connection error:', error);
          reject(new Error('WebSocket connection failed'));
        };
      });
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      throw new Error(`WebSocket creation failed: ${error}`);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public async disconnect(): Promise<void> {
    this.stopHeartbeat();
    this.stopReconnect();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    console.log('🔌 WebSocket disconnected manually');
  }

  /**
   * Send message to server
   */
  public async send(message: any): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    const messageString = JSON.stringify(message);
    this.ws.send(messageString);
    console.log('📤 Message sent to server:', message.type || 'unknown');
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connection opened');
      this.sendRegistrationMessage();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 Received WebSocket message:', message.type || 'unknown');
        
        // Emit message received event for application to handle
        this.emitMessageReceived(message);
        
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log(`🔌 WebSocket connection closed (code: ${event.code})`);
      this.stopHeartbeat();
      
      // Attempt reconnection if not manually closed
      if (event.code !== 1000 && this.connectionConfig.currentAttempts < this.connectionConfig.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  }

  /**
   * Send registration message to server
   */
  private sendRegistrationMessage(): void {
    const registrationMessage = {
      type: 'extensionRegistered',
      payload: {
        extensionId: chrome.runtime.id,
        version: chrome.runtime.getManifest().version,
        capabilities: ['domManipulation', 'webAutomation', 'tabManagement']
      },
      correlationId: `reg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventId: `ext-reg-${Date.now()}`
    };
    
    this.send(registrationMessage).catch(error => {
      console.error('❌ Failed to send registration message:', error);
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const heartbeatMessage = {
          type: 'heartbeat',
          correlationId: `heartbeat-${Date.now()}`,
          timestamp: new Date().toISOString()
        };
        
        this.send(heartbeatMessage).catch(error => {
          console.error('❌ Failed to send heartbeat:', error);
        });
      }
    }, this.connectionConfig.heartbeatInterval);
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.connectionConfig.currentAttempts++;
    
    console.log(
      `🔄 Scheduling reconnect attempt ${this.connectionConfig.currentAttempts}/${this.connectionConfig.maxReconnectAttempts} in ${this.connectionConfig.reconnectDelay}ms`
    );
    
    this.reconnectTimeout = setTimeout(() => {
      // This would need to be coordinated with the application layer
      console.log('🔄 Attempting to reconnect...');
      // The actual reconnection would be triggered through the application layer
    }, this.connectionConfig.reconnectDelay);
  }

  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.connectionConfig.currentAttempts = 0;
  }

  /**
   * Emit message received event for application layer to handle
   */
  private emitMessageReceived(message: any): void {
    // In a full TypeScript-EDA implementation, this would emit an event
    // For now, we'll use a callback approach that can be integrated with the application
    const messageEvent = new MessageReceivedEvent(
      message.type || 'unknown',
      message.payload || message,
      message.correlationId || `msg-${Date.now()}`
    );
    
    // Store event for application layer to process
    (globalThis as any).lastMessageEvent = messageEvent;
  }

  /**
   * Initialize the adapter
   */
  public async initialize(): Promise<void> {
    console.log('🔧 WebSocket connection adapter initialized');
  }

  /**
   * Cleanup the adapter
   */
  public async shutdown(): Promise<void> {
    await this.disconnect();
    console.log('🔌 WebSocket connection adapter shut down');
  }

  /**
   * Check adapter health
   */
  public async isHealthy(): Promise<boolean> {
    return this.isConnected();
  }
}