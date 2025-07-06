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
exports.WebBuddyClient = void 0;
const uuid_1 = require("uuid");
const automation_1 = require("./events/automation");
/**
 * Generic Web-Buddy client that provides low-level event-driven API
 * This is the core layer that domain-specific clients build upon
 * Now supports the learning automation system with event-based communication
 */
class WebBuddyClient {
    config;
    timeout;
    retryAttempts;
    retryDelay;
    constructor(config) {
        this.config = config;
        this.timeout = config.timeout || 30000; // 30 seconds default
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 1000; // 1 second default
    }
    /**
     * Core API: Generic event dispatching
     * This is the foundation that all domain-specific wrappers use
     *
     * @param event - Event object or legacy message for backward compatibility
     * @param options - Optional configuration for this specific event
     * @returns Promise resolving to the event response
     */
    async sendEvent(event, options) {
        // Handle both new event objects and legacy message format
        const eventData = this.normalizeEventData(event, options);
        return this.dispatchEvent(eventData, options);
    }
    /**
     * Legacy API: Generic message sending (deprecated, use sendEvent instead)
     * Maintained for backward compatibility
     */
    async sendMessage(message, options) {
        const correlationId = options?.correlationId || this.generateCorrelationId();
        const timeout = options?.timeout || this.timeout;
        const requestPayload = {
            ...message,
            correlationId,
            timestamp: new Date().toISOString(),
            ...(options?.tabId && { tabId: options.tabId })
        };
        return this.executeWithRetry(async () => {
            const response = await this.makeHttpRequest('/api/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
                },
                body: JSON.stringify(requestPayload)
            }, timeout);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Unknown server error');
            }
            return result.data;
        });
    }
    /**
     * New API: Request automation for a specific action
     * This triggers the learning loop if no implementation exists
     */
    async requestAutomation(action, parameters, options) {
        const event = new automation_1.AutomationRequestedEvent({
            action,
            parameters,
            context: options?.context,
            expectedOutcome: options?.expectedOutcome
        }, undefined, options?.website, options?.tabId);
        return this.sendEvent(event, { timeout: options?.timeout });
    }
    /**
     * Convenience method: Request search automation
     */
    async requestSearch(query, website, options) {
        const event = automation_1.AutomationEventFactory.createSearchRequest(query, website, options?.context);
        return this.sendEvent(event, {
            tabId: options?.tabId,
            timeout: options?.timeout
        });
    }
    /**
     * Convenience method: Request login automation
     */
    async requestLogin(credentials, website, options) {
        const event = automation_1.AutomationEventFactory.createLoginRequest(credentials, website, options?.context);
        return this.sendEvent(event, {
            tabId: options?.tabId,
            timeout: options?.timeout
        });
    }
    /**
     * Internal method to normalize event data
     */
    normalizeEventData(event, options) {
        // If it's already a proper event, return as-is
        if ('eventId' in event && 'timestamp' in event) {
            return event;
        }
        // Convert legacy message format to event format
        const messageData = event;
        const eventType = Object.keys(messageData)[0] || 'unknownEvent';
        return {
            type: eventType,
            payload: messageData[eventType] || messageData,
            correlationId: options?.correlationId || this.generateCorrelationId(),
            timestamp: new Date(),
            eventId: `legacy-${Date.now()}-${(0, uuid_1.v4)().substr(0, 8)}`,
            tabId: options?.tabId
        };
    }
    /**
     * Internal method to dispatch events
     */
    async dispatchEvent(event, options) {
        const timeout = options?.timeout || this.timeout;
        return this.executeWithRetry(async () => {
            const response = await this.makeHttpRequest('/api/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
                },
                body: JSON.stringify(event)
            }, timeout);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Unknown server error');
            }
            return result.data;
        });
    }
    /**
     * Batch message sending for efficiency
     * Useful for complex operations that require multiple steps
     *
     * @param messages - Array of messages to send
     * @returns Promise resolving to array of responses
     */
    async sendMessages(messages, options) {
        const parallel = options?.parallel ?? true;
        if (parallel) {
            // Execute all messages in parallel for better performance
            const promises = messages.map(message => this.sendMessage(message, {
                tabId: options?.tabId,
                timeout: options?.timeout
            }));
            return Promise.all(promises);
        }
        else {
            // Execute messages sequentially
            const results = [];
            for (const message of messages) {
                const result = await this.sendMessage(message, {
                    tabId: options?.tabId,
                    timeout: options?.timeout
                });
                results.push(result);
            }
            return results;
        }
    }
    /**
     * Health check to verify server connectivity
     */
    async ping() {
        const startTime = Date.now();
        try {
            await this.sendMessage({ PING: { timestamp: startTime } });
            return {
                success: true,
                latency: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                success: false,
                latency: Date.now() - startTime
            };
        }
    }
    /**
     * Generates a unique correlation ID for message tracking
     */
    generateCorrelationId() {
        return `web-buddy-${Date.now()}-${(0, uuid_1.v4)().substr(0, 8)}`;
    }
    /**
     * Get current connection status and transport information
     */
    async getTransportInfo() {
        return {
            type: 'http',
            status: 'connected',
            averageLatency: 0
        };
    }
    /**
     * Makes HTTP request with timeout support
     */
    async makeHttpRequest(path, init, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(`${this.config.serverUrl}${path}`, {
                ...init,
                signal: controller.signal
            });
            return response;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * Executes operation with retry logic
     */
    async executeWithRetry(operation) {
        let lastError = new Error('Unknown error');
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === this.retryAttempts) {
                    break; // Last attempt, don't wait
                }
                // Wait before retrying (exponential backoff)
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error(`Operation failed after ${this.retryAttempts} attempts: ${lastError.message}`);
    }
}
exports.WebBuddyClient = WebBuddyClient;
//# sourceMappingURL=client.js.map