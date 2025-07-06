/**
 * @fileoverview Plugin Communication System for Web-Buddy plugin architecture
 * @description Implements plugin messaging, event bus, and inter-plugin communication
 */
import { PluginEvent, PluginEventHandler, PluginEventBus, PluginMessaging } from './plugin-interface';
/**
 * Message types for plugin communication
 */
export declare enum PluginMessageType {
    DIRECT_MESSAGE = "direct-message",
    BROADCAST = "broadcast",
    REQUEST = "request",
    RESPONSE = "response",
    PUBLISH = "publish",
    SUBSCRIBE = "subscribe",
    UNSUBSCRIBE = "unsubscribe"
}
/**
 * Plugin message structure
 */
export interface PluginMessage {
    id: string;
    type: PluginMessageType;
    from: string;
    to?: string;
    topic?: string;
    data: any;
    timestamp: string;
    correlationId?: string;
    requestId?: string;
    responseId?: string;
}
/**
 * Event filter function
 */
export type EventFilter = (event: PluginEvent) => boolean;
/**
 * Event transformer function
 */
export type EventTransformer = (event: PluginEvent) => PluginEvent;
/**
 * Message handler function
 */
export type MessageHandler = (message: PluginMessage) => Promise<any> | any;
/**
 * Event bus implementation with filtering and history
 */
export declare class DefaultPluginEventBus implements PluginEventBus {
    private eventHandlers;
    private eventHistory;
    private filters;
    private transformers;
    private maxHistorySize;
    /**
     * Emit an event to all registered handlers
     */
    emit(event: PluginEvent): Promise<void>;
    /**
     * Register an event handler
     */
    on(eventType: string, handler: PluginEventHandler): void;
    /**
     * Unregister an event handler
     */
    off(eventType: string, handler: PluginEventHandler): void;
    /**
     * Register a one-time event handler
     */
    once(eventType: string, handler: PluginEventHandler): void;
    /**
     * Create a filtered event bus
     */
    filter(predicate: EventFilter): PluginEventBus;
    /**
     * Create a transformed event bus
     */
    pipe(transformer: EventTransformer): PluginEventBus;
    /**
     * Get event history
     */
    getHistory(pluginId?: string): PluginEvent[];
    /**
     * Replay events from a timestamp
     */
    replay(fromTimestamp?: string): Promise<void>;
    /**
     * Clear event history
     */
    clearHistory(): void;
    /**
     * Get event statistics
     */
    getStatistics(): {
        eventTypes: string[];
        totalEvents: number;
        handlerCount: number;
        filters: number;
        transformers: number;
    };
    private passesFilters;
    private applyTransformers;
    private addToHistory;
}
/**
 * Plugin messaging implementation
 */
export declare class DefaultPluginMessaging implements PluginMessaging {
    private eventBus;
    private subscriptions;
    private pendingRequests;
    private messageHandlers;
    private requestTimeout;
    constructor(eventBus: PluginEventBus);
    /**
     * Send a direct message to another plugin
     */
    sendMessage(fromPlugin: string, toPlugin: string, message: any): Promise<any>;
    /**
     * Publish a message to a topic
     */
    publish(topic: string, data: any): Promise<void>;
    /**
     * Subscribe to a topic
     */
    subscribe(topic: string, handler: PluginEventHandler): void;
    /**
     * Unsubscribe from a topic
     */
    unsubscribe(topic: string, handler: PluginEventHandler): void;
    /**
     * Send a request and wait for response
     */
    request(pluginId: string, request: any): Promise<any>;
    /**
     * Send a response to a request
     */
    respond(requestId: string, response: any): Promise<void>;
    /**
     * Broadcast a message to all plugins
     */
    broadcast(message: any): Promise<void>;
    /**
     * Register a message handler for a plugin
     */
    registerMessageHandler(pluginId: string, handler: MessageHandler): void;
    /**
     * Unregister a message handler
     */
    unregisterMessageHandler(pluginId: string): void;
    /**
     * Get messaging statistics
     */
    getStatistics(): {
        totalSubscriptions: number;
        topicCount: number;
        pendingRequests: number;
        registeredHandlers: number;
        subscriptionsByTopic: {
            [k: string]: number;
        };
    };
    /**
     * Clean up expired requests and subscriptions
     */
    cleanup(): void;
    private deliverMessage;
    private generateMessageId;
    private extractPluginIdFromHandler;
    private setupSystemHandlers;
}
/**
 * Plugin communication factory
 */
export declare class PluginCommunicationFactory {
    private eventBus;
    private messaging;
    constructor();
    /**
     * Get the event bus instance
     */
    getEventBus(): PluginEventBus;
    /**
     * Get the messaging instance
     */
    getMessaging(): PluginMessaging;
    /**
     * Create a plugin-specific event bus
     */
    createPluginEventBus(pluginId: string): PluginEventBus;
    /**
     * Create a topic-specific event bus
     */
    createTopicEventBus(topic: string): PluginEventBus;
    /**
     * Create event bus with custom filters
     */
    createFilteredEventBus(filters: EventFilter[]): PluginEventBus;
    /**
     * Get communication statistics
     */
    getStatistics(): {
        eventBus: any;
        messaging: any;
    };
}
/**
 * Helper functions for common communication patterns
 */
export declare class PluginCommunicationHelpers {
    /**
     * Create a plugin-to-plugin communication channel
     */
    static createChannel(messaging: PluginMessaging, fromPlugin: string, toPlugin: string): {
        send: (data: any) => Promise<any>;
        request: (data: any) => Promise<any>;
    };
    /**
     * Create a topic publisher
     */
    static createPublisher(messaging: PluginMessaging, topic: string): (data: any) => Promise<void>;
    /**
     * Create a topic subscriber
     */
    static createSubscriber(messaging: PluginMessaging, topic: string, handler: PluginEventHandler): () => void;
    /**
     * Create event filters
     */
    static createFilters(): {
        bySource: (pluginId: string) => EventFilter;
        byTarget: (pluginId: string) => EventFilter;
        byType: (eventType: string) => EventFilter;
        byPriority: (minPriority: "low" | "medium" | "high" | "critical") => EventFilter;
    };
    /**
     * Create event transformers
     */
    static createTransformers(): {
        addPluginPrefix: (pluginId: string) => EventTransformer;
        addTimestamp: () => EventTransformer;
        addCorrelationId: () => EventTransformer;
    };
}
//# sourceMappingURL=plugin-communication.d.ts.map