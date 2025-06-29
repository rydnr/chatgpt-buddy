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
 * Filename: pong.event.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Class name: PongEvent
 *
 * Responsibilities:
 *   - Represent a response to a ping event
 *   - Carry both original and response messages
 *   - Maintain correlation ID for request-response tracking
 *   - Support JSON serialization for network transmission
 *
 * Collaborators:
 *   - Event: Base event class
 *   - PingEvent: The event this responds to
 */

import { Event } from '../base/event';

/**
 * Payload interface for pong events
 */
export interface PongPayload {
  readonly originalMessage: string;
  readonly responseMessage: string;
}

/**
 * A pong event that responds to a ping event, maintaining the correlation ID
 * and providing both the original message and a response message.
 */
export class PongEvent extends Event {
  public readonly type = 'PongEvent';

  /**
   * Creates a new PongEvent instance
   * 
   * @param payload - The pong payload containing original and response messages
   */
  constructor(
    public readonly payload: PongPayload & { correlationId: string },
  ) {
    super();
  }

  /**
   * Gets the correlation ID for this event
   */
  public get correlationId(): string {
    return this.payload.correlationId;
  }

  /**
   * Gets the timestamp when this event was created
   */
  public get timestamp(): Date {
    return new Date();
  }

  /**
   * Serializes the event to JSON format for network transmission
   * 
   * @returns JSON representation of the event
   */
  public toJSON(): {
    type: string;
    correlationId: string;
    payload: PongPayload;
    timestamp: Date;
  } {
    return {
      type: this.type,
      correlationId: this.correlationId,
      payload: {
        originalMessage: this.payload.originalMessage,
        responseMessage: this.payload.responseMessage
      },
      timestamp: this.timestamp
    };
  }
}