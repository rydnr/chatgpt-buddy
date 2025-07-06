/**
 * @fileoverview Message store adapter for browser extension
 * @description Handles message persistence, time-travel debugging, and message analytics
 * @author Web-Buddy Team
 */

import { Adapter, AdapterFor, Port } from '../../stubs/typescript-eda-stubs';

/**
 * Interface for stored messages
 */
export interface StoredMessage {
  id: string;
  type: string;
  direction: 'inbound' | 'outbound';
  payload: any;
  correlationId: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  metadata: MessageMetadata;
  error?: string;
  response?: any;
}

/**
 * Interface for message metadata
 */
export interface MessageMetadata {
  extensionId: string;
  tabId?: number;
  windowId?: number;
  url?: string;
  userAgent?: string;
  sessionId?: string;
  source?: string;
  destination?: string;
}

/**
 * Interface for message store state
 */
export interface MessageStoreState {
  messages: StoredMessage[];
  currentIndex: number;
  totalMessages: number;
  sessionId: string;
  isTimeTravel: boolean;
  filters: MessageFilter;
  statistics: MessageStatistics;
}

/**
 * Interface for message filtering
 */
export interface MessageFilter {
  types: string[];
  directions: Array<'inbound' | 'outbound'>;
  statuses: Array<'pending' | 'success' | 'error'>;
  timeRange: {
    start?: Date;
    end?: Date;
  };
  correlationIds: string[];
}

/**
 * Interface for message statistics
 */
export interface MessageStatistics {
  total: number;
  byDirection: {
    inbound: number;
    outbound: number;
  };
  byStatus: {
    pending: number;
    success: number;
    error: number;
  };
  byType: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
}

/**
 * Port interface for message store operations
 */
export abstract class MessageStorePort extends Port {
  public readonly name = 'MessageStorePort';
  
  public abstract addInboundMessage(type: string, payload: any, correlationId: string, metadata: MessageMetadata): Promise<void>;
  public abstract addOutboundMessage(type: string, payload: any, correlationId: string, metadata: MessageMetadata): Promise<void>;
  public abstract markMessageSuccess(correlationId: string, response: any): Promise<void>;
  public abstract markMessageError(correlationId: string, error: string): Promise<void>;
  public abstract getState(): MessageStoreState;
  public abstract getMessages(filter?: MessageFilter): Promise<StoredMessage[]>;
  public abstract clearMessages(): Promise<void>;
  public abstract exportMessages(filter?: MessageFilter): Promise<string>;
  public abstract getStatistics(): MessageStatistics;
}

/**
 * Message store adapter for browser extension
 * Provides message persistence, time-travel debugging, and analytics
 */
@AdapterFor(MessageStorePort)
export class MessageStoreAdapter extends MessageStorePort {
  private messages: Map<string, StoredMessage> = new Map();
  private messageOrder: string[] = [];
  private currentSessionId: string;
  private isTimeTravelMode = false;
  private timeTravelIndex = 0;
  private readonly maxMessages = 1000; // Prevent memory issues

  constructor() {
    super();
    this.currentSessionId = this.generateSessionId();
  }

  /**
   * Add an inbound message to the store
   */
  public async addInboundMessage(
    type: string, 
    payload: any, 
    correlationId: string, 
    metadata: MessageMetadata
  ): Promise<void> {
    const message: StoredMessage = {
      id: this.generateMessageId(),
      type,
      direction: 'inbound',
      payload: this.sanitizePayload(payload),
      correlationId,
      timestamp: new Date(),
      status: 'pending',
      metadata: {
        ...metadata,
        sessionId: this.currentSessionId
      }
    };

    await this.storeMessage(message);
    console.log(`📥 Inbound message stored: ${type} (${correlationId})`);
  }

  /**
   * Add an outbound message to the store
   */
  public async addOutboundMessage(
    type: string, 
    payload: any, 
    correlationId: string, 
    metadata: MessageMetadata
  ): Promise<void> {
    const message: StoredMessage = {
      id: this.generateMessageId(),
      type,
      direction: 'outbound',
      payload: this.sanitizePayload(payload),
      correlationId,
      timestamp: new Date(),
      status: 'pending',
      metadata: {
        ...metadata,
        sessionId: this.currentSessionId
      }
    };

    await this.storeMessage(message);
    console.log(`📤 Outbound message stored: ${type} (${correlationId})`);
  }

  /**
   * Mark a message as successful with response data
   */
  public async markMessageSuccess(correlationId: string, response: any): Promise<void> {
    const message = this.findMessageByCorrelationId(correlationId);
    
    if (message) {
      message.status = 'success';
      message.response = this.sanitizePayload(response);
      
      await this.updateMessage(message);
      console.log(`✅ Message marked as success: ${correlationId}`);
    } else {
      console.warn(`⚠️ Message not found for correlation ID: ${correlationId}`);
    }
  }

