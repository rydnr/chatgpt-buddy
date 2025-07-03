import { WebBuddyEvent } from './events/base';
/**
 * Configuration interface for WebBuddyClient
 */
export interface WebBuddyClientConfig {
    serverUrl: string;
    timeout?: number;
    apiKey?: string;
    retryAttempts?: number;
    retryDelay?: number;
}
/**
 * Generic Web-Buddy client that provides low-level event-driven API
 * This is the core layer that domain-specific clients build upon
 * Now supports the learning automation system with event-based communication
 */
export declare class WebBuddyClient {
    private config;
    private readonly timeout;
    private readonly retryAttempts;
    private readonly retryDelay;
    constructor(config: WebBuddyClientConfig);
    /**
     * Core API: Generic event dispatching
     * This is the foundation that all domain-specific wrappers use
     *
     * @param event - Event object or legacy message for backward compatibility
     * @param options - Optional configuration for this specific event
     * @returns Promise resolving to the event response
     */
    sendEvent(event: WebBuddyEvent | Record<string, any>, options?: {
        correlationId?: string;
        tabId?: number;
        timeout?: number;
    }): Promise<any>;
    /**
     * Legacy API: Generic message sending (deprecated, use sendEvent instead)
     * Maintained for backward compatibility
     */
    sendMessage(message: Record<string, any>, options?: {
        correlationId?: string;
        tabId?: number;
        timeout?: number;
    }): Promise<any>;
    /**
     * New API: Request automation for a specific action
     * This triggers the learning loop if no implementation exists
     */
    requestAutomation(action: string, parameters: Record<string, any>, options?: {
        website?: string;
        tabId?: number;
        context?: Record<string, any>;
        expectedOutcome?: string;
        timeout?: number;
    }): Promise<any>;
    /**
     * Convenience method: Request search automation
     */
    requestSearch(query: string, website: string, options?: {
        tabId?: number;
        context?: Record<string, any>;
        timeout?: number;
    }): Promise<any>;
    /**
     * Convenience method: Request login automation
     */
    requestLogin(credentials: {
        username: string;
        password?: string;
    }, website: string, options?: {
        tabId?: number;
        context?: Record<string, any>;
        timeout?: number;
    }): Promise<any>;
    /**
     * Internal method to normalize event data
     */
    private normalizeEventData;
    /**
     * Internal method to dispatch events
     */
    private dispatchEvent;
    /**
     * Batch message sending for efficiency
     * Useful for complex operations that require multiple steps
     *
     * @param messages - Array of messages to send
     * @returns Promise resolving to array of responses
     */
    sendMessages(messages: Record<string, any>[], options?: {
        tabId?: number;
        timeout?: number;
        parallel?: boolean;
    }): Promise<any[]>;
    /**
     * Health check to verify server connectivity
     */
    ping(): Promise<{
        success: boolean;
        latency: number;
    }>;
    /**
     * Generates a unique correlation ID for message tracking
     */
    private generateCorrelationId;
    /**
     * Makes HTTP request with timeout support
     */
    private makeHttpRequest;
    /**
     * Executes operation with retry logic
     */
    private executeWithRetry;
}
//# sourceMappingURL=client.d.ts.map