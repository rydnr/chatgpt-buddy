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
import { v4 as uuidv4 } from 'uuid';
/**
 * Abstract base class for all Web-Buddy messages
 * Implements common functionality and ensures consistent structure
 */
export class BaseMessage {
    payload;
    website;
    tabId;
    timestamp = new Date();
    correlationId;
    constructor(payload, correlationId, website, tabId) {
        this.payload = payload;
        this.website = website;
        this.tabId = tabId;
        this.correlationId = correlationId || this.generateCorrelationId();
    }
    /**
     * Generates a unique correlation ID for message tracking
     */
    generateCorrelationId() {
        return `web-buddy-${Date.now()}-${uuidv4().substr(0, 8)}`;
    }
    /**
     * Serializes the message to JSON format for network transmission
     */
    toJSON() {
        return {
            type: this.type,
            payload: this.payload,
            correlationId: this.correlationId,
            timestamp: this.timestamp,
            website: this.website,
            tabId: this.tabId
        };
    }
    /**
     * Creates a message from JSON data
     */
    static fromJSON(data) {
        // This would be implemented by specific message classes
        throw new Error('fromJSON must be implemented by concrete message classes');
    }
}
/**
 * Creates a standardized success response
 */
export function createSuccessResponse(data, correlationId) {
    return {
        success: true,
        data,
        correlationId,
        timestamp: new Date()
    };
}
/**
 * Creates a standardized error response
 */
export function createErrorResponse(error, correlationId) {
    return {
        success: false,
        error,
        correlationId,
        timestamp: new Date()
    };
}
//# sourceMappingURL=base.js.map