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
 * Filename: walking-skeleton.test.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Test name: Walking Skeleton Integration Tests
 *
 * Responsibilities:
 *   - Test complete end-to-end ping-pong communication flow
 *   - Verify server startup and client communication
 *   - Test event-driven architecture without mocks
 *
 * Collaborators:
 *   - Server: HTTP server with Express app
 *   - Client: TypeScript client SDK
 *   - Events: PingEvent and PongEvent
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_app_1 = require("../../packages/chatgpt-buddy-server/src/infrastructure/express-app");
const client_1 = require("../../packages/chatgpt-buddy-client-ts/src/client");
describe('Walking Skeleton End-to-End Tests', () => {
    let server;
    let client;
    const TEST_PORT = 3001; // Use different port to avoid conflicts
    beforeAll(async () => {
        // Start test server
        const app = (0, express_app_1.createApp)();
        server = app.listen(TEST_PORT);
        // Wait for server to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        // Create client
        client = new client_1.ChatGPTBuddyClient({
            serverUrl: `http://localhost:${TEST_PORT}`
        });
    });
    afterAll(async () => {
        // Clean up server
        if (server) {
            server.close();
        }
    });
    /**
     * Test complete ping-pong flow from client to server
     */
    it('should complete ping-pong flow from client to server', async () => {
        // Arrange
        const message = 'Hello from walking skeleton test!';
        // Act
        const response = await client.ping(message);
        // Assert
        expect(response.type).toBe('PongEvent');
        expect(response.payload.originalMessage).toBe(message);
        expect(response.payload.responseMessage).toBe(`Pong: ${message}`);
        expect(response.correlationId).toBeDefined();
        expect(response.timestamp).toBeDefined();
    });
    /**
     * Test multiple concurrent requests
     */
    it('should handle multiple concurrent ping requests', async () => {
        // Arrange
        const messages = ['Ping 1', 'Ping 2', 'Ping 3'];
        // Act
        const responses = await Promise.all(messages.map(message => client.ping(message)));
        // Assert
        expect(responses).toHaveLength(3);
        responses.forEach((response, index) => {
            expect(response.type).toBe('PongEvent');
            expect(response.payload.originalMessage).toBe(messages[index]);
            expect(response.payload.responseMessage).toBe(`Pong: ${messages[index]}`);
            expect(response.correlationId).toBeDefined();
        });
        // Verify unique correlation IDs
        const correlationIds = responses.map(r => r.correlationId);
        const uniqueIds = new Set(correlationIds);
        expect(uniqueIds.size).toBe(3);
    });
    /**
     * Test error handling with invalid requests
     */
    it('should handle invalid requests gracefully', async () => {
        // This test would require direct HTTP calls since client validates inputs
        // We'll create a direct HTTP request with invalid data
        const axios = require('axios');
        try {
            await axios.post(`http://localhost:${TEST_PORT}/api/ping`, {
                // Missing correlationId
                message: 'Test'
            });
            fail('Should have thrown an error');
        }
        catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.error).toContain('correlationId');
        }
    });
});
//# sourceMappingURL=walking-skeleton.test.js.map