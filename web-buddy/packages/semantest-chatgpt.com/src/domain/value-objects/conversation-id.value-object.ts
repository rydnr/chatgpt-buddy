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
 * @fileoverview Conversation ID value object
 * @author Semantest Team
 * @module domain/value-objects/conversation-id
 */

import { ValueObject } from 'typescript-eda-domain';
import { v4 as uuidv4 } from 'uuid';

/**
 * Properties for ConversationId value object
 */
export interface ConversationIdProps {
  readonly value: string;
}

/**
 * ConversationId value object
 * Ensures conversation IDs are valid and consistent
 */
export class ConversationId extends ValueObject<ConversationIdProps> {

  /**
   * Create a new conversation ID
   */
  static create(id?: string): ConversationId {
    const value = id || uuidv4();
    
    if (!this.isValid(value)) {
      throw new Error(`Invalid conversation ID format: ${value}`);
    }

    return new ConversationId({ value });
  }

  /**
   * Create from existing conversation ID string
   */
  static fromString(id: string): ConversationId {
    return this.create(id);
  }

  /**
   * Generate a new random conversation ID
   */
  static generate(): ConversationId {
    return this.create();
  }

  /**
   * Validate conversation ID format
   */
  private static isValid(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    // Allow UUID format or ChatGPT-style IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const chatgptIdRegex = /^[a-zA-Z0-9_-]+$/;
    
    return uuidRegex.test(id) || (chatgptIdRegex.test(id) && id.length >= 8 && id.length <= 100);
  }

  /**
   * Get the conversation ID value
   */
  getValue(): string {
    return this.props.value;
  }

  /**
   * Check if this is a ChatGPT-generated ID
   */
  isChatGPTId(): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return !uuidRegex.test(this.props.value);
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