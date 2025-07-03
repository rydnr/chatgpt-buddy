/**
 * Core type definitions for Web-Buddy framework
 */

// Unique identifier for tracking requests through the system
export type CorrelationId = string;

// Base configuration for WebBuddyClient
export interface WebBuddyClientConfig {
  serverUrl: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  preferredTransport?: 'websocket' | 'dbus' | 'auto';
}

// Generic message interface for all Web-Buddy communications
export interface WebBuddyMessage {
  type: string;
  payload: Record<string, any>;
  correlationId: CorrelationId;
  targetDomain?: string;
  timestamp?: number;
}

// Response interface for all Web-Buddy operations
export interface WebBuddyResponse {
  success: boolean;
  data?: any;
  error?: string;
  correlationId: CorrelationId;
  timestamp: number;
}

// Handler interface for processing messages
export interface MessageHandler {
  handle(message: WebBuddyMessage): Promise<any>;
}

// Event interface for TypeScript-EDA integration
export interface WebBuddyEvent {
  type: string;
  payload: Record<string, any>;
  correlationId: CorrelationId;
  timestamp: number;
}