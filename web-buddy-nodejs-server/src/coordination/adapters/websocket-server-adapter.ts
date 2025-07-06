/**
 * @fileoverview WebSocket server adapter for browser extension communication
 * @description Manages WebSocket connections, message routing, and real-time communication
 * @author Web-Buddy Team
 */

import { Adapter, AdapterFor, Port } from '../../stubs/typescript-eda-stubs';
import * as WebSocket from 'ws';
import { IncomingMessage } from 'http';

/**
 * Port interface for WebSocket server operations
 */
export abstract class WebSocketServerPort extends Port {
  public readonly name = 'WebSocketServerPort';
  
  public abstract startServer(port: number): Promise<void>;
  public abstract stopServer(): Promise<void>;
  public abstract broadcastMessage(message: any): Promise<void>;
  public abstract sendMessageToExtension(extensionId: string, message: any): Promise<void>;
  public abstract getConnectionCount(): Promise<number>;
  public abstract getConnectionInfo(extensionId: string): Promise<ConnectionInfo | null>;
}

/**
 * WebSocket server adapter using ws library
 * Handles browser extension connections and real-time message routing
 */
@AdapterFor(WebSocketServerPort)
export class WebSocketServerAdapter extends WebSocketServerPort {
  private server?: WebSocket.Server;
  private connections = new Map<string, ExtensionConnection>();
  private isRunning = false;
  private heartbeatInterval?: NodeJS.Timeout;

