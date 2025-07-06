"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.AutomationManager = exports.createAutomationStorage = exports.IndexedDBAutomationStorage = exports.BaseMessage = exports.AutomationEventFactory = exports.UserGuidanceProvidedEvent = exports.UserGuidanceRequestedEvent = exports.AutomationFailedEvent = exports.AutomationSucceededEvent = exports.AutomationImplementedEvent = exports.AutomationRequestedEvent = exports.EventPriority = exports.createErrorResponse = exports.createSuccessResponse = exports.BaseEvent = exports.ContentScriptIntegration = exports.WebBuddyExtension = exports.WebBuddyClient = void 0;
exports.createWebBuddyClient = createWebBuddyClient;
exports.createAutomationClient = createAutomationClient;
exports.createWebBuddyExtension = createWebBuddyExtension;
/**
 * Web-Buddy Core - Generic Web Automation Framework
 *
 * This is the core layer that provides generic message-passing infrastructure
 * for web automation. Domain-specific implementations build upon this foundation.
 */
// Core client API
var client_1 = require("./client");
Object.defineProperty(exports, "WebBuddyClient", { enumerable: true, get: function () { return client_1.WebBuddyClient; } });
// Note: Server infrastructure moved to @web-buddy/server package
// Core extension framework
var extension_1 = require("./extension");
Object.defineProperty(exports, "WebBuddyExtension", { enumerable: true, get: function () { return extension_1.WebBuddyExtension; } });
Object.defineProperty(exports, "ContentScriptIntegration", { enumerable: true, get: function () { return extension_1.ContentScriptIntegration; } });
// Import classes for factory functions
const client_2 = require("./client");
const extension_2 = require("./extension");
// Core event types and utilities (new event-driven architecture)
var base_1 = require("./events/base");
Object.defineProperty(exports, "BaseEvent", { enumerable: true, get: function () { return base_1.BaseEvent; } });
Object.defineProperty(exports, "createSuccessResponse", { enumerable: true, get: function () { return base_1.createSuccessResponse; } });
Object.defineProperty(exports, "createErrorResponse", { enumerable: true, get: function () { return base_1.createErrorResponse; } });
Object.defineProperty(exports, "EventPriority", { enumerable: true, get: function () { return base_1.EventPriority; } });
// Automation learning events
var automation_1 = require("./events/automation");
Object.defineProperty(exports, "AutomationRequestedEvent", { enumerable: true, get: function () { return automation_1.AutomationRequestedEvent; } });
Object.defineProperty(exports, "AutomationImplementedEvent", { enumerable: true, get: function () { return automation_1.AutomationImplementedEvent; } });
Object.defineProperty(exports, "AutomationSucceededEvent", { enumerable: true, get: function () { return automation_1.AutomationSucceededEvent; } });
Object.defineProperty(exports, "AutomationFailedEvent", { enumerable: true, get: function () { return automation_1.AutomationFailedEvent; } });
Object.defineProperty(exports, "UserGuidanceRequestedEvent", { enumerable: true, get: function () { return automation_1.UserGuidanceRequestedEvent; } });
Object.defineProperty(exports, "UserGuidanceProvidedEvent", { enumerable: true, get: function () { return automation_1.UserGuidanceProvidedEvent; } });
Object.defineProperty(exports, "AutomationEventFactory", { enumerable: true, get: function () { return automation_1.AutomationEventFactory; } });
// Legacy message types (deprecated, for backward compatibility)
var base_2 = require("./messages/base");
Object.defineProperty(exports, "BaseMessage", { enumerable: true, get: function () { return base_2.BaseMessage; } });
// Learning and storage system
var automation_storage_1 = require("./storage/automation-storage");
Object.defineProperty(exports, "IndexedDBAutomationStorage", { enumerable: true, get: function () { return automation_storage_1.IndexedDBAutomationStorage; } });
Object.defineProperty(exports, "createAutomationStorage", { enumerable: true, get: function () { return automation_storage_1.createAutomationStorage; } });
var automation_manager_1 = require("./learning/automation-manager");
Object.defineProperty(exports, "AutomationManager", { enumerable: true, get: function () { return automation_manager_1.AutomationManager; } });
// Version information
exports.VERSION = '1.0.0';
/**
 * Factory function to create a configured WebBuddyClient
 * Provides a convenient way to create clients with default configuration
 *
 * @param config - Client configuration
 * @returns Configured WebBuddyClient instance with learning capabilities
 */
function createWebBuddyClient(config) {
    return new client_2.WebBuddyClient({
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
function createAutomationClient(config) {
    return createWebBuddyClient({
        ...config,
        learningEnabled: true
    });
}
/**
 * Note: Server creation moved to @web-buddy/server package
 * Use createWebBuddyServer from '@web-buddy/server' instead
 */
/**
 * Factory function to create a configured WebBuddyExtension
 * Provides a convenient way to create extensions with default configuration
 *
 * @param config - Extension configuration
 * @returns Configured WebBuddyExtension instance
 */
function createWebBuddyExtension(config) {
    return new extension_2.WebBuddyExtension({
        reconnectInterval: 5000,
        maxReconnectAttempts: 5,
        heartbeatInterval: 30000,
        ...config
    });
}
//# sourceMappingURL=index.js.map