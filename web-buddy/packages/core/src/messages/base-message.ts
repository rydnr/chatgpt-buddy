/**
 * Base Message class for Web-Buddy framework
 * 
 * Provides the foundation for all domain-specific messages
 */

import { WebBuddyMessage, CorrelationId } from '../types/web-buddy-types';

export abstract class BaseMessage implements WebBuddyMessage {
  public abstract readonly type: string;
  public readonly correlationId: CorrelationId;
  public readonly timestamp: number;
  public readonly targetDomain?: string;

  constructor(
    public readonly payload: Record<string, any>,
    correlationId?: CorrelationId,
    targetDomain?: string
  ) {
    this.correlationId = correlationId || this.generateCorrelationId();
    this.timestamp = Date.now();
    this.targetDomain = targetDomain;
  }

  /**
   * Generate a unique correlation ID for this message
   */
  private generateCorrelationId(): CorrelationId {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Serialize message to JSON for transmission
   */
  toJSON(): WebBuddyMessage {
    return {
      type: this.type,
      payload: this.payload,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      targetDomain: this.targetDomain
    };
  }

  /**
   * Create a message from JSON data
   */
  static fromJSON(data: WebBuddyMessage): WebBuddyMessage {
    return {
      type: data.type,
      payload: data.payload,
      correlationId: data.correlationId,
      timestamp: data.timestamp,
      targetDomain: data.targetDomain
    };
  }
}