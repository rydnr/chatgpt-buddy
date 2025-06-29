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

import { WebBuddyClient } from './client';

// Mock fetch for testing
global.fetch = jest.fn();

describe('WebBuddyClient', () => {
  let client: WebBuddyClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  
  beforeEach(() => {
    client = new WebBuddyClient({
      serverUrl: 'http://localhost:3000',
      timeout: 5000,
      retryAttempts: 1 // Reduce for faster tests
    });
    mockFetch.mockClear();
  });
  
  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { result: 'test-data' }
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);
      
      const message = { TEST_MESSAGE: { data: 'test' } };
      
      // Act
      const result = await client.sendMessage(message);
      
      // Assert
      expect(result).toEqual({ result: 'test-data' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/message',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('TEST_MESSAGE')
        })
      );
    });
    
    it('should handle server errors', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Server error'
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);
      
      const message = { TEST_MESSAGE: { data: 'test' } };
      
      // Act & Assert
      await expect(client.sendMessage(message)).rejects.toThrow('Server error');
    });
    
    it('should handle HTTP errors', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
      mockFetch.mockResolvedValue(mockResponse as any);
      
      const message = { TEST_MESSAGE: { data: 'test' } };
      
      // Act & Assert
      await expect(client.sendMessage(message)).rejects.toThrow('HTTP 500: Internal Server Error');
    });
    
    it('should include correlation ID in request', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {}
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);
      
      const message = { TEST_MESSAGE: { data: 'test' } };
      const correlationId = 'test-correlation-123';
      
      // Act
      await client.sendMessage(message, { correlationId });
      
      // Assert
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(requestBody.correlationId).toBe(correlationId);
    });
  });
  
  describe('sendMessages', () => {
    it('should send multiple messages in parallel', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { result: 'test' }
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);
      
      const messages = [
        { MESSAGE_1: { data: 'test1' } },
        { MESSAGE_2: { data: 'test2' } }
      ];
      
      // Act
      const results = await client.sendMessages(messages);
      
      // Assert
      expect(results).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('ping', () => {
    it('should return success and latency on successful ping', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {}
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);
      
      // Act
      const result = await client.ping();
      
      // Assert
      expect(result.success).toBe(true);
      expect(typeof result.latency).toBe('number');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });
    
    it('should return failure on ping error', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      // Act
      const result = await client.ping();
      
      // Assert
      expect(result.success).toBe(false);
      expect(typeof result.latency).toBe('number');
    });
  });
});