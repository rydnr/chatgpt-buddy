/**
 * @fileoverview Plugin Communication System for Web-Buddy plugin architecture
 * @description Implements plugin messaging, event bus, and inter-plugin communication
 */
import { PluginError } from './plugin-interface';
/**
 * Message types for plugin communication
 */
export var PluginMessageType;
(function (PluginMessageType) {
    PluginMessageType["DIRECT_MESSAGE"] = "direct-message";
    PluginMessageType["BROADCAST"] = "broadcast";
    PluginMessageType["REQUEST"] = "request";
    PluginMessageType["RESPONSE"] = "response";
    PluginMessageType["PUBLISH"] = "publish";
    PluginMessageType["SUBSCRIBE"] = "subscribe";
    PluginMessageType["UNSUBSCRIBE"] = "unsubscribe";
})(PluginMessageType || (PluginMessageType = {}));
/**
 * Event bus implementation with filtering and history
 */
export class DefaultPluginEventBus {
    constructor() {
        this.eventHandlers = new Map();
        this.eventHistory = [];
        this.filters = [];
        this.transformers = [];
        this.maxHistorySize = 1000;
    }
    /**
     * Emit an event to all registered handlers
     */
    async emit(event) {
        try {
            // Apply filters
            if (!this.passesFilters(event)) {
                return;
            }
            // Apply transformers
            const transformedEvent = this.applyTransformers(event);
            // Add to history
            this.addToHistory(transformedEvent);
            // Get handlers for this event type
            const handlers = this.eventHandlers.get(transformedEvent.type) || new Set();
            // Execute all handlers
            const promises = Array.from(handlers).map(async (handler) => {
                try {
                    await handler(transformedEvent);
                }
                catch (error) {
                    console.error(`Error in event handler for ${transformedEvent.type}:`, error);
                    // Don't throw here to avoid stopping other handlers
                }
            });
            await Promise.allSettled(promises);
        }
        catch (error) {
            console.error('Error emitting event:', error);
            throw new PluginError(`Failed to emit event ${event.type}: ${error.message}`, event.source, 'EVENT_EMISSION_ERROR', error);
        }
    }
    /**
     * Register an event handler
     */
    on(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, new Set());
        }
        this.eventHandlers.get(eventType).add(handler);
    }
    /**
     * Unregister an event handler
     */
    off(eventType, handler) {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.eventHandlers.delete(eventType);
            }
        }
    }
    /**
     * Register a one-time event handler
     */
    once(eventType, handler) {
        const onceHandler = async (event) => {
            this.off(eventType, onceHandler);
            await handler(event);
        };
        this.on(eventType, onceHandler);
    }
    /**
     * Create a filtered event bus
     */
    filter(predicate) {
        const filteredBus = new DefaultPluginEventBus();
        filteredBus.filters = [...this.filters, predicate];
        filteredBus.transformers = [...this.transformers];
        filteredBus.eventHandlers = new Map(this.eventHandlers);
        return filteredBus;
    }
    /**
     * Create a transformed event bus
     */
    pipe(transformer) {
        const pipedBus = new DefaultPluginEventBus();
        pipedBus.filters = [...this.filters];
        pipedBus.transformers = [...this.transformers, transformer];
        pipedBus.eventHandlers = new Map(this.eventHandlers);
        return pipedBus;
    }
    /**
     * Get event history
     */
    getHistory(pluginId) {
        if (pluginId) {
            return this.eventHistory.filter(event => event.source === pluginId || event.target === pluginId);
        }
        return [...this.eventHistory];
    }
    /**
     * Replay events from a timestamp
     */
    async replay(fromTimestamp) {
        const targetTime = fromTimestamp ? new Date(fromTimestamp) : new Date(0);
        const eventsToReplay = this.eventHistory.filter(event => new Date(event.timestamp) >= targetTime);
        for (const event of eventsToReplay) {
            await this.emit({
                ...event,
                type: `replay:${event.type}`,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
    }
    /**
     * Get event statistics
     */
    getStatistics() {
        const stats = {
            totalEvents: this.eventHistory.length,
            handlerCount: 0,
            eventTypes: new Set(),
            filters: this.filters.length,
            transformers: this.transformers.length
        };
        for (const handlers of this.eventHandlers.values()) {
            stats.handlerCount += handlers.size;
        }
        for (const event of this.eventHistory) {
            stats.eventTypes.add(event.type);
        }
        return {
            ...stats,
            eventTypes: Array.from(stats.eventTypes)
        };
    }
    // Private helper methods
    passesFilters(event) {
        return this.filters.every(filter => filter(event));
    }
    applyTransformers(event) {
        return this.transformers.reduce((transformedEvent, transformer) => transformer(transformedEvent), event);
    }
    addToHistory(event) {
        this.eventHistory.push(event);
        // Trim history if it exceeds max size
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
        }
    }
}
/**
 * Plugin messaging implementation
 */
export class DefaultPluginMessaging {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.subscriptions = new Map();
        this.pendingRequests = new Map();
        this.messageHandlers = new Map();
        this.requestTimeout = 30000; // 30 seconds
        this.setupSystemHandlers();
    }
    /**
     * Send a direct message to another plugin
     */
    async sendMessage(fromPlugin, toPlugin, message) {
        const pluginMessage = {
            id: this.generateMessageId(),
            type: PluginMessageType.DIRECT_MESSAGE,
            from: fromPlugin,
            to: toPlugin,
            data: message,
            timestamp: new Date().toISOString()
        };
        return this.deliverMessage(pluginMessage);
    }
    /**
     * Publish a message to a topic
     */
    async publish(topic, data) {
        const subscriptions = this.subscriptions.get(topic) || new Set();
        const publishEvent = {
            type: 'plugin:topic:published',
            source: 'messaging-system',
            data: { topic, data },
            timestamp: new Date().toISOString()
        };
        await this.eventBus.emit(publishEvent);
        // Deliver to all subscribers
        const promises = Array.from(subscriptions).map(async (subscription) => {
            try {
                const event = {
                    type: `topic:${topic}`,
                    source: 'messaging-system',
                    target: subscription.pluginId,
                    data,
                    timestamp: new Date().toISOString()
                };
                await subscription.handler(event);
            }
            catch (error) {
                console.error(`Error delivering topic message to ${subscription.pluginId}:`, error);
            }
        });
        await Promise.allSettled(promises);
    }
    /**
     * Subscribe to a topic
     */
    subscribe(topic, handler) {
        // Extract plugin ID from the handler context (this is a simplified approach)
        const pluginId = this.extractPluginIdFromHandler(handler) || 'unknown';
        const subscription = {
            pluginId,
            topic,
            handler,
            created: new Date()
        };
        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, new Set());
        }
        this.subscriptions.get(topic).add(subscription);
        // Emit subscription event
        this.eventBus.emit({
            type: 'plugin:topic:subscribed',
            source: 'messaging-system',
            target: pluginId,
            data: { topic, pluginId },
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Unsubscribe from a topic
     */
    unsubscribe(topic, handler) {
        const subscriptions = this.subscriptions.get(topic);
        if (!subscriptions)
            return;
        const toRemove = Array.from(subscriptions).find(sub => sub.handler === handler);
        if (toRemove) {
            subscriptions.delete(toRemove);
            if (subscriptions.size === 0) {
                this.subscriptions.delete(topic);
            }
            // Emit unsubscription event
            this.eventBus.emit({
                type: 'plugin:topic:unsubscribed',
                source: 'messaging-system',
                target: toRemove.pluginId,
                data: { topic, pluginId: toRemove.pluginId },
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Send a request and wait for response
     */
    async request(pluginId, request) {
        const requestId = this.generateMessageId();
        const requestMessage = {
            id: this.generateMessageId(),
            type: PluginMessageType.REQUEST,
            from: 'messaging-system', // This should be set to the actual requesting plugin
            to: pluginId,
            data: request,
            timestamp: new Date().toISOString(),
            requestId
        };
        return new Promise((resolve, reject) => {
            // Set up timeout
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error(`Request timeout: ${pluginId} did not respond within ${this.requestTimeout}ms`));
            }, this.requestTimeout);
            // Store pending request
            const pendingRequest = {
                requestId,
                from: requestMessage.from,
                to: pluginId,
                timestamp: new Date(),
                resolve,
                reject,
                timeout
            };
            this.pendingRequests.set(requestId, pendingRequest);
            // Send the request
            this.deliverMessage(requestMessage).catch(error => {
                clearTimeout(timeout);
                this.pendingRequests.delete(requestId);
                reject(error);
            });
        });
    }
    /**
     * Send a response to a request
     */
    async respond(requestId, response) {
        const pendingRequest = this.pendingRequests.get(requestId);
        if (!pendingRequest) {
            throw new Error(`No pending request found for ID: ${requestId}`);
        }
        const responseMessage = {
            id: this.generateMessageId(),
            type: PluginMessageType.RESPONSE,
            from: pendingRequest.to,
            to: pendingRequest.from,
            data: response,
            timestamp: new Date().toISOString(),
            responseId: requestId
        };
        // Clear timeout and resolve pending request
        if (pendingRequest.timeout) {
            clearTimeout(pendingRequest.timeout);
        }
        this.pendingRequests.delete(requestId);
        pendingRequest.resolve(response);
        // Emit response event
        await this.eventBus.emit({
            type: 'plugin:request:responded',
            source: 'messaging-system',
            data: { requestId, response },
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Broadcast a message to all plugins
     */
    async broadcast(message) {
        const broadcastEvent = {
            type: 'plugin:broadcast',
            source: 'messaging-system',
            data: message,
            timestamp: new Date().toISOString()
        };
        await this.eventBus.emit(broadcastEvent);
    }
    /**
     * Register a message handler for a plugin
     */
    registerMessageHandler(pluginId, handler) {
        this.messageHandlers.set(pluginId, handler);
    }
    /**
     * Unregister a message handler
     */
    unregisterMessageHandler(pluginId) {
        this.messageHandlers.delete(pluginId);
    }
    /**
     * Get messaging statistics
     */
    getStatistics() {
        const subscriptionStats = new Map();
        for (const [topic, subs] of this.subscriptions.entries()) {
            subscriptionStats.set(topic, subs.size);
        }
        return {
            totalSubscriptions: Array.from(this.subscriptions.values())
                .reduce((total, subs) => total + subs.size, 0),
            topicCount: this.subscriptions.size,
            pendingRequests: this.pendingRequests.size,
            registeredHandlers: this.messageHandlers.size,
            subscriptionsByTopic: Object.fromEntries(subscriptionStats)
        };
    }
    /**
     * Clean up expired requests and subscriptions
     */
    cleanup() {
        const now = Date.now();
        const expiredRequests = [];
        // Find expired requests
        for (const [requestId, request] of this.pendingRequests.entries()) {
            if (now - request.timestamp.getTime() > this.requestTimeout) {
                expiredRequests.push(requestId);
            }
        }
        // Clean up expired requests
        for (const requestId of expiredRequests) {
            const request = this.pendingRequests.get(requestId);
            if (request) {
                if (request.timeout) {
                    clearTimeout(request.timeout);
                }
                request.reject(new Error('Request expired during cleanup'));
                this.pendingRequests.delete(requestId);
            }
        }
    }
    // Private helper methods
    async deliverMessage(message) {
        if (message.to) {
            // Direct message delivery
            const handler = this.messageHandlers.get(message.to);
            if (handler) {
                try {
                    return await handler(message);
                }
                catch (error) {
                    throw new PluginError(`Message delivery failed to ${message.to}: ${error.message}`, message.from, 'MESSAGE_DELIVERY_ERROR', error);
                }
            }
            else {
                throw new PluginError(`No message handler registered for plugin: ${message.to}`, message.from, 'NO_MESSAGE_HANDLER');
            }
        }
        else {
            // Broadcast message
            const promises = Array.from(this.messageHandlers.entries()).map(async ([pluginId, handler]) => {
                try {
                    await handler({ ...message, to: pluginId });
                }
                catch (error) {
                    console.error(`Error delivering broadcast message to ${pluginId}:`, error);
                }
            });
            await Promise.allSettled(promises);
        }
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    extractPluginIdFromHandler(handler) {
        // This is a simplified approach. In a real implementation, you might
        // bind the plugin ID to the handler or use a more sophisticated method
        return handler.pluginId || null;
    }
    setupSystemHandlers() {
        // Set up periodic cleanup
        setInterval(() => {
            this.cleanup();
        }, 60000); // Clean up every minute
    }
}
/**
 * Plugin communication factory
 */
export class PluginCommunicationFactory {
    constructor() {
        this.eventBus = new DefaultPluginEventBus();
        this.messaging = new DefaultPluginMessaging(this.eventBus);
    }
    /**
     * Get the event bus instance
     */
    getEventBus() {
        return this.eventBus;
    }
    /**
     * Get the messaging instance
     */
    getMessaging() {
        return this.messaging;
    }
    /**
     * Create a plugin-specific event bus
     */
    createPluginEventBus(pluginId) {
        return this.eventBus.filter(event => event.source === pluginId ||
            event.target === pluginId ||
            !event.target // Global events
        );
    }
    /**
     * Create a topic-specific event bus
     */
    createTopicEventBus(topic) {
        return this.eventBus.filter(event => event.type.startsWith(`topic:${topic}`) ||
            event.type === 'plugin:topic:published' ||
            event.type === 'plugin:topic:subscribed' ||
            event.type === 'plugin:topic:unsubscribed');
    }
    /**
     * Create event bus with custom filters
     */
    createFilteredEventBus(filters) {
        return filters.reduce((bus, filter) => bus.filter(filter), this.eventBus);
    }
    /**
     * Get communication statistics
     */
    getStatistics() {
        return {
            eventBus: this.eventBus.getStatistics(),
            messaging: this.messaging.getStatistics()
        };
    }
}
/**
 * Helper functions for common communication patterns
 */
export class PluginCommunicationHelpers {
    /**
     * Create a plugin-to-plugin communication channel
     */
    static createChannel(messaging, fromPlugin, toPlugin) {
        return {
            send: (data) => messaging.sendMessage(fromPlugin, toPlugin, data),
            request: (data) => messaging.request(toPlugin, data)
        };
    }
    /**
     * Create a topic publisher
     */
    static createPublisher(messaging, topic) {
        return (data) => messaging.publish(topic, data);
    }
    /**
     * Create a topic subscriber
     */
    static createSubscriber(messaging, topic, handler) {
        messaging.subscribe(topic, handler);
        return () => messaging.unsubscribe(topic, handler);
    }
    /**
     * Create event filters
     */
    static createFilters() {
        return {
            bySource: (pluginId) => (event) => event.source === pluginId,
            byTarget: (pluginId) => (event) => event.target === pluginId,
            byType: (eventType) => (event) => event.type === eventType,
            byPriority: (minPriority) => {
                const priorities = { low: 0, medium: 1, high: 2, critical: 3 };
                const minLevel = priorities[minPriority];
                return (event) => {
                    const eventLevel = priorities[event.priority || 'low'];
                    return eventLevel >= minLevel;
                };
            }
        };
    }
    /**
     * Create event transformers
     */
    static createTransformers() {
        return {
            addPluginPrefix: (pluginId) => (event) => ({
                ...event,
                type: `plugin:${pluginId}:${event.type}`
            }),
            addTimestamp: () => (event) => ({
                ...event,
                timestamp: new Date().toISOString()
            }),
            addCorrelationId: () => (event) => ({
                ...event,
                correlationId: event.correlationId || `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            })
        };
    }
}
