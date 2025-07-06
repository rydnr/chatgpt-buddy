"use strict";
/**
 * @fileoverview WebSocket server adapter for browser extension communication
 * @description Manages WebSocket connections, message routing, and real-time communication
 * @author Web-Buddy Team
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServerAdapter = exports.WebSocketServerPort = void 0;
const typescript_eda_stubs_1 = require("../../stubs/typescript-eda-stubs");
const WebSocket = __importStar(require("ws"));
/**
 * Port interface for WebSocket server operations
 */
class WebSocketServerPort extends typescript_eda_stubs_1.Port {
    constructor() {
        super(...arguments);
        this.name = 'WebSocketServerPort';
    }
}
exports.WebSocketServerPort = WebSocketServerPort;
/**
 * WebSocket server adapter using ws library
 * Handles browser extension connections and real-time message routing
 */
let WebSocketServerAdapter = class WebSocketServerAdapter extends WebSocketServerPort {
    constructor() {
        super(...arguments);
        this.connections = new Map();
        this.isRunning = false;
    }
    /**
     * Start the WebSocket server on specified port
     */
    async startServer(port) {
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
        }
        catch (error) {
            console.error('❌ Failed to start WebSocket server:', error);
            throw error;
        }
    }
    /**
     * Stop the WebSocket server gracefully
     */
    async stopServer() {
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
                await new Promise((resolve, reject) => {
                    this.server.close((error) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve();
                        }
                    });
                });
            }
            this.connections.clear();
            this.isRunning = false;
            console.log('✅ WebSocket server stopped successfully');
        }
        catch (error) {
            console.error('❌ Error stopping WebSocket server:', error);
            throw error;
        }
    }
    /**
     * Broadcast message to all connected extensions
     */
    async broadcastMessage(message) {
        const messageString = JSON.stringify(message);
        const activeConnections = Array.from(this.connections.values())
            .filter(conn => conn.websocket.readyState === WebSocket.OPEN);
        console.log(`📡 Broadcasting message to ${activeConnections.length} extensions`);
        const sendPromises = activeConnections.map(async (connection) => {
            try {
                connection.websocket.send(messageString);
                connection.messagesSent++;
                connection.lastActivity = new Date();
            }
            catch (error) {
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
    async sendMessageToExtension(extensionId, message) {
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
        }
        catch (error) {
            console.error(`❌ Failed to send message to ${extensionId}:`, error);
            throw error;
        }
    }
    /**
     * Get total connection count
     */
    async getConnectionCount() {
        return this.connections.size;
    }
    /**
     * Get connection information for specific extension
     */
    async getConnectionInfo(extensionId) {
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
    setupServerListeners() {
        if (!this.server)
            return;
        this.server.on('connection', (websocket, request) => {
            this.handleNewConnection(websocket, request);
        });
        this.server.on('error', (error) => {
            console.error('❌ WebSocket server error:', error);
        });
        this.server.on('close', () => {
            console.log('🔌 WebSocket server closed');
        });
    }
    /**
     * Handle new WebSocket connection from browser extension
     */
    handleNewConnection(websocket, request) {
        const remoteAddress = request.socket.remoteAddress || 'unknown';
        const userAgent = request.headers['user-agent'] || 'unknown';
        console.log(`🔌 New WebSocket connection from ${remoteAddress}`);
        // Generate temporary connection ID until extension identifies itself
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const connection = {
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
    setupConnectionListeners(connection) {
        connection.websocket.on('message', (data) => {
            this.handleMessage(connection, data);
        });
        connection.websocket.on('close', (code, reason) => {
            this.handleConnectionClose(connection, code, reason);
        });
        connection.websocket.on('error', (error) => {
            console.error(`❌ WebSocket connection error for ${connection.extensionId}:`, error);
        });
        connection.websocket.on('pong', () => {
            connection.lastActivity = new Date();
        });
    }
    /**
     * Handle incoming message from browser extension
     */
    handleMessage(connection, data) {
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
        }
        catch (error) {
            console.error(`❌ Failed to parse message from ${connection.extensionId}:`, error);
            this.sendErrorResponse(connection, 'Invalid message format');
        }
    }
    /**
     * Handle extension authentication
     */
    handleAuthentication(connection, message) {
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
    handleHeartbeat(connection, message) {
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
    routeMessage(connection, message) {
        // In real implementation, this would route to the coordination application
        console.log(`🚀 Routing message type '${message.type}' from ${connection.extensionId}`);
    }
    /**
     * Handle WebSocket connection close
     */
    handleConnectionClose(connection, code, reason) {
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
    sendAuthenticationRequest(connection) {
        this.sendMessage(connection, {
            type: 'authentication_required',
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Send error response to connection
     */
    sendErrorResponse(connection, error) {
        this.sendMessage(connection, {
            type: 'error',
            error,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Send message to connection
     */
    sendMessage(connection, message) {
        if (connection.websocket.readyState === WebSocket.OPEN) {
            connection.websocket.send(JSON.stringify(message));
            connection.messagesSent++;
        }
    }
    /**
     * Start heartbeat monitoring for all connections
     */
    startHeartbeatMonitoring() {
        this.heartbeatInterval = setInterval(() => {
            this.performHeartbeatCheck();
        }, 30000); // Check every 30 seconds
    }
    /**
     * Perform heartbeat check on all connections
     */
    performHeartbeatCheck() {
        const now = new Date();
        const timeoutThreshold = 60000; // 1 minute timeout
        for (const [extensionId, connection] of this.connections) {
            const timeSinceLastActivity = now.getTime() - connection.lastActivity.getTime();
            if (timeSinceLastActivity > timeoutThreshold) {
                console.warn(`⚠️ Extension ${extensionId} has been inactive for ${timeSinceLastActivity}ms`);
                if (connection.websocket.readyState === WebSocket.OPEN) {
                    // Send ping to check if connection is still alive
                    connection.websocket.ping();
                }
                else {
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
    getActiveConnections() {
        return Array.from(this.connections.values())
            .filter(conn => conn.websocket.readyState === WebSocket.OPEN);
    }
    /**
     * Health check for the adapter
     */
    async isHealthy() {
        return this.isRunning && this.server !== undefined;
    }
    /**
     * Cleanup the adapter
     */
    async shutdown() {
        await this.stopServer();
    }
};
exports.WebSocketServerAdapter = WebSocketServerAdapter;
exports.WebSocketServerAdapter = WebSocketServerAdapter = __decorate([
    (0, typescript_eda_stubs_1.AdapterFor)(WebSocketServerPort)
], WebSocketServerAdapter);
//# sourceMappingURL=websocket-server-adapter.js.map