/*
                       @semantest/chatgpt.com

  Copyright (C) 2025-today  Semantest Team

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

/**
 * @fileoverview Message ID value object
 * @author Semantest Team
 * @module domain/value-objects/message-id
 */

import { ValueObject } from 'typescript-eda-domain';
import { v4 as uuidv4 } from 'uuid';

/**
 * Properties for MessageId value object
 */
export interface MessageIdProps {
  readonly value: string;
}

/**
 * MessageId value object
 * Ensures message IDs are valid and consistent
 */
export class MessageId extends ValueObject<MessageIdProps> {

  /**
   * Create a new message ID
   */
  static create(id?: string): MessageId {
    const value = id || uuidv4();
    
    if (!this.isValid(value)) {
      throw new Error(`Invalid message ID format: ${value}`);
    }

    return new MessageId({ value });
  }

  /**
   * Create from existing message ID string
   */
  static fromString(id: string): MessageId {
    return this.create(id);
  }

  /**
   * Generate a new random message ID
   */
  static generate(): MessageId {
    return this.create();
  }

  /**
   * Validate message ID format
   */
  private static isValid(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    // Allow UUID format or alphanumeric IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const alphanumericIdRegex = /^[a-zA-Z0-9_-]+$/;
    
    return uuidRegex.test(id) || (alphanumericIdRegex.test(id) && id.length >= 4 && id.length <= 100);
  }

  /**
   * Get the message ID value
   */
  getValue(): string {
    return this.props.value;
  }

  /**
   * Check if this is a UUID
   */
  isUUID(): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(this.props.value);
  }

  /**
   * Get shortened display version
   */
  getShortId(): string {
    return this.props.value.length > 12 
      ? `${this.props.value.substring(0, 8)}...`
      : this.props.value;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this.props.value;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): string {
    return this.props.value;
  }
}