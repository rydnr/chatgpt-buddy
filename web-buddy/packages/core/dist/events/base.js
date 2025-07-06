"use strict";
/*
                        Web-Buddy Core - Event System

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
exports.EventPriority = exports.BaseEvent = void 0;
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
const uuid_1 = require("uuid");
/**
 * Abstract base class for all Web-Buddy events
 * Implements common functionality and ensures consistent structure
 */
class BaseEvent {
    payload;
    website;
    tabId;
    timestamp = new Date();
    correlationId;
    eventId;
    constructor(payload, correlationId, website, tabId) {
        this.payload = payload;
        this.website = website;
        this.tabId = tabId;
        this.correlationId = correlationId || this.generateCorrelationId();
        this.eventId = this.generateEventId();
    }
    /**
     * Generates a unique correlation ID for event tracking across system boundaries
     */
    generateCorrelationId() {
        return `web-buddy-${Date.now()}-${(0, uuid_1.v4)().substr(0, 8)}`;
    }
    /**
     * Generates a unique event ID for this specific event instance
     */
    generateEventId() {
        return `event-${Date.now()}-${(0, uuid_1.v4)().substr(0, 12)}`;
    }
    /**
     * Serializes the event to JSON format for network transmission
     */
    toJSON() {
        return {
            type: this.type,
            payload: this.payload,
            correlationId: this.correlationId,
            timestamp: this.timestamp,
            website: this.website,
            tabId: this.tabId,
            eventId: this.eventId
        };
    }
    /**
     * Creates an event from JSON data
     */
    static fromJSON(data) {
        // This would be implemented by specific event classes
        throw new Error('fromJSON must be implemented by concrete event classes');
    }
}
exports.BaseEvent = BaseEvent;
/**
 * Creates a standardized success response
 */
function createSuccessResponse(data, correlationId, eventId, resultingEvents) {
    return {
        success: true,
        data,
        correlationId,
        eventId,
        timestamp: new Date(),
        resultingEvents
    };
}
/**
 * Creates a standardized error response
 */
function createErrorResponse(error, correlationId, eventId) {
    return {
        success: false,
        error,
        correlationId,
        eventId,
        timestamp: new Date()
    };
}
/**
 * Event priority levels for processing order
 */
var EventPriority;
(function (EventPriority) {
    EventPriority[EventPriority["LOW"] = 0] = "LOW";
    EventPriority[EventPriority["NORMAL"] = 1] = "NORMAL";
    EventPriority[EventPriority["HIGH"] = 2] = "HIGH";
    EventPriority[EventPriority["CRITICAL"] = 3] = "CRITICAL";
})(EventPriority || (exports.EventPriority = EventPriority = {}));
//# sourceMappingURL=base.js.map