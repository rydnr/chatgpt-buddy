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
 * Filename: index.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Main export: Core module exports
 *
 * Responsibilities:
 *   - Export all public API for the core package
 *   - Provide centralized access to events and base classes
 *
 * Collaborators:
 *   - Event: Base event class
 *   - PingEvent: Ping connectivity test event
 *   - PongEvent: Pong response event
 */

// Base classes
export { Event } from './base/event';

// Events
export { PingEvent, type PingPayload } from './events/ping.event';
export { PongEvent, type PongPayload } from './events/pong.event';