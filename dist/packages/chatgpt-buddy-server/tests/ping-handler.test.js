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
 * Filename: ping-handler.test.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Test name: PingHandler tests
 *
 * Responsibilities:
 *   - Test ping event handling in the server
 *   - Verify pong event generation
 *   - Test correlation ID preservation
 *
 * Collaborators:
 *   - PingHandler: The handler being tested
 *   - PingEvent: Input event
 *   - PongEvent: Expected output event
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@chatgpt-buddy/core");
const ping_handler_1 = require("../src/domain/ping.handler");
describe('PingHandler', () => {
    let handler;
    beforeEach(() => {
        handler = new ping_handler_1.PingHandler();
    });
    /**
     * Test that PingHandler can handle a ping event and return a pong event
     */
    it('should handle ping event and return pong event', async () => {
        // Arrange
        const correlationId = 'test-correlation-123';
        const message = 'Hello from client';
        const pingEvent = new core_1.PingEvent({ message, correlationId });
        // Act
        const result = await handler.handle(pingEvent);
        // Assert
        expect(result).toBeInstanceOf(core_1.PongEvent);
        expect(result.correlationId).toBe(correlationId);
        expect(result.payload.originalMessage).toBe(message);
        expect(result.payload.responseMessage).toBe('Pong: Hello from client');
    });
    /**
     * Test that PingHandler preserves correlation ID
     */
    it('should preserve correlation ID in response', async () => {
        // Arrange
        const correlationId = 'unique-correlation-456';
        const message = 'Test ping';
        const pingEvent = new core_1.PingEvent({ message, correlationId });
        // Act
        const result = await handler.handle(pingEvent);
        // Assert
        expect(result.correlationId).toBe(correlationId);
    });
});
//# sourceMappingURL=ping-handler.test.js.map