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
 * Filename: event.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Class name: Event
 *
 * Responsibilities:
 *   - Base class for all domain events
 *   - Provide common event properties and behavior
 *   - Support event identification and timestamps
 *
 * Collaborators:
 *   - All concrete event classes inherit from this base
 */

/**
 * Abstract base class for all domain events in the ChatGPT Buddy system.
 * Events represent something that has happened in the domain and are the
 * primary means of communication between different parts of the system.
 */
export abstract class Event {
  /**
   * The type identifier for this event
   */
  public abstract readonly type: string;

  /**
   * Unique identifier for tracking this event through the system
   */
  public abstract get correlationId(): string;

  /**
   * Timestamp when this event was created
   */
  public abstract get timestamp(): Date;

  /**
   * Serializes the event to JSON format for transmission
   */
  public abstract toJSON(): Record<string, unknown>;
}