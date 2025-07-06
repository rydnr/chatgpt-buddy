import WebSocket from 'ws';
/**
 * Configuration for Web-Buddy Server
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
    logging?: {
        level: string;
        file?: string;
    };
}
/**
 * Extension connection information
 */
export interface ExtensionConnection {
    id: string;
    websocket: WebSocket;
    tabId?: number;
    url?: string;
    capabilities?: string[];
    lastActivity: Date;
    metadata?: Record<string, any>;
}
/**
 * Message routing information
 */
export interface MessageRoute {
    extensionId?: string;
    tabId?: number;
    correlationId: string;
    timestamp: Date;
    priority?: 'low' | 'medium' | 'high';
}
/**
 * Web-Buddy Server implementation
 * Handles HTTP API requests and WebSocket connections to browser extensions
 */
export declare class WebBuddyServer {
    private app;
    private server;
    private wss;
    private extensions;
    private pendingRequests;
    private logger;
    private config;
    private isRunning;
    constructor(config?: WebBuddyServerConfig);
    /**
     * Setup Winston logger
     */
    private setupLogger;
    /**
     * Setup Express application
     */
    private setupExpress;
    /**
     * Setup API routes
     */
    private setupRoutes;
    /**
     * Setup WebSocket server for extension connections
     */
    private setupWebSocket;
    /**
     * Start the server
     */
    start(): Promise<void>;
    /**
     * Stop the server
     */
    stop(): Promise<void>;
    /**
     * Authentication middleware
     */
    private authenticateRequest;
    /**
     * Handle incoming messages from clients
     */
    private handleMessage;
    /**
     * Handle incoming events (new event-driven API)
     */
    private handleEvent;
    /**
     * Handle dispatch requests (legacy API)
     */
    private handleDispatch;
    /**
     * List connected extensions
     */
    private listExtensions;
    /**
     * Get specific extension info
     */
    private getExtension;
    /**
     * Get server metrics
     */
    private getMetrics;
    /**
     * Handle WebSocket connections from extensions
     */
    private handleWebSocketConnection;
    /**
     * Handle messages from extensions
     */
    private handleExtensionMessage;
    /**
     * Handle extension registration
     */
    private handleExtensionRegistration;
    /**
     * Handle extension response to previous request
     */
    private handleExtensionResponse;
    /**
     * Handle extension heartbeat
     */
    private handleExtensionHeartbeat;
    /**
     * Find target extension for a tab ID
     */
    private findTargetExtension;
    /**
     * Forward message to extension and wait for response
     */
    private forwardMessageToExtension;
    /**
     * Forward event to extension and wait for response
     */
    private forwardEventToExtension;
    /**
     * Error handler middleware
     */
    private errorHandler;
    /**
     * Get server status
     */
    getStatus(): {
        isRunning: boolean;
        port: number;
        extensions: number;
        uptime: number;
    };
}
//# sourceMappingURL=server.d.ts.map