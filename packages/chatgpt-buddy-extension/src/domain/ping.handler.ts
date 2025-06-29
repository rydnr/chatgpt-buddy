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
 * Class name: ExtensionPingHandler
 *
 * Responsibilities:
 *   - Handle ping events in browser extension context
 *   - Generate pong responses with browser information
 *   - Integrate with Chrome extension APIs
 *   - Preserve correlation IDs for request tracking
 *
 * Collaborators:
 *   - PingEvent: Input event to handle
 *   - PongEvent: Output response event
 *   - Chrome APIs: Browser extension context
 */

import { PingEvent, PongEvent } from '@chatgpt-buddy/core';

/**
 * Extension-specific handler for processing ping events within the browser context.
 * This handler provides browser-specific responses and can interact with web pages.
 */
export class ExtensionPingHandler {
  /**
   * Handles a ping event and generates a browser-specific pong response
   * 
   * @param event - The ping event to handle
   * @returns Promise resolving to a pong event response with browser context
   */
  public async handle(event: PingEvent): Promise<PongEvent> {
    // Get browser context information
    const browserInfo = this.getBrowserContext();
    
    // Generate response message with browser context
    const responseMessage = `Extension received: ${event.payload.message} [Browser: ${browserInfo}]`;

    // Create pong event with preserved correlation ID
    return new PongEvent({
      originalMessage: event.payload.message,
      responseMessage,
      correlationId: event.correlationId
    });
  }

  /**
   * Gets browser context information for the response
   * 
   * @returns Browser context string
   */
  private getBrowserContext(): string {
    try {
      // In a real extension, this could include tab info, page URL, etc.
      const extensionId = chrome?.runtime?.id || 'unknown';
      return `Chrome Extension ${extensionId}`;
    } catch (error) {
      // Fallback for testing environment
      return 'Test Environment';
    }
  }
}