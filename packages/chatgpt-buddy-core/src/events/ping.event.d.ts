/******************************************************************************
 *
 * Filename: ping.event.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Class name: PingEvent
 *
 * Responsibilities:
 *   - Represent a simple ping event for testing connectivity
 *   - Carry a message payload and correlation ID
 *   - Support JSON serialization for network transmission
 *
 * Collaborators:
 *   - Event: Base event class from typescript-eda
 */
import { Event } from '../base/event';
/**
 * Payload interface for ping events
 */
export interface PingPayload {
    readonly message: string;
}
/**
 * A simple ping event used for testing connectivity and communication flow
 * between different modules in the ChatGPT Buddy system.
 */
export declare class PingEvent extends Event {
    readonly payload: PingPayload & {
        correlationId: string;
    };
    readonly type = "PingEvent";
    /**
     * Creates a new PingEvent instance
     *
     * @param payload - The ping payload containing the message
     * @param correlationId - Unique identifier for tracking this event
     */
    constructor(payload: PingPayload & {
        correlationId: string;
    });
    /**
     * Gets the correlation ID for this event
     */
    get correlationId(): string;
    /**
     * Gets the timestamp when this event was created
     */
    get timestamp(): Date;
    /**
     * Serializes the event to JSON format for network transmission
     *
     * @returns JSON representation of the event
     */
    toJSON(): {
        type: string;
        correlationId: string;
        payload: PingPayload;
        timestamp: Date;
    };
}
//# sourceMappingURL=ping.event.d.ts.map