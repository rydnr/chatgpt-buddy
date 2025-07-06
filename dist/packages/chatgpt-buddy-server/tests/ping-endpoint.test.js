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
 * Filename: ping-endpoint.test.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Test name: Ping endpoint integration tests
 *
 * Responsibilities:
 *   - Test HTTP ping endpoint functionality
 *   - Verify request-response flow
 *   - Test JSON serialization and HTTP status codes
 *
 * Collaborators:
 *   - Express app: HTTP server
 *   - PingHandler: Domain logic
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_app_1 = require("../src/infrastructure/express-app");
describe('POST /api/ping', () => {
    const app = (0, express_app_1.createApp)();
    /**
     * Test that ping endpoint accepts ping requests and returns pong responses
     */
    it('should accept ping request and return pong response', async () => {
        // Arrange
        const pingPayload = {
            message: 'Hello from test',
            correlationId: 'test-correlation-123'
        };
        // Act
        const response = await (0, supertest_1.default)(app)
            .post('/api/ping')
            .send(pingPayload)
            .expect(200);
        // Assert
        expect(response.body.type).toBe('PongEvent');
        expect(response.body.correlationId).toBe('test-correlation-123');
        expect(response.body.payload.originalMessage).toBe('Hello from test');
        expect(response.body.payload.responseMessage).toBe('Pong: Hello from test');
        expect(response.body.timestamp).toBeDefined();
    });
    /**
     * Test that ping endpoint validates required fields
     */
    it('should return 400 for invalid ping request', async () => {
        // Arrange
        const invalidPayload = {
            message: 'Hello from test'
            // Missing correlationId
        };
        // Act & Assert
        await (0, supertest_1.default)(app)
            .post('/api/ping')
            .send(invalidPayload)
            .expect(400);
    });
    /**
     * Test that ping endpoint handles empty message
     */
    it('should handle empty message in ping request', async () => {
        // Arrange
        const pingPayload = {
            message: '',
            correlationId: 'test-correlation-456'
        };
        // Act
        const response = await (0, supertest_1.default)(app)
            .post('/api/ping')
            .send(pingPayload)
            .expect(200);
        // Assert
        expect(response.body.payload.responseMessage).toBe('Pong: ');
    });
});
//# sourceMappingURL=ping-endpoint.test.js.map