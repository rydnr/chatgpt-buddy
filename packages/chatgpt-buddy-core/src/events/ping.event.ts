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
 * Filename: ping.event.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Class name: PingEvent
 *
 * Responsibilities:
 *   - Represent a simple ping event for testing connectivity
 *   - Carry a message payload and correlation ID
 *   - Support JSON serialization for network transmission
 *
 * Collaborators:
 *   - Event: Base event class from typescript-eda
 */

import { Event } from '../base/event';

/**
 * Payload interface for ping events
 */
export interface PingPayload {
  readonly message: string;
}

/**
 * A simple ping event used for testing connectivity and communication flow
 * between different modules in the ChatGPT Buddy system.
 */
export class PingEvent extends Event {
  public readonly type = 'PingEvent';

  /**
   * Creates a new PingEvent instance
   * 
   * @param payload - The ping payload containing the message
   * @param correlationId - Unique identifier for tracking this event
   */
  constructor(
    public readonly payload: PingPayload & { correlationId: string },
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
    payload: PingPayload;
    timestamp: Date;
  } {
    return {
      type: this.type,
      correlationId: this.correlationId,
      payload: {
        message: this.payload.message
      },
      timestamp: this.timestamp
    };
  }
}