  /**
   * Start the WebSocket server on specified port
   */
  public async startServer(port: number): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ WebSocket server is already running');
      return;
    }

    console.log(`🔌 Starting WebSocket server on port ${port}...`);

    try {
      this.server = new WebSocket.Server({
        port: port + 1, // WebSocket on port + 1
        path: '/ws'
      });

      this.setupServerListeners();
      this.startHeartbeatMonitoring();
      
      this.isRunning = true;
      
      console.log(`✅ WebSocket server started on ws://localhost:${port + 1}/ws`);
      
    } catch (error) {
      console.error('❌ Failed to start WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Stop the WebSocket server gracefully
   */
  public async stopServer(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ WebSocket server is not running');
      return;
    }

    console.log('🛑 Stopping WebSocket server...');

    try {
      // Stop heartbeat monitoring
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = undefined;
      }

      // Close all active connections
      for (const [extensionId, connection] of this.connections) {
        console.log(`🔌 Closing connection to extension ${extensionId}`);
        connection.websocket.close(1000, 'Server shutdown');
      }

      // Close the server
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server!.close((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }

      this.connections.clear();
      this.isRunning = false;
      
      console.log('✅ WebSocket server stopped successfully');
      
    } catch (error) {
      console.error('❌ Error stopping WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Broadcast message to all connected extensions
   */
  public async broadcastMessage(message: any): Promise<void> {
    const messageString = JSON.stringify(message);
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.websocket.readyState === WebSocket.OPEN);

    console.log(`📡 Broadcasting message to ${activeConnections.length} extensions`);

    const sendPromises = activeConnections.map(async (connection) => {
      try {
        connection.websocket.send(messageString);
        connection.messagesSent++;
        connection.lastActivity = new Date();
      } catch (error) {
        console.error(`❌ Failed to send message to ${connection.extensionId}:`, error);
        // Mark connection for cleanup
        connection.websocket.terminate();
      }
    });

    await Promise.allSettled(sendPromises);
  }

  /**
   * Send message to specific extension
   */
  public async sendMessageToExtension(extensionId: string, message: any): Promise<void> {
    const connection = this.connections.get(extensionId);
    if (!connection) {
      throw new Error(`Extension ${extensionId} not connected`);
    }

    if (connection.websocket.readyState !== WebSocket.OPEN) {
      throw new Error(`Extension ${extensionId} connection is not open`);
    }

    try {
      const messageString = JSON.stringify(message);
      connection.websocket.send(messageString);
      connection.messagesSent++;
      connection.lastActivity = new Date();
      
      console.log(`📤 Message sent to extension ${extensionId}:`, message.type || 'unknown');
      
    } catch (error) {
      console.error(`❌ Failed to send message to ${extensionId}:`, error);
      throw error;
    }
  }

  /**
   * Get total connection count
   */
  public async getConnectionCount(): Promise<number> {
    return this.connections.size;
  }

  /**
   * Get connection information for specific extension
   */
  public async getConnectionInfo(extensionId: string): Promise<ConnectionInfo | null> {
    const connection = this.connections.get(extensionId);
    if (!connection) {
      return null;
    }

    return {
      extensionId: connection.extensionId,
      connected: connection.websocket.readyState === WebSocket.OPEN,
      connectedAt: connection.connectedAt,
      lastActivity: connection.lastActivity,
      messagesSent: connection.messagesSent,
      messagesReceived: connection.messagesReceived,
      remoteAddress: connection.remoteAddress,
      userAgent: connection.userAgent
    };
  }

  /**
   * Set up WebSocket server event listeners
   */
  private setupServerListeners(): void {
    if (!this.server) return;

    this.server.on('connection', (websocket: WebSocket, request: IncomingMessage) => {
      this.handleNewConnection(websocket, request);
    });

    this.server.on('error', (error: Error) => {
      console.error('❌ WebSocket server error:', error);
    });

    this.server.on('close', () => {
      console.log('🔌 WebSocket server closed');
    });
  }

  /**
   * Handle new WebSocket connection from browser extension
   */
  private handleNewConnection(websocket: WebSocket, request: IncomingMessage): void {
    const remoteAddress = request.socket.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    
    console.log(`🔌 New WebSocket connection from ${remoteAddress}`);

    // Generate temporary connection ID until extension identifies itself
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const connection: ExtensionConnection = {
      extensionId: tempId,
      websocket,
      connectedAt: new Date(),
      lastActivity: new Date(),
      messagesSent: 0,
      messagesReceived: 0,
      remoteAddress,
      userAgent,
      authenticated: false
    };

    // Set up connection event listeners
    this.setupConnectionListeners(connection);

    // Store connection temporarily
    this.connections.set(tempId, connection);

    // Send authentication request
    this.sendAuthenticationRequest(connection);
  }

  /**
   * Set up event listeners for individual WebSocket connection
   */
  private setupConnectionListeners(connection: ExtensionConnection): void {
    connection.websocket.on('message', (data: WebSocket.Data) => {
      this.handleMessage(connection, data);
    });

    connection.websocket.on('close', (code: number, reason: string) => {
      this.handleConnectionClose(connection, code, reason);
    });

    connection.websocket.on('error', (error: Error) => {
      console.error(`❌ WebSocket connection error for ${connection.extensionId}:`, error);
    });

    connection.websocket.on('pong', () => {
      connection.lastActivity = new Date();
    });
  }

  /**
   * Handle incoming message from browser extension
   */
  private handleMessage(connection: ExtensionConnection, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      connection.messagesReceived++;
      connection.lastActivity = new Date();

      console.log(`📥 Message received from ${connection.extensionId}:`, message.type || 'unknown');

      // Handle authentication
      if (message.type === 'authenticate' && !connection.authenticated) {
        this.handleAuthentication(connection, message);
        return;
      }

      // Handle heartbeat
      if (message.type === 'heartbeat') {
        this.handleHeartbeat(connection, message);
        return;
      }

      // Handle other message types
      this.routeMessage(connection, message);

    } catch (error) {
      console.error(`❌ Failed to parse message from ${connection.extensionId}:`, error);
      this.sendErrorResponse(connection, 'Invalid message format');
    }
  }

  /**
   * Handle extension authentication
   */
  private handleAuthentication(connection: ExtensionConnection, message: any): void {
    const { extensionId, metadata } = message;
    
    if (!extensionId) {
      this.sendErrorResponse(connection, 'Extension ID required');
      return;
    }

    // Remove temporary connection
    this.connections.delete(connection.extensionId);
    
    // Update connection with real extension ID
    connection.extensionId = extensionId;
    connection.authenticated = true;
    
    // Store with real extension ID
    this.connections.set(extensionId, connection);

    console.log(`✅ Extension ${extensionId} authenticated successfully`);

    // Send authentication success
    this.sendMessage(connection, {
      type: 'authentication_success',
      extensionId,
      timestamp: new Date().toISOString()
    });

    // Emit extension connected event (in real implementation)
    // await this.emit(new ExtensionConnectedEvent(extensionId, metadata, connectionInfo));
  }

  /**
   * Handle heartbeat from extension
   */
  private handleHeartbeat(connection: ExtensionConnection, message: any): void {
    console.log(`💓 Heartbeat from ${connection.extensionId}`);
    
    // Send heartbeat response
    this.sendMessage(connection, {
      type: 'heartbeat_response',
      timestamp: new Date().toISOString()
    });

    // Emit heartbeat event (in real implementation)
    // await this.emit(new ExtensionHeartbeatReceivedEvent(connection.extensionId, message.status, message.metrics));
  }

  /**
   * Route message to appropriate handler
   */
  private routeMessage(connection: ExtensionConnection, message: any): void {
    // In real implementation, this would route to the coordination application
    console.log(`🚀 Routing message type '${message.type}' from ${connection.extensionId}`);
  }

  /**
   * Handle WebSocket connection close
   */
  private handleConnectionClose(connection: ExtensionConnection, code: number, reason: string): void {
    console.log(`🔌 Connection closed for ${connection.extensionId}: ${code} ${reason}`);
    
    const sessionDuration = Date.now() - connection.connectedAt.getTime();
    
    // Remove from connections
    this.connections.delete(connection.extensionId);

    // Emit disconnection event (in real implementation)
    // await this.emit(new ExtensionDisconnectedEvent(connection.extensionId, reason, sessionDuration));
  }

  /**
   * Send authentication request to new connection
   */
  private sendAuthenticationRequest(connection: ExtensionConnection): void {
    this.sendMessage(connection, {
      type: 'authentication_required',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send error response to connection
   */
  private sendErrorResponse(connection: ExtensionConnection, error: string): void {
    this.sendMessage(connection, {
      type: 'error',
      error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send message to connection
   */
  private sendMessage(connection: ExtensionConnection, message: any): void {
    if (connection.websocket.readyState === WebSocket.OPEN) {
      connection.websocket.send(JSON.stringify(message));
      connection.messagesSent++;
    }
  }

  /**
   * Start heartbeat monitoring for all connections
   */
  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeatCheck();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform heartbeat check on all connections
   */
  private performHeartbeatCheck(): void {
    const now = new Date();
    const timeoutThreshold = 60000; // 1 minute timeout

    for (const [extensionId, connection] of this.connections) {
      const timeSinceLastActivity = now.getTime() - connection.lastActivity.getTime();
      
      if (timeSinceLastActivity > timeoutThreshold) {
        console.warn(`⚠️ Extension ${extensionId} has been inactive for ${timeSinceLastActivity}ms`);
        
        if (connection.websocket.readyState === WebSocket.OPEN) {
          // Send ping to check if connection is still alive
          connection.websocket.ping();
        } else {
          // Connection is dead, remove it
          console.warn(`💀 Removing dead connection for ${extensionId}`);
          this.connections.delete(extensionId);
        }
      }
    }
  }

  /**
   * Get all active connections
   */
  public getActiveConnections(): ExtensionConnection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.websocket.readyState === WebSocket.OPEN);
  }

  /**
   * Health check for the adapter
   */
  public async isHealthy(): Promise<boolean> {
    return this.isRunning && this.server !== undefined;
  }

  /**
   * Cleanup the adapter
   */
  public async shutdown(): Promise<void> {
    await this.stopServer();
  }
}

// Supporting interfaces

interface ExtensionConnection {
  extensionId: string;
  websocket: WebSocket;
  connectedAt: Date;
  lastActivity: Date;
  messagesSent: number;
  messagesReceived: number;
  remoteAddress: string;
  userAgent: string;
  authenticated: boolean;
}

export interface ConnectionInfo {
  extensionId: string;
  connected: boolean;
  connectedAt: Date;
  lastActivity: Date;
  messagesSent: number;
  messagesReceived: number;
  remoteAddress: string;
  userAgent: string;
}