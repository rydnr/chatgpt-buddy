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
 * Filename: client.test.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Test name: ChatGPT Buddy Client tests
 *
 * Responsibilities:
 *   - Test client SDK functionality
 *   - Verify ping-pong communication
 *   - Test error handling and validation
 *
 * Collaborators:
 *   - ChatGPTBuddyClient: The client being tested
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const client_1 = require("../src/client");
// Mock axios
jest.mock('axios');
const mockedAxios = axios_1.default;
describe('ChatGPTBuddyClient', () => {
    let client;
    let mockPost;
    const mockServerUrl = 'http://localhost:3000';
    beforeEach(() => {
        mockPost = jest.fn();
        mockedAxios.create.mockReturnValue({
            post: mockPost
        });
        client = new client_1.ChatGPTBuddyClient({
            serverUrl: mockServerUrl
        });
        jest.clearAllMocks();
    });
    /**
     * Test that client can send ping and receive pong
     */
    it('should send ping and receive pong response', async () => {
        // Arrange
        const message = 'Hello from client test';
        const mockResponse = {
            data: {
                type: 'PongEvent',
                correlationId: 'mock-correlation-123',
                payload: {
                    originalMessage: message,
                    responseMessage: `Pong: ${message}`
                },
                timestamp: new Date().toISOString()
            }
        };
        mockPost.mockResolvedValue(mockResponse);
        // Act
        const response = await client.ping(message);
        // Assert
        expect(response.type).toBe('PongEvent');
        expect(response.payload.originalMessage).toBe(message);
        expect(response.payload.responseMessage).toBe(`Pong: ${message}`);
        expect(response.correlationId).toBeDefined();
    });
    /**
     * Test that client generates unique correlation IDs
     */
    it('should generate unique correlation IDs for each request', async () => {
        // Arrange
        const message = 'Test message';
        mockPost
            .mockResolvedValueOnce({
            data: { type: 'PongEvent', correlationId: 'id-1', payload: { originalMessage: message, responseMessage: `Pong: ${message}` }, timestamp: new Date().toISOString() }
        })
            .mockResolvedValueOnce({
            data: { type: 'PongEvent', correlationId: 'id-2', payload: { originalMessage: message, responseMessage: `Pong: ${message}` }, timestamp: new Date().toISOString() }
        });
        // Act
        const response1 = await client.ping(message);
        const response2 = await client.ping(message);
        // Assert
        expect(response1.correlationId).toBeDefined();
        expect(response2.correlationId).toBeDefined();
        expect(response1.correlationId).not.toBe(response2.correlationId);
    });
    /**
     * Test that client handles empty messages
     */
    it('should handle empty message in ping request', async () => {
        // Arrange
        const message = '';
        const mockResponse = {
            data: {
                type: 'PongEvent',
                correlationId: 'empty-test-123',
                payload: {
                    originalMessage: '',
                    responseMessage: 'Pong: '
                },
                timestamp: new Date().toISOString()
            }
        };
        mockPost.mockResolvedValue(mockResponse);
        // Act
        const response = await client.ping(message);
        // Assert
        expect(response.payload.originalMessage).toBe('');
        expect(response.payload.responseMessage).toBe('Pong: ');
    });
});
//# sourceMappingURL=client.test.js.map