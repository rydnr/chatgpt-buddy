/**
 * @fileoverview Plugin Communication System for Web-Buddy plugin architecture
 * @description Implements plugin messaging, event bus, and inter-plugin communication
 */

import {
  PluginEvent,
  PluginEventHandler,
  PluginEventBus,
  PluginMessaging,
  PluginError
} from './plugin-interface';

/**
 * Message types for plugin communication
 */
export enum PluginMessageType {
  DIRECT_MESSAGE = 'direct-message',
  BROADCAST = 'broadcast',
  REQUEST = 'request',
  RESPONSE = 'response',
  PUBLISH = 'publish',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe'
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
 * Subscription information
 */
interface Subscription {
  pluginId: string;
  topic: string;
  handler: PluginEventHandler;
  created: Date;
}

/**
 * Request tracking information
 */
interface PendingRequest {
  requestId: string;
  from: string;
  to: string;
  timestamp: Date;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout?: NodeJS.Timeout;
}

/**
 * Event bus implementation with filtering and history
 */
export class DefaultPluginEventBus implements PluginEventBus {
  private eventHandlers: Map<string, Set<PluginEventHandler>> = new Map();
  private eventHistory: PluginEvent[] = [];
  private filters: EventFilter[] = [];
  private transformers: EventTransformer[] = [];
  private maxHistorySize: number = 1000;

  /**
   * Emit an event to all registered handlers
   */
  async emit(event: PluginEvent): Promise<void> {
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
        } catch (error) {
          console.error(`Error in event handler for ${transformedEvent.type}:`, error);
          // Don't throw here to avoid stopping other handlers
        }
      });

      await Promise.allSettled(promises);

    } catch (error) {
      console.error('Error emitting event:', error);
      throw new PluginError(
        `Failed to emit event ${event.type}: ${(error as Error).message}`,
        event.source,
        'EVENT_EMISSION_ERROR',
        error
      );
    }
  }

  /**
   * Register an event handler
   */
  on(eventType: string, handler: PluginEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  /**
   * Unregister an event handler
   */
  off(eventType: string, handler: PluginEventHandler): void {
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
  once(eventType: string, handler: PluginEventHandler): void {
    const onceHandler: PluginEventHandler = async (event: PluginEvent) => {
      this.off(eventType, onceHandler);
      await handler(event);
    };
    this.on(eventType, onceHandler);
  }

  /**
   * Create a filtered event bus
   */
  filter(predicate: EventFilter): PluginEventBus {
    const filteredBus = new DefaultPluginEventBus();
    filteredBus.filters = [...this.filters, predicate];
    filteredBus.transformers = [...this.transformers];
    filteredBus.eventHandlers = new Map(this.eventHandlers);
    return filteredBus;
  }

  /**
   * Create a transformed event bus
   */
  pipe(transformer: EventTransformer): PluginEventBus {
    const pipedBus = new DefaultPluginEventBus();
    pipedBus.filters = [...this.filters];
    pipedBus.transformers = [...this.transformers, transformer];
    pipedBus.eventHandlers = new Map(this.eventHandlers);
    return pipedBus;
  }

  /**
   * Get event history
   */
  getHistory(pluginId?: string): PluginEvent[] {
    if (pluginId) {
      return this.eventHistory.filter(event => 
        event.source === pluginId || event.target === pluginId
      );
    }
    return [...this.eventHistory];
  }

  /**
   * Replay events from a timestamp
   */
  async replay(fromTimestamp?: string): Promise<void> {
    const targetTime = fromTimestamp ? new Date(fromTimestamp) : new Date(0);
    
    const eventsToReplay = this.eventHistory.filter(event => 
      new Date(event.timestamp) >= targetTime
    );

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
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get event statistics
   */
  getStatistics() {
    const stats = {
      totalEvents: this.eventHistory.length,
      handlerCount: 0,
      eventTypes: new Set<string>(),
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

  private passesFilters(event: PluginEvent): boolean {
    return this.filters.every(filter => filter(event));
  }

  private applyTransformers(event: PluginEvent): PluginEvent {
    return this.transformers.reduce((transformedEvent, transformer) => 
      transformer(transformedEvent), event
    );
  }

  private addToHistory(event: PluginEvent): void {
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
export class DefaultPluginMessaging implements PluginMessaging {
  private subscriptions: Map<string, Set<Subscription>> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private requestTimeout: number = 30000; // 30 seconds

  constructor(private eventBus: PluginEventBus) {
    this.setupSystemHandlers();
  }

  /**
   * Send a direct message to another plugin
   */
  async sendMessage(fromPlugin: string, toPlugin: string, message: any): Promise<any> {
    const pluginMessage: PluginMessage = {
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
  async publish(topic: string, data: any): Promise<void> {
    const subscriptions = this.subscriptions.get(topic) || new Set();
    
    const publishEvent: PluginEvent = {
      type: 'plugin:topic:published',
      source: 'messaging-system',
      data: { topic, data },
      timestamp: new Date().toISOString()
    };

    await this.eventBus.emit(publishEvent);

    // Deliver to all subscribers
    const promises = Array.from(subscriptions).map(async (subscription) => {
      try {
        const event: PluginEvent = {
          type: `topic:${topic}`,
          source: 'messaging-system',
          target: subscription.pluginId,
          data,
          timestamp: new Date().toISOString()
        };
        
        await subscription.handler(event);
      } catch (error) {
        console.error(`Error delivering topic message to ${subscription.pluginId}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string, handler: PluginEventHandler): void {
    // Extract plugin ID from the handler context (this is a simplified approach)
    const pluginId = this.extractPluginIdFromHandler(handler) || 'unknown';
    
    const subscription: Subscription = {
      pluginId,
      topic,
      handler,
      created: new Date()
    };

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    
    this.subscriptions.get(topic)!.add(subscription);

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
  unsubscribe(topic: string, handler: PluginEventHandler): void {
    const subscriptions = this.subscriptions.get(topic);
    if (!subscriptions) return;

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
  async request(pluginId: string, request: any): Promise<any> {
    const requestId = this.generateMessageId();
    
    const requestMessage: PluginMessage = {
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
      const pendingRequest: PendingRequest = {
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
  async respond(requestId: string, response: any): Promise<void> {
    const pendingRequest = this.pendingRequests.get(requestId);
    if (!pendingRequest) {
      throw new Error(`No pending request found for ID: ${requestId}`);
    }

    const responseMessage: PluginMessage = {
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
  async broadcast(message: any): Promise<void> {
    const broadcastEvent: PluginEvent = {
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
  registerMessageHandler(pluginId: string, handler: MessageHandler): void {
    this.messageHandlers.set(pluginId, handler);
  }

  /**
   * Unregister a message handler
   */
  unregisterMessageHandler(pluginId: string): void {
    this.messageHandlers.delete(pluginId);
  }

  /**
   * Get messaging statistics
   */
  getStatistics() {
    const subscriptionStats = new Map<string, number>();
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
  cleanup(): void {
    const now = Date.now();
    const expiredRequests: string[] = [];

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

  private async deliverMessage(message: PluginMessage): Promise<any> {
    if (message.to) {
      // Direct message delivery
      const handler = this.messageHandlers.get(message.to);
      if (handler) {
        try {
          return await handler(message);
        } catch (error) {
          throw new PluginError(
            `Message delivery failed to ${message.to}: ${(error as Error).message}`,
            message.from,
            'MESSAGE_DELIVERY_ERROR',
            error
          );
        }
      } else {
        throw new PluginError(
          `No message handler registered for plugin: ${message.to}`,
          message.from,
          'NO_MESSAGE_HANDLER'
        );
      }
    } else {
      // Broadcast message
      const promises = Array.from(this.messageHandlers.entries()).map(async ([pluginId, handler]) => {
        try {
          await handler({ ...message, to: pluginId });
        } catch (error) {
          console.error(`Error delivering broadcast message to ${pluginId}:`, error);
        }
      });

      await Promise.allSettled(promises);
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractPluginIdFromHandler(handler: PluginEventHandler): string | null {
    // This is a simplified approach. In a real implementation, you might
    // bind the plugin ID to the handler or use a more sophisticated method
    return (handler as any).pluginId || null;
  }

  private setupSystemHandlers(): void {
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
  private eventBus: PluginEventBus;
  private messaging: PluginMessaging;

  constructor() {
    this.eventBus = new DefaultPluginEventBus();
    this.messaging = new DefaultPluginMessaging(this.eventBus);
  }

  /**
   * Get the event bus instance
   */
  getEventBus(): PluginEventBus {
    return this.eventBus;
  }

  /**
   * Get the messaging instance
   */
  getMessaging(): PluginMessaging {
    return this.messaging;
  }

  /**
   * Create a plugin-specific event bus
   */
  createPluginEventBus(pluginId: string): PluginEventBus {
    return this.eventBus.filter(event => 
      event.source === pluginId || 
      event.target === pluginId || 
      !event.target // Global events
    );
  }

  /**
   * Create a topic-specific event bus
   */
  createTopicEventBus(topic: string): PluginEventBus {
    return this.eventBus.filter(event => 
      event.type.startsWith(`topic:${topic}`) ||
      event.type === 'plugin:topic:published' ||
      event.type === 'plugin:topic:subscribed' ||
      event.type === 'plugin:topic:unsubscribed'
    );
  }

  /**
   * Create event bus with custom filters
   */
  createFilteredEventBus(filters: EventFilter[]): PluginEventBus {
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
  static createChannel(
    messaging: PluginMessaging,
    fromPlugin: string,
    toPlugin: string
  ): {
    send: (data: any) => Promise<any>;
    request: (data: any) => Promise<any>;
  } {
    return {
      send: (data: any) => messaging.sendMessage(fromPlugin, toPlugin, data),
      request: (data: any) => messaging.request(toPlugin, data)
    };
  }

  /**
   * Create a topic publisher
   */
  static createPublisher(
    messaging: PluginMessaging,
    topic: string
  ): (data: any) => Promise<void> {
    return (data: any) => messaging.publish(topic, data);
  }

  /**
   * Create a topic subscriber
   */
  static createSubscriber(
    messaging: PluginMessaging,
    topic: string,
    handler: PluginEventHandler
  ): () => void {
    messaging.subscribe(topic, handler);
    return () => messaging.unsubscribe(topic, handler);
  }

  /**
   * Create event filters
   */
  static createFilters() {
    return {
      bySource: (pluginId: string): EventFilter => 
        (event) => event.source === pluginId,
      
      byTarget: (pluginId: string): EventFilter => 
        (event) => event.target === pluginId,
      
      byType: (eventType: string): EventFilter => 
        (event) => event.type === eventType,
      
      byPriority: (minPriority: 'low' | 'medium' | 'high' | 'critical'): EventFilter => {
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
      addPluginPrefix: (pluginId: string): EventTransformer => 
        (event) => ({
          ...event,
          type: `plugin:${pluginId}:${event.type}`
        }),
      
      addTimestamp: (): EventTransformer => 
        (event) => ({
          ...event,
          timestamp: new Date().toISOString()
        }),
      
      addCorrelationId: (): EventTransformer => 
        (event) => ({
          ...event,
          correlationId: event.correlationId || `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })
    };
  }
}