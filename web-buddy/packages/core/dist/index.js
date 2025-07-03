/*
                        Web-Buddy Core

    Copyright (C) 2025-today  rydnr@acm-sl.org

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
/**
 * Web-Buddy Core - Generic Web Automation Framework
 *
 * This is the core layer that provides generic message-passing infrastructure
 * for web automation. Domain-specific implementations build upon this foundation.
 */
// Core client API
export { WebBuddyClient } from './client';
// Core server infrastructure
export { WebBuddyServer } from './server';
// Core extension framework
export { WebBuddyExtension, ContentScriptIntegration } from './extension';
// Import classes for factory functions
import { WebBuddyClient } from './client';
import { WebBuddyServer } from './server';
import { WebBuddyExtension } from './extension';
// Core event types and utilities (new event-driven architecture)
export { BaseEvent, createSuccessResponse, createErrorResponse, EventPriority } from './events/base';
// Automation learning events
export { AutomationRequestedEvent, AutomationImplementedEvent, AutomationSucceededEvent, AutomationFailedEvent, UserGuidanceRequestedEvent, UserGuidanceProvidedEvent, AutomationEventFactory } from './events/automation';
// Legacy message types (deprecated, for backward compatibility)
export { BaseMessage } from './messages/base';
// Learning and storage system
export { IndexedDBAutomationStorage, createAutomationStorage } from './storage/automation-storage';
export { AutomationManager } from './learning/automation-manager';
// Version information
export const VERSION = '1.0.0';
/**
 * Factory function to create a configured WebBuddyClient
 * Provides a convenient way to create clients with default configuration
 *
 * @param config - Client configuration
 * @returns Configured WebBuddyClient instance with learning capabilities
 */
export function createWebBuddyClient(config) {
    return new WebBuddyClient({
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        ...config
    });
}
/**
 * Factory function to create a learning-enabled automation client
 * Convenient wrapper for automation-focused usage
 */
export function createAutomationClient(config) {
    return createWebBuddyClient({
        ...config,
        learningEnabled: true
    });
}
/**
 * Factory function to create a configured WebBuddyServer
 * Provides a convenient way to create servers with default configuration
 *
 * @param config - Server configuration
 * @returns Configured WebBuddyServer instance
 */
export function createWebBuddyServer(config = {}) {
    return new WebBuddyServer({
        port: 3000,
        host: 'localhost',
        cors: {
            enabled: true,
            origins: ['http://localhost:3000', 'https://*.google.com', 'https://chatgpt.com']
        },
        rateLimit: {
            enabled: true,
            windowMs: 60000, // 1 minute
            maxRequests: 100
        },
        authentication: {
            enabled: false
        },
        ...config
    });
}
/**
 * Factory function to create a configured WebBuddyExtension
 * Provides a convenient way to create extensions with default configuration
 *
 * @param config - Extension configuration
 * @returns Configured WebBuddyExtension instance
 */
export function createWebBuddyExtension(config) {
    return new WebBuddyExtension({
        reconnectInterval: 5000,
        maxReconnectAttempts: 5,
        heartbeatInterval: 30000,
        ...config
    });
}
//# sourceMappingURL=index.js.map