  /**
   * Mark a message as failed with error details
   */
  public async markMessageError(correlationId: string, error: string): Promise<void> {
    const message = this.findMessageByCorrelationId(correlationId);
    
    if (message) {
      message.status = 'error';
      message.error = error;
      
      await this.updateMessage(message);
      console.log(`❌ Message marked as error: ${correlationId} - ${error}`);
    } else {
      console.warn(`⚠️ Message not found for correlation ID: ${correlationId}`);
    }
  }

  /**
   * Get the current state of the message store
   */
  public getState(): MessageStoreState {
    const messages = Array.from(this.messages.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    return {
      messages,
      currentIndex: this.timeTravelIndex,
      totalMessages: messages.length,
      sessionId: this.currentSessionId,
      isTimeTravel: this.isTimeTravelMode,
      filters: this.getDefaultFilter(),
      statistics: this.calculateStatistics(messages)
    };
  }

  /**
   * Get messages with optional filtering
   */
  public async getMessages(filter?: MessageFilter): Promise<StoredMessage[]> {
    let messages = Array.from(this.messages.values());

    if (filter) {
      messages = this.applyFilter(messages, filter);
    }

    return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Clear all messages from the store
   */
  public async clearMessages(): Promise<void> {
    this.messages.clear();
    this.messageOrder = [];
    this.timeTravelIndex = 0;
    this.isTimeTravelMode = false;
    
    console.log('🗑️ Message store cleared');
  }

  /**
   * Export messages to JSON format
   */
  public async exportMessages(filter?: MessageFilter): Promise<string> {
    const messages = await this.getMessages(filter);
    const exportData = {
      exportTime: new Date().toISOString(),
      sessionId: this.currentSessionId,
      messageCount: messages.length,
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Get message statistics
   */
  public getStatistics(): MessageStatistics {
    const messages = Array.from(this.messages.values());
    return this.calculateStatistics(messages);
  }

  /**
   * Enable time-travel debugging mode
   */
  public enableTimeTravel(): void {
    this.isTimeTravelMode = true;
    this.timeTravelIndex = this.messageOrder.length - 1;
    console.log('⏰ Time-travel mode enabled');
  }

  /**
   * Disable time-travel debugging mode
   */
  public disableTimeTravel(): void {
    this.isTimeTravelMode = false;
    this.timeTravelIndex = 0;
    console.log('⏰ Time-travel mode disabled');
  }

  /**
   * Navigate to previous message in time-travel mode
   */
  public timeTravelPrevious(): StoredMessage | null {
    if (!this.isTimeTravelMode || this.timeTravelIndex <= 0) {
      return null;
    }

    this.timeTravelIndex--;
    const messageId = this.messageOrder[this.timeTravelIndex];
    const message = this.messages.get(messageId);
    
    if (message) {
      console.log(`⏪ Time-travel: Previous message (${this.timeTravelIndex + 1}/${this.messageOrder.length})`);
    }
    
    return message || null;
  }

  /**
   * Navigate to next message in time-travel mode
   */
  public timeTravelNext(): StoredMessage | null {
    if (!this.isTimeTravelMode || this.timeTravelIndex >= this.messageOrder.length - 1) {
      return null;
    }

    this.timeTravelIndex++;
    const messageId = this.messageOrder[this.timeTravelIndex];
    const message = this.messages.get(messageId);
    
    if (message) {
      console.log(`⏩ Time-travel: Next message (${this.timeTravelIndex + 1}/${this.messageOrder.length})`);
    }
    
    return message || null;
  }

  /**
   * Jump to specific message in time-travel mode
   */
  public timeTravelToIndex(index: number): StoredMessage | null {
    if (!this.isTimeTravelMode || index < 0 || index >= this.messageOrder.length) {
      return null;
    }

    this.timeTravelIndex = index;
    const messageId = this.messageOrder[index];
    const message = this.messages.get(messageId);
    
    if (message) {
      console.log(`⏭️ Time-travel: Jump to message (${index + 1}/${this.messageOrder.length})`);
    }
    
    return message || null;
  }

  /**
   * Get current message in time-travel mode
   */
  public getCurrentTimeTravelMessage(): StoredMessage | null {
    if (!this.isTimeTravelMode || this.timeTravelIndex < 0 || this.timeTravelIndex >= this.messageOrder.length) {
      return null;
    }

    const messageId = this.messageOrder[this.timeTravelIndex];
    return this.messages.get(messageId) || null;
  }

  /**
   * Store a message in the store
   */
  private async storeMessage(message: StoredMessage): Promise<void> {
    // Enforce message limit
    if (this.messages.size >= this.maxMessages) {
      await this.removeOldestMessage();
    }

    this.messages.set(message.id, message);
    this.messageOrder.push(message.id);

    // Update time-travel index if not in time-travel mode
    if (!this.isTimeTravelMode) {
      this.timeTravelIndex = this.messageOrder.length - 1;
    }
  }

  /**
   * Update an existing message
   */
  private async updateMessage(message: StoredMessage): Promise<void> {
    this.messages.set(message.id, message);
  }

  /**
   * Remove the oldest message to maintain memory limits
   */
  private async removeOldestMessage(): Promise<void> {
    if (this.messageOrder.length === 0) return;

    const oldestMessageId = this.messageOrder.shift();
    if (oldestMessageId) {
      this.messages.delete(oldestMessageId);
      
      // Adjust time-travel index
      if (this.timeTravelIndex > 0) {
        this.timeTravelIndex--;
      }
    }
  }

  /**
   * Find message by correlation ID
   */
  private findMessageByCorrelationId(correlationId: string): StoredMessage | undefined {
    for (const message of this.messages.values()) {
      if (message.correlationId === correlationId) {
        return message;
      }
    }
    return undefined;
  }

  /**
   * Apply filter to messages
   */
  private applyFilter(messages: StoredMessage[], filter: MessageFilter): StoredMessage[] {
    return messages.filter(message => {
      // Filter by types
      if (filter.types.length > 0 && !filter.types.includes(message.type)) {
        return false;
      }

      // Filter by directions
      if (filter.directions.length > 0 && !filter.directions.includes(message.direction)) {
        return false;
      }

      // Filter by statuses
      if (filter.statuses.length > 0 && !filter.statuses.includes(message.status)) {
        return false;
      }

      // Filter by time range
      if (filter.timeRange.start && message.timestamp < filter.timeRange.start) {
        return false;
      }
      if (filter.timeRange.end && message.timestamp > filter.timeRange.end) {
        return false;
      }

      // Filter by correlation IDs
      if (filter.correlationIds.length > 0 && !filter.correlationIds.includes(message.correlationId)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate message statistics
   */
  private calculateStatistics(messages: StoredMessage[]): MessageStatistics {
    const stats: MessageStatistics = {
      total: messages.length,
      byDirection: { inbound: 0, outbound: 0 },
      byStatus: { pending: 0, success: 0, error: 0 },
      byType: {},
      averageResponseTime: 0,
      errorRate: 0
    };

    if (messages.length === 0) {
      return stats;
    }

    let totalResponseTime = 0;
    let responseCount = 0;

    messages.forEach(message => {
      // Count by direction
      stats.byDirection[message.direction]++;

      // Count by status
      stats.byStatus[message.status]++;

      // Count by type
      stats.byType[message.type] = (stats.byType[message.type] || 0) + 1;

      // Calculate response time for completed messages
      if (message.status !== 'pending' && message.response) {
        const responseTime = new Date(message.response.timestamp || Date.now()).getTime() - message.timestamp.getTime();
        if (responseTime > 0) {
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    });

    // Calculate averages and rates
    stats.averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    stats.errorRate = stats.total > 0 ? stats.byStatus.error / stats.total : 0;

    return stats;
  }

  /**
   * Get default filter (no filtering)
   */
  private getDefaultFilter(): MessageFilter {
    return {
      types: [],
      directions: [],
      statuses: [],
      timeRange: {},
      correlationIds: []
    };
  }

  /**
   * Sanitize payload to remove sensitive data
   */
  private sanitizePayload(payload: any): any {
    if (!payload) return payload;

    // Create a deep copy to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(payload));

    // Remove or mask sensitive fields
    this.recursiveSanitize(sanitized);

    return sanitized;
  }

  /**
   * Recursively sanitize object properties
   */
  private recursiveSanitize(obj: any): void {
    if (typeof obj !== 'object' || obj === null) return;

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        obj[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        this.recursiveSanitize(value);
      }
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize the adapter
   */
  public async initialize(): Promise<void> {
    console.log('🔧 Message store adapter initialized');
  }

  /**
   * Cleanup the adapter
   */
  public async shutdown(): Promise<void> {
    await this.clearMessages();
    console.log('🔌 Message store adapter shut down');
  }

  /**
   * Check adapter health
   */
  public async isHealthy(): Promise<boolean> {
    try {
      // Basic health checks
      return this.messages instanceof Map && Array.isArray(this.messageOrder);
    } catch (error) {
      console.error('❌ Message store adapter health check failed:', error);
      return false;
    }
  }
}