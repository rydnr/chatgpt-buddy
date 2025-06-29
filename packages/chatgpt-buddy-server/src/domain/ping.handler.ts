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
 * Filename: ping.handler.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Class name: PingHandler
 *
 * Responsibilities:
 *   - Handle incoming ping events
 *   - Generate pong response events
 *   - Preserve correlation IDs for request-response tracking
 *
 * Collaborators:
 *   - PingEvent: Input event to handle
 *   - PongEvent: Output response event
 */

import { PingEvent, PongEvent } from '@chatgpt-buddy/core';

/**
 * Domain handler for processing ping events and generating pong responses.
 * This implements the core business logic for the ping-pong communication
 * pattern in the ChatGPT Buddy system.
 */
export class PingHandler {
  /**
   * Handles a ping event and generates an appropriate pong response
   * 
   * @param event - The ping event to handle
   * @returns Promise resolving to a pong event response
   */
  public async handle(event: PingEvent): Promise<PongEvent> {
    // Generate response message by echoing the original message
    const responseMessage = `Pong: ${event.payload.message}`;

    // Create pong event with preserved correlation ID
    return new PongEvent({
      originalMessage: event.payload.message,
      responseMessage,
      correlationId: event.correlationId
    });
  }
}