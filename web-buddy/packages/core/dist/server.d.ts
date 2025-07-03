import { WebBuddyEvent, EventHandler, EventResponse } from './events/base';
import { WebBuddyMessage } from './messages/base';
/**
 * Configuration interface for WebBuddyServer
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
}
/**
 * Extension connection interface for WebSocket management
 */
export interface ExtensionConnection {
    id: string;
    websocket: any;
    tabId?: number;
    lastSeen: Date;
    metadata?: Record<string, any>;
}
/**
 * Generic Web-Buddy server that provides event routing infrastructure
 * Domain-specific implementations register their handlers with this server
 * Now supports the learning automation system with event-driven architecture
 */
export declare class WebBuddyServer {
    private config;
    private handlers;
    private eventListeners;
    private extensions;
    private messageQueue;
    constructor(config?: WebBuddyServerConfig);
    /**
     * Registers an event handler for a specific event type
     * Domain implementations use this to register their handlers
     *
     * @param eventType - The type of event to handle (e.g., 'searchRequested', 'automationRequested')
     * @param handler - The handler that will process events of this type
     */
    registerHandler(eventType: string, handler: EventHandler): void;
    /**
     * Registers an event listener for a specific event type
     * Used for reactive programming and event-driven workflows
     */
    addEventListener(eventType: string, listener: (event: WebBuddyEvent) => void): void;
    /**
     * Unregisters an event handler
     *
     * @param eventType - The event type to unregister
     */
    unregisterHandler(eventType: string): void;
    /**
     * Removes an event listener
     */
    removeEventListener(eventType: string, listener: (event: WebBuddyEvent) => void): void;
    /**
     * Gets all registered event types
     */
    getRegisteredEventTypes(): string[];
    /**
     * Handles an incoming event by routing it to the appropriate handler
     * Also triggers event listeners for reactive workflows
     *
     * @param event - The event to handle
     * @returns Promise resolving to event response
     */
    handleEvent(event: WebBuddyEvent): Promise<EventResponse>;
    /**
     * Legacy method for backward compatibility
     */
    handleMessage(message: any): Promise<EventResponse>;
    /**
     * Triggers event listeners for reactive workflows
     */
    private triggerEventListeners;
    /**
     * Handles automation learning workflow when no implementation exists
     */
    private handleAutomationLearning;
    /**
     * Registers a browser extension connection
     *
     * @param connection - Extension connection details
     */
    registerExtension(connection: ExtensionConnection): void;
    /**
     * Unregisters a browser extension connection
     *
     * @param extensionId - ID of the extension to unregister
     */
    unregisterExtension(extensionId: string): void;
    /**
     * Gets an extension connection by ID
     *
     * @param extensionId - ID of the extension
     * @returns Extension connection or undefined if not found
     */
    getExtension(extensionId: string): ExtensionConnection | undefined;
    /**
     * Gets all active extension connections
     */
    getActiveExtensions(): ExtensionConnection[];
    /**
     * Forwards a message to a specific browser extension
     *
     * @param extensionId - Target extension ID
     * @param message - Message to forward
     * @returns Promise resolving to success status
     */
    forwardToExtension(extensionId: string, message: WebBuddyMessage): Promise<boolean>;
    /**
     * Broadcasts a message to all active extensions
     *
     * @param message - Message to broadcast
     * @returns Array of extension IDs that successfully received the message
     */
    broadcastToExtensions(message: WebBuddyMessage): Promise<string[]>;
    /**
     * Queues a message for delivery when an extension connects
     *
     * @param extensionId - Target extension ID
     * @param message - Message to queue
     */
    queueMessage(extensionId: string, message: WebBuddyMessage): void;
    /**
     * Delivers queued messages to a newly connected extension
     *
     * @param extensionId - Extension ID that just connected
     */
    deliverQueuedMessages(extensionId: string): Promise<void>;
    /**
     * Cleans up stale connections and old queued messages
     * Should be called periodically
     */
    cleanup(maxAge?: number): void;
    /**
     * Gets server statistics
     */
    getStats(): {
        activeExtensions: number;
        registeredHandlers: number;
        queuedMessages: number;
    };
}
//# sourceMappingURL=server.d.ts.map