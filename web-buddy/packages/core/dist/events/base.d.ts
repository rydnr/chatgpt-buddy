/**
 * Base interface for all Web-Buddy events
 * Events represent meaningful business occurrences that can change system state
 */
export interface WebBuddyEvent {
    readonly type: string;
    readonly payload: Record<string, any>;
    readonly correlationId: string;
    readonly timestamp: Date;
    readonly website?: string;
    readonly tabId?: number;
    readonly eventId: string;
}
/**
 * Enhanced event interface for automation learning system
 * Includes context about whether this is a learning scenario
 */
export interface AutomationEvent extends WebBuddyEvent {
    readonly eventType: 'request' | 'implementation' | 'success' | 'failure';
    readonly learningContext?: {
        isFirstTime: boolean;
        hasStoredImplementation: boolean;
        implementationId?: string;
        userGuidanceRequired?: boolean;
    };
}
/**
 * Abstract base class for all Web-Buddy events
 * Implements common functionality and ensures consistent structure
 */
export declare abstract class BaseEvent implements WebBuddyEvent {
    readonly payload: Record<string, any>;
    readonly website?: string | undefined;
    readonly tabId?: number | undefined;
    abstract readonly type: string;
    readonly timestamp: Date;
    readonly correlationId: string;
    readonly eventId: string;
    constructor(payload: Record<string, any>, correlationId?: string, website?: string | undefined, tabId?: number | undefined);
    /**
     * Generates a unique correlation ID for event tracking across system boundaries
     */
    private generateCorrelationId;
    /**
     * Generates a unique event ID for this specific event instance
     */
    private generateEventId;
    /**
     * Serializes the event to JSON format for network transmission
     */
    toJSON(): WebBuddyEvent;
    /**
     * Creates an event from JSON data
     */
    static fromJSON(data: WebBuddyEvent): BaseEvent;
}
/**
 * Interface for event handlers that process Web-Buddy events
 * Event handlers represent the business logic for responding to events
 */
export interface EventHandler {
    handle(event: WebBuddyEvent): Promise<any>;
    canHandle(eventType: string): boolean;
}
/**
 * Response structure for event handling results
 */
export interface EventResponse {
    success: boolean;
    data?: any;
    error?: string;
    correlationId: string;
    eventId: string;
    timestamp: Date;
    resultingEvents?: WebBuddyEvent[];
}
/**
 * Creates a standardized success response
 */
export declare function createSuccessResponse(data: any, correlationId: string, eventId: string, resultingEvents?: WebBuddyEvent[]): EventResponse;
/**
 * Creates a standardized error response
 */
export declare function createErrorResponse(error: string, correlationId: string, eventId: string): EventResponse;
/**
 * Event priority levels for processing order
 */
export declare enum EventPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}
/**
 * Event metadata for enhanced processing
 */
export interface EventMetadata {
    priority: EventPriority;
    retryCount: number;
    maxRetries: number;
    timeout: number;
    tags: string[];
}
/**
 * Enhanced event with metadata for advanced processing
 */
export interface MetadataEvent extends WebBuddyEvent {
    metadata: EventMetadata;
}
//# sourceMappingURL=base.d.ts.map