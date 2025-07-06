/******************************************************************************
 *
 * Filename: event.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Class name: Event
 *
 * Responsibilities:
 *   - Base class for all domain events
 *   - Provide common event properties and behavior
 *   - Support event identification and timestamps
 *
 * Collaborators:
 *   - All concrete event classes inherit from this base
 */
/**
 * Abstract base class for all domain events in the ChatGPT Buddy system.
 * Events represent something that has happened in the domain and are the
 * primary means of communication between different parts of the system.
 */
export declare abstract class Event {
    /**
     * The type identifier for this event
     */
    abstract readonly type: string;
    /**
     * Unique identifier for tracking this event through the system
     */
    abstract get correlationId(): string;
    /**
     * Timestamp when this event was created
     */
    abstract get timestamp(): Date;
    /**
     * Serializes the event to JSON format for transmission
     */
    abstract toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=event.d.ts.map