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
 * @fileoverview Conversation Message domain entity
 * @author Semantest Team
 * @module domain/entities/conversation-message
 */

import { Entity } from 'typescript-eda-domain';
import { MessageId } from '../value-objects/message-id.value-object';

/**
 * Message role type
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Properties for Conversation Message entity
 */
export interface ConversationMessageProps {
  readonly id: MessageId;
  readonly role: MessageRole;
  readonly content: string;
  readonly timestamp: Date;
  readonly metadata?: Record<string, any>;
  readonly attachments?: MessageAttachment[];
}

/**
 * Message attachment interface
 */
export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size?: number;
  url?: string;
}

/**
 * Conversation Message entity
 * Represents individual messages within a ChatGPT conversation
 */
export class ConversationMessage extends Entity<ConversationMessageProps> {

  /**
   * Create a new conversation message
   */
  static create(
    role: MessageRole,
    content: string,
    options?: {
      id?: string;
      timestamp?: Date;
      metadata?: Record<string, any>;
      attachments?: MessageAttachment[];
    }
  ): ConversationMessage {
    const messageId = MessageId.create(options?.id);
    
    if (!content || content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    const props: ConversationMessageProps = {
      id: messageId,
      role,
      content: content.trim(),
      timestamp: options?.timestamp || new Date(),
      metadata: options?.metadata || {},
      attachments: options?.attachments || []
    };

    return new ConversationMessage(props);
  }

  /**
   * Create user message
   */
  static createUserMessage(
    content: string,
    options?: {
      id?: string;
      timestamp?: Date;
      metadata?: Record<string, any>;
      attachments?: MessageAttachment[];
    }
  ): ConversationMessage {
    return this.create('user', content, options);
  }

  /**
   * Create assistant message
   */
  static createAssistantMessage(
    content: string,
    options?: {
      id?: string;
      timestamp?: Date;
      metadata?: Record<string, any>;
    }
  ): ConversationMessage {
    return this.create('assistant', content, options);
  }

  /**
   * Create system message
   */
  static createSystemMessage(
    content: string,
    options?: {
      id?: string;
      timestamp?: Date;
      metadata?: Record<string, any>;
    }
  ): ConversationMessage {
    return this.create('system', content, options);
  }

  /**
   * Create from JSON data
   */
  static fromJSON(data: any): ConversationMessage {
    const messageId = MessageId.create(data.id);

    const props: ConversationMessageProps = {
      id: messageId,
      role: data.role,
      content: data.content,
      timestamp: new Date(data.timestamp),
      metadata: data.metadata || {},
      attachments: data.attachments || []
    };

    return new ConversationMessage(props);
  }

  /**
   * Get message ID
   */
  getId(): string {
    return this.props.id.getValue();
  }

  /**
   * Get message role
   */
  getRole(): MessageRole {
    return this.props.role;
  }

  /**
   * Get message content
   */
  getContent(): string {
    return this.props.content;
  }

  /**
   * Get message timestamp
   */
  getTimestamp(): Date {
    return this.props.timestamp;
  }

  /**
   * Get message metadata
   */
  getMetadata(): Record<string, any> {
    return { ...this.props.metadata };
  }

  /**
   * Get message attachments
   */
  getAttachments(): MessageAttachment[] {
    return [...(this.props.attachments || [])];
  }

  /**
   * Check if message is from user
   */
  isUserMessage(): boolean {
    return this.props.role === 'user';
  }

  /**
   * Check if message is from assistant
   */
  isAssistantMessage(): boolean {
    return this.props.role === 'assistant';
  }

  /**
   * Check if message is system message
   */
  isSystemMessage(): boolean {
    return this.props.role === 'system';
  }

  /**
   * Check if message has attachments
   */
  hasAttachments(): boolean {
    return (this.props.attachments?.length || 0) > 0;
  }

  /**
   * Get message length in characters
   */
  getContentLength(): number {
    return this.props.content.length;
  }

  /**
   * Get word count
   */
  getWordCount(): number {
    return this.props.content
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  /**
   * Check if message contains code blocks
   */
  hasCodeBlocks(): boolean {
    return this.props.content.includes('```');
  }

  /**
   * Extract code blocks from message
   */
  getCodeBlocks(): Array<{ language?: string; code: string }> {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks: Array<{ language?: string; code: string }> = [];
    let match;

    while ((match = codeBlockRegex.exec(this.props.content)) !== null) {
      codeBlocks.push({
        language: match[1],
        code: match[2].trim()
      });
    }

    return codeBlocks;
  }

  /**
   * Get message preview (truncated content)
   */
  getPreview(maxLength: number = 100): string {
    if (this.props.content.length <= maxLength) {
      return this.props.content;
    }
    
    return this.props.content.substring(0, maxLength - 3) + '...';
  }

  /**
   * Check if message contains specific text
   */
  contains(searchText: string, caseSensitive: boolean = false): boolean {
    const content = caseSensitive ? this.props.content : this.props.content.toLowerCase();
    const search = caseSensitive ? searchText : searchText.toLowerCase();
    return content.includes(search);
  }

  /**
   * Update message metadata
   */
  updateMetadata(metadata: Record<string, any>): void {
    this.updateProps({
      metadata: { ...this.props.metadata, ...metadata }
    });
  }

  /**
   * Add attachment to message
   */
  addAttachment(attachment: MessageAttachment): void {
    const updatedAttachments = [...(this.props.attachments || []), attachment];
    this.updateProps({
      attachments: updatedAttachments
    });
  }

  /**
   * Remove attachment from message
   */
  removeAttachment(attachmentId: string): void {
    const updatedAttachments = (this.props.attachments || []).filter(
      att => att.id !== attachmentId
    );
    this.updateProps({
      attachments: updatedAttachments
    });
  }

  /**
   * Validate message business rules
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate content
    if (!this.props.content || this.props.content.trim().length === 0) {
      errors.push('Message content cannot be empty');
    }

    if (this.props.content && this.props.content.length > 100000) {
      errors.push('Message content is too long (max 100,000 characters)');
    }

    // Validate role
    const validRoles: MessageRole[] = ['user', 'assistant', 'system'];
    if (!validRoles.includes(this.props.role)) {
      errors.push(`Invalid message role: ${this.props.role}`);
    }

    // Validate timestamp
    if (this.props.timestamp > new Date()) {
      errors.push('Message timestamp cannot be in the future');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Record<string, any> {
    return {
      id: this.getId(),
      role: this.getRole(),
      content: this.getContent(),
      timestamp: this.getTimestamp().toISOString(),
      metadata: this.getMetadata(),
      attachments: this.getAttachments(),
      contentLength: this.getContentLength(),
      wordCount: this.getWordCount(),
      hasCodeBlocks: this.hasCodeBlocks(),
      preview: this.getPreview()
    };
  }
}