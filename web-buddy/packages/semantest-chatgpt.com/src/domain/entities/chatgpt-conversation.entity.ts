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
 * @fileoverview ChatGPT Conversation domain entity
 * @author Semantest Team
 * @module domain/entities/chatgpt-conversation
 */

import { Entity } from 'typescript-eda-domain';
import { ConversationMessage } from './conversation-message.entity';
import { ConversationId } from '../value-objects/conversation-id.value-object';

/**
 * Properties for ChatGPT Conversation entity
 */
export interface ChatGPTConversationProps {
  readonly id: ConversationId;
  readonly title: string;
  readonly projectId?: string;
  readonly model?: string;
  readonly messages: ConversationMessage[];
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly metadata?: Record<string, any>;
}

/**
 * Validation result interface
 */
export interface ConversationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * ChatGPT Conversation aggregate root
 * Manages conversation state, messages, and business rules
 */
export class ChatGPTConversation extends Entity<ChatGPTConversationProps> {

  /**
   * Create a new ChatGPT conversation
   */
  static create(
    id: string,
    title: string,
    options?: {
      projectId?: string;
      model?: string;
      metadata?: Record<string, any>;
    }
  ): ChatGPTConversation {
    const conversationId = ConversationId.create(id);
    const now = new Date();

    const props: ChatGPTConversationProps = {
      id: conversationId,
      title: title.trim(),
      projectId: options?.projectId,
      model: options?.model || 'gpt-4',
      messages: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
      metadata: options?.metadata || {}
    };

    return new ChatGPTConversation(props);
  }

  /**
   * Create from JSON data
   */
  static fromJSON(data: any): ChatGPTConversation {
    const conversationId = ConversationId.create(data.id);
    
    const messages = (data.messages || []).map((msgData: any) => 
      ConversationMessage.fromJSON(msgData)
    );

    const props: ChatGPTConversationProps = {
      id: conversationId,
      title: data.title,
      projectId: data.projectId,
      model: data.model || 'gpt-4',
      messages,
      isActive: data.isActive ?? true,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      metadata: data.metadata || {}
    };

    return new ChatGPTConversation(props);
  }

  /**
   * Get conversation ID
   */
  getId(): string {
    return this.props.id.getValue();
  }

  /**
   * Get conversation title
   */
  getTitle(): string {
    return this.props.title;
  }

  /**
   * Get project ID
   */
  getProjectId(): string | undefined {
    return this.props.projectId;
  }

  /**
   * Get model name
   */
  getModel(): string {
    return this.props.model || 'gpt-4';
  }

  /**
   * Get all messages
   */
  getMessages(): ConversationMessage[] {
    return [...this.props.messages];
  }

  /**
   * Get latest message
   */
  getLatestMessage(): ConversationMessage | undefined {
    const messages = this.getMessages();
    return messages.length > 0 ? messages[messages.length - 1] : undefined;
  }

  /**
   * Get latest assistant response
   */
  getLatestResponse(): ConversationMessage | undefined {
    const messages = this.getMessages();
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].getRole() === 'assistant') {
        return messages[i];
      }
    }
    return undefined;
  }

  /**
   * Add a new message to the conversation
   */
  addMessage(message: ConversationMessage): void {
    const updatedMessages = [...this.props.messages, message];
    
    this.updateProps({
      messages: updatedMessages,
      updatedAt: new Date()
    });
  }

  /**
   * Update conversation title
   */
  updateTitle(newTitle: string): void {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      throw new Error('Conversation title cannot be empty');
    }

    this.updateProps({
      title: trimmedTitle,
      updatedAt: new Date()
    });
  }

  /**
   * Change conversation model
   */
  changeModel(newModel: string): void {
    this.updateProps({
      model: newModel,
      updatedAt: new Date()
    });
  }

  /**
   * Mark conversation as active/inactive
   */
  setActive(active: boolean): void {
    this.updateProps({
      isActive: active,
      updatedAt: new Date()
    });
  }

  /**
   * Update metadata
   */
  updateMetadata(metadata: Record<string, any>): void {
    this.updateProps({
      metadata: { ...this.props.metadata, ...metadata },
      updatedAt: new Date()
    });
  }

  /**
   * Check if conversation is active
   */
  isActiveConversation(): boolean {
    return this.props.isActive;
  }

  /**
   * Get message count
   */
  getMessageCount(): number {
    return this.props.messages.length;
  }

  /**
   * Get conversation length in characters
   */
  getConversationLength(): number {
    return this.props.messages.reduce((total, message) => {
      return total + message.getContent().length;
    }, 0);
  }

  /**
   * Export conversation to different formats
   */
  exportAs(format: 'json' | 'markdown' | 'text'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.toJSON(), null, 2);
      
      case 'markdown':
        return this.toMarkdown();
      
      case 'text':
        return this.toText();
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert to markdown format
   */
  private toMarkdown(): string {
    const lines = [
      `# ${this.getTitle()}`,
      '',
      `**Model:** ${this.getModel()}`,
      `**Created:** ${this.props.createdAt.toISOString()}`,
      `**Updated:** ${this.props.updatedAt.toISOString()}`,
      ''
    ];

    this.props.messages.forEach((message, index) => {
      const role = message.getRole();
      const content = message.getContent();
      const timestamp = message.getTimestamp();

      lines.push(`## ${role === 'user' ? 'User' : 'Assistant'} (${timestamp?.toLocaleString()})`);
      lines.push('');
      lines.push(content);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Convert to plain text format
   */
  private toText(): string {
    const lines = [
      `Conversation: ${this.getTitle()}`,
      `Model: ${this.getModel()}`,
      `Created: ${this.props.createdAt.toISOString()}`,
      `Updated: ${this.props.updatedAt.toISOString()}`,
      '',
      '--- Messages ---',
      ''
    ];

    this.props.messages.forEach((message, index) => {
      const role = message.getRole();
      const content = message.getContent();
      const timestamp = message.getTimestamp();

      lines.push(`[${timestamp?.toLocaleString()}] ${role.toUpperCase()}:`);
      lines.push(content);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Validate conversation business rules
   */
  validate(): ConversationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate title
    if (!this.props.title || this.props.title.trim().length === 0) {
      errors.push('Conversation title is required');
    }

    if (this.props.title && this.props.title.length > 100) {
      warnings.push('Conversation title is very long (>100 characters)');
    }

    // Validate messages
    if (this.props.messages.length === 0) {
      warnings.push('Conversation has no messages');
    }

    // Validate conversation length
    const totalLength = this.getConversationLength();
    if (totalLength > 100000) {
      warnings.push('Conversation is very long and may affect performance');
    }

    // Validate message sequence
    let lastRole: string | undefined;
    this.props.messages.forEach((message, index) => {
      const currentRole = message.getRole();
      
      // Check for consecutive messages from same role (warning)
      if (lastRole === currentRole && currentRole !== 'system') {
        warnings.push(`Consecutive ${currentRole} messages at position ${index}`);
      }
      
      lastRole = currentRole;
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Record<string, any> {
    return {
      id: this.getId(),
      title: this.getTitle(),
      projectId: this.getProjectId(),
      model: this.getModel(),
      messages: this.props.messages.map(msg => msg.toJSON()),
      isActive: this.isActiveConversation(),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      metadata: this.props.metadata,
      messageCount: this.getMessageCount(),
      conversationLength: this.getConversationLength()
    };
  }
}