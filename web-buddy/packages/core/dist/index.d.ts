/**
 * Web-Buddy Core - Generic Web Automation Framework
 *
 * This is the core layer that provides generic message-passing infrastructure
 * for web automation. Domain-specific implementations build upon this foundation.
 */
export { WebBuddyClient, type WebBuddyClientConfig } from './client';
export { WebBuddyServer, type WebBuddyServerConfig, type ExtensionConnection } from './server';
export { WebBuddyExtension, type WebBuddyExtensionConfig, ContentScriptIntegration } from './extension';
import { WebBuddyClient } from './client';
import { WebBuddyServer, type WebBuddyServerConfig } from './server';
import { WebBuddyExtension } from './extension';
export { type WebBuddyEvent, type AutomationEvent, BaseEvent, type EventHandler, type EventResponse, createSuccessResponse, createErrorResponse, EventPriority, type EventMetadata, type MetadataEvent } from './events/base';
export { AutomationRequestedEvent, AutomationImplementedEvent, AutomationSucceededEvent, AutomationFailedEvent, UserGuidanceRequestedEvent, UserGuidanceProvidedEvent, AutomationEventFactory } from './events/automation';
export { type WebBuddyMessage, BaseMessage, type MessageHandler, type MessageResponse } from './messages/base';
export { type AutomationStorage, type StoredAutomation, type AutomationSearchCriteria, IndexedDBAutomationStorage, createAutomationStorage } from './storage/automation-storage';
export { AutomationManager, type ReusePreference, type AutomationExecutionResult } from './learning/automation-manager';
export declare const VERSION = "1.0.0";
/**
 * Factory function to create a configured WebBuddyClient
 * Provides a convenient way to create clients with default configuration
 *
 * @param config - Client configuration
 * @returns Configured WebBuddyClient instance with learning capabilities
 */
export declare function createWebBuddyClient(config: {
    serverUrl: string;
    timeout?: number;
    apiKey?: string;
    learningEnabled?: boolean;
}): WebBuddyClient;
/**
 * Factory function to create a learning-enabled automation client
 * Convenient wrapper for automation-focused usage
 */
export declare function createAutomationClient(config: {
    serverUrl: string;
    timeout?: number;
    apiKey?: string;
}): WebBuddyClient;
/**
 * Factory function to create a configured WebBuddyServer
 * Provides a convenient way to create servers with default configuration
 *
 * @param config - Server configuration
 * @returns Configured WebBuddyServer instance
 */
export declare function createWebBuddyServer(config?: WebBuddyServerConfig): WebBuddyServer;
/**
 * Factory function to create a configured WebBuddyExtension
 * Provides a convenient way to create extensions with default configuration
 *
 * @param config - Extension configuration
 * @returns Configured WebBuddyExtension instance
 */
export declare function createWebBuddyExtension(config: {
    serverUrl: string;
    extensionId?: string;
}): WebBuddyExtension;
//# sourceMappingURL=index.d.ts.map