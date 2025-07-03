/**
 * Base interface for all Web-Buddy messages
 * Provides the fundamental structure for event-driven communication
 */
export interface WebBuddyMessage {
    readonly type: string;
    readonly payload: Record<string, any>;
    readonly correlationId: string;
    readonly timestamp: Date;
    readonly website?: string;
    readonly tabId?: number;
}
/**
 * Abstract base class for all Web-Buddy messages
 * Implements common functionality and ensures consistent structure
 */
export declare abstract class BaseMessage implements WebBuddyMessage {
    readonly payload: Record<string, any>;
    readonly website?: string | undefined;
    readonly tabId?: number | undefined;
    abstract readonly type: string;
    readonly timestamp: Date;
    readonly correlationId: string;
    constructor(payload: Record<string, any>, correlationId?: string, website?: string | undefined, tabId?: number | undefined);
    /**
     * Generates a unique correlation ID for message tracking
     */
    private generateCorrelationId;
    /**
     * Serializes the message to JSON format for network transmission
     */
    toJSON(): WebBuddyMessage;
    /**
     * Creates a message from JSON data
     */
    static fromJSON(data: WebBuddyMessage): BaseMessage;
}
/**
 * Interface for message handlers that process Web-Buddy messages
 */
export interface MessageHandler {
    handle(message: WebBuddyMessage): Promise<any>;
}
/**
 * Response structure for message handling results
 */
export interface MessageResponse {
    success: boolean;
    data?: any;
    error?: string;
    correlationId: string;
    timestamp: Date;
}
/**
 * Creates a standardized success response
 */
export declare function createSuccessResponse(data: any, correlationId: string): MessageResponse;
/**
 * Creates a standardized error response
 */
export declare function createErrorResponse(error: string, correlationId: string): MessageResponse;
//# sourceMappingURL=base.d.ts.map