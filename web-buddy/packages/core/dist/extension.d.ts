import { EventHandler } from './events/base';
/**
 * Configuration for the Web-Buddy extension
 */
export interface WebBuddyExtensionConfig {
    serverUrl: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    heartbeatInterval?: number;
    extensionId?: string;
}
/**
 * Generic Web-Buddy extension that handles browser-side automation
 * Now includes learning capabilities and user guidance workflows
 * Domain-specific extensions register their handlers with this class
 */
export declare class WebBuddyExtension {
    private config;
    private handlers;
    private learningUI?;
    private playwrightRecorder?;
    private automationManager?;
    private websocket?;
    private reconnectAttempts;
    private heartbeatTimer?;
    private readonly extensionId;
    constructor(config: WebBuddyExtensionConfig);
    /**
     * Registers an event handler for a specific event type
     * Domain implementations use this to register their handlers
     *
     * @param eventType - The type of event to handle
     * @param handler - The handler that will process events of this type
     */
    registerHandler(eventType: string, handler: EventHandler): void;
    /**
     * Initializes learning components
     */
    private initializeLearningSystem;
    /**
     * Unregisters an event handler
     *
     * @param eventType - The event type to unregister
     */
    unregisterHandler(eventType: string): void;
    /**
     * Connects to the Web-Buddy server
     */
    connect(): Promise<void>;
    /**
     * Disconnects from the Web-Buddy server
     */
    disconnect(): void;
    /**
     * Handles an incoming event from the server
     *
     * @param event - The event to handle
     */
    private handleEvent;
    /**
     * Legacy method for backward compatibility
     */
    private handleMessage;
    /**
     * Sends a response back to the server
     *
     * @param response - The response to send
     */
    private sendResponse;
    /**
     * Handles automation requests - implements the "reuse this automation?" workflow
     */
    private handleAutomationRequest;
    /**
     * Handles user guidance requests for automation learning
     */
    private handleUserGuidanceRequest;
    /**
     * Starts automation recording process
     */
    private startAutomationRecording;
    /**
     * Sets up recording control UI
     */
    private setupRecordingControls;
    /**
     * Stops recording and processes the result
     */
    private stopAutomationRecording;
    /**
     * Execute a stored automation
     */
    private executeStoredAutomation;
    /**
     * Handle reuse prompt dialog
     */
    private handleReusePrompt;
    /**
     * Start recording a new automation
     */
    private startNewRecording;
    /**
     * Sends an event to the server
     */
    private sendEventToServer;
    /**
     * Attempts to reconnect to the server
     */
    private attemptReconnect;
    /**
     * Starts the heartbeat to keep connection alive
     */
    private startHeartbeat;
    /**
     * Stops the heartbeat
     */
    private stopHeartbeat;
    /**
     * Generates a unique extension ID
     */
    private generateExtensionId;
    /**
     * Gets the extension ID
     */
    getExtensionId(): string;
    /**
     * Checks if the extension is connected to the server
     */
    isConnected(): boolean;
    /**
     * Gets registered event types
     */
    getRegisteredEventTypes(): string[];
}
/**
 * Content script integration helper
 * Facilitates communication between background script and content scripts
 */
export declare class ContentScriptIntegration {
    private extension;
    constructor(extension: WebBuddyExtension);
    /**
     * Sets up communication with content scripts
     */
    private setupContentScriptCommunication;
    /**
     * Handles messages from content scripts
     *
     * @param message - Message from content script
     * @returns Promise resolving to response
     */
    private handleContentScriptMessage;
    /**
     * Sends a message to a content script
     *
     * @param tabId - ID of the tab containing the content script
     * @param message - Message to send
     * @returns Promise resolving to response from content script
     */
    sendToContentScript(tabId: number, message: any): Promise<any>;
}
//# sourceMappingURL=extension.d.ts.map