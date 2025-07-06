/**
 * @fileoverview WebSocket server adapter for browser extension communication
 * @description Manages WebSocket connections, message routing, and real-time communication
 * @author Web-Buddy Team
 */
import { Port } from '../../stubs/typescript-eda-stubs';
import * as WebSocket from 'ws';
/**
 * Port interface for WebSocket server operations
 */
export declare abstract class WebSocketServerPort extends Port {
    readonly name = "WebSocketServerPort";
    abstract startServer(port: number): Promise<void>;
    abstract stopServer(): Promise<void>;
    abstract broadcastMessage(message: any): Promise<void>;
    abstract sendMessageToExtension(extensionId: string, message: any): Promise<void>;
    abstract getConnectionCount(): Promise<number>;
    abstract getConnectionInfo(extensionId: string): Promise<ConnectionInfo | null>;
}
/**
 * WebSocket server adapter using ws library
 * Handles browser extension connections and real-time message routing
 */
export declare class WebSocketServerAdapter extends WebSocketServerPort {
    private server?;
    private connections;
    private isRunning;
    private heartbeatInterval?;
    /**
     * Start the WebSocket server on specified port
     */
    startServer(port: number): Promise<void>;
    /**
     * Stop the WebSocket server gracefully
     */
    stopServer(): Promise<void>;
    /**
     * Broadcast message to all connected extensions
     */
    broadcastMessage(message: any): Promise<void>;
    /**
     * Send message to specific extension
     */
    sendMessageToExtension(extensionId: string, message: any): Promise<void>;
    /**
     * Get total connection count
     */
    getConnectionCount(): Promise<number>;
    /**
     * Get connection information for specific extension
     */
    getConnectionInfo(extensionId: string): Promise<ConnectionInfo | null>;
    /**
     * Set up WebSocket server event listeners
     */
    private setupServerListeners;
    /**
     * Handle new WebSocket connection from browser extension
     */
    private handleNewConnection;
    /**
     * Set up event listeners for individual WebSocket connection
     */
    private setupConnectionListeners;
    /**
     * Handle incoming message from browser extension
     */
    private handleMessage;
    /**
     * Handle extension authentication
     */
    private handleAuthentication;
    /**
     * Handle heartbeat from extension
     */
    private handleHeartbeat;
    /**
     * Route message to appropriate handler
     */
    private routeMessage;
    /**
     * Handle WebSocket connection close
     */
    private handleConnectionClose;
    /**
     * Send authentication request to new connection
     */
    private sendAuthenticationRequest;
    /**
     * Send error response to connection
     */
    private sendErrorResponse;
    /**
     * Send message to connection
     */
    private sendMessage;
    /**
     * Start heartbeat monitoring for all connections
     */
    private startHeartbeatMonitoring;
    /**
     * Perform heartbeat check on all connections
     */
    private performHeartbeatCheck;
    /**
     * Get all active connections
     */
    getActiveConnections(): ExtensionConnection[];
    /**
     * Health check for the adapter
     */
    isHealthy(): Promise<boolean>;
    /**
     * Cleanup the adapter
     */
    shutdown(): Promise<void>;
}
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
export {};
//# sourceMappingURL=websocket-server-adapter.d.ts.map