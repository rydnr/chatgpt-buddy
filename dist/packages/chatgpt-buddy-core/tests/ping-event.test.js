"use strict";
/*
                        ChatGPT-Buddy

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
/******************************************************************************
 *
 * Filename: ping-event.test.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Test name: PingEvent tests
 *
 * Responsibilities:
 *   - Test PingEvent creation and properties
 *   - Verify event serialization and deserialization
 *
 * Collaborators:
 *   - PingEvent: The event being tested
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ping_event_1 = require("../src/events/ping.event");
describe('PingEvent', () => {
    /**
     * Test that a PingEvent can be created with a correlation ID
     */
    it('should create a ping event with correlation ID', () => {
        // Arrange
        const correlationId = 'test-correlation-123';
        const message = 'Hello from client';
        // Act
        const event = new ping_event_1.PingEvent({ message, correlationId });
        // Assert
        expect(event.correlationId).toBe(correlationId);
        expect(event.payload.message).toBe(message);
        expect(event.type).toBe('PingEvent');
        expect(event.timestamp).toBeInstanceOf(Date);
    });
    /**
     * Test that PingEvent can be serialized to JSON
     */
    it('should serialize to JSON correctly', () => {
        // Arrange
        const correlationId = 'test-correlation-456';
        const message = 'Ping message';
        const event = new ping_event_1.PingEvent({ message, correlationId });
        // Act
        const serialized = event.toJSON();
        // Assert
        expect(serialized.type).toBe('PingEvent');
        expect(serialized.correlationId).toBe(correlationId);
        expect(serialized.payload.message).toBe(message);
        expect(serialized.timestamp).toBeDefined();
    });
});
//# sourceMappingURL=ping-event.test.js.map