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
 * Filename: pong-event.test.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Test name: PongEvent tests
 *
 * Responsibilities:
 *   - Test PongEvent creation and properties
 *   - Verify event serialization and deserialization
 *   - Test response to PingEvent correlation
 *
 * Collaborators:
 *   - PongEvent: The event being tested
 */

import { PongEvent } from '../src/events/pong.event';

describe('PongEvent', () => {
  /**
   * Test that a PongEvent can be created with a correlation ID
   */
  it('should create a pong event with correlation ID', () => {
    // Arrange
    const correlationId = 'test-correlation-123';
    const originalMessage = 'Hello from client';
    const responseMessage = 'Hello back from server';

    // Act
    const event = new PongEvent({ 
      originalMessage, 
      responseMessage, 
      correlationId 
    });

    // Assert
    expect(event.correlationId).toBe(correlationId);
    expect(event.payload.originalMessage).toBe(originalMessage);
    expect(event.payload.responseMessage).toBe(responseMessage);
    expect(event.type).toBe('PongEvent');
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  /**
   * Test that PongEvent can be serialized to JSON
   */
  it('should serialize to JSON correctly', () => {
    // Arrange
    const correlationId = 'test-correlation-456';
    const originalMessage = 'Ping message';
    const responseMessage = 'Pong response';
    const event = new PongEvent({ 
      originalMessage, 
      responseMessage, 
      correlationId 
    });

    // Act
    const serialized = event.toJSON();

    // Assert
    expect(serialized.type).toBe('PongEvent');
    expect(serialized.correlationId).toBe(correlationId);
    expect(serialized.payload.originalMessage).toBe(originalMessage);
    expect(serialized.payload.responseMessage).toBe(responseMessage);
    expect(serialized.timestamp).toBeDefined();
  });
});