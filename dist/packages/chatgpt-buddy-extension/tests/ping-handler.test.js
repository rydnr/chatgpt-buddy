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
 * Test name: Extension PingHandler tests
 *
 * Responsibilities:
 *   - Test extension ping event handling
 *   - Verify browser interaction simulation
 *   - Test pong response generation from extension
 *
 * Collaborators:
 *   - ExtensionPingHandler: The handler being tested
 *   - PingEvent: Input event
 *   - PongEvent: Expected output event
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@chatgpt-buddy/core");
const ping_handler_1 = require("../src/domain/ping.handler");
describe('ExtensionPingHandler', () => {
    let handler;
    beforeEach(() => {
        handler = new ping_handler_1.ExtensionPingHandler();
    });
    /**
     * Test that extension ping handler can process ping events
     */
    it('should handle ping event and return pong with browser info', async () => {
        // Arrange
        const correlationId = 'ext-test-correlation-123';
        const message = 'Hello from extension test';
        const pingEvent = new core_1.PingEvent({ message, correlationId });
        // Act
        const result = await handler.handle(pingEvent);
        // Assert
        expect(result).toBeInstanceOf(core_1.PongEvent);
        expect(result.correlationId).toBe(correlationId);
        expect(result.payload.originalMessage).toBe(message);
        expect(result.payload.responseMessage).toContain('Extension received');
        expect(result.payload.responseMessage).toContain(message);
    });
    /**
     * Test that extension handler includes browser context
     */
    it('should include browser context in response', async () => {
        // Arrange
        const correlationId = 'ext-browser-test-456';
        const message = 'Browser context test';
        const pingEvent = new core_1.PingEvent({ message, correlationId });
        // Act
        const result = await handler.handle(pingEvent);
        // Assert
        expect(result.payload.responseMessage).toContain('Extension received');
        expect(result.correlationId).toBe(correlationId);
    });
    /**
     * Test that extension handler preserves correlation ID
     */
    it('should preserve correlation ID in browser response', async () => {
        // Arrange
        const correlationId = 'unique-extension-correlation-789';
        const message = 'Extension correlation test';
        const pingEvent = new core_1.PingEvent({ message, correlationId });
        // Act
        const result = await handler.handle(pingEvent);
        // Assert
        expect(result.correlationId).toBe(correlationId);
    });
});
//# sourceMappingURL=ping-handler.test.js.map