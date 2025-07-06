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
 * @fileoverview ChatGPT Project domain entity
 * @author Semantest Team
 * @module domain/entities/chatgpt-project
 */

import { Entity } from 'typescript-eda-domain';
import { ChatGPTConversation } from './chatgpt-conversation.entity';
import { ProjectId } from '../value-objects/project-id.value-object';

/**
 * Properties for ChatGPT Project entity
 */
export interface ChatGPTProjectProps {
  readonly id: ProjectId;
  readonly name: string;
  readonly description?: string;
  readonly conversations: ChatGPTConversation[];
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly metadata?: Record<string, any>;
  readonly settings?: ProjectSettings;
}

/**
 * Project settings interface
 */
export interface ProjectSettings {
  defaultModel?: string;
  autoSave?: boolean;
  conversationLimit?: number;
  allowFileUploads?: boolean;
  customInstructions?: string;
}

/**
 * Validation result interface
 */
export interface ProjectValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * ChatGPT Project aggregate root
 * Manages project state, conversations, and business rules
 */
export class ChatGPTProject extends Entity<ChatGPTProjectProps> {

  /**
   * Create a new ChatGPT project
   */
  static create(
    name: string,
    options?: {
      id?: string;
      description?: string;
      settings?: ProjectSettings;
      metadata?: Record<string, any>;
    }
  ): ChatGPTProject {
    const projectId = options?.id ? ProjectId.fromString(options.id) : ProjectId.fromName(name);
    const now = new Date();

    const props: ChatGPTProjectProps = {
      id: projectId,
      name: name.trim(),
      description: options?.description?.trim(),
      conversations: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
      metadata: options?.metadata || {},
      settings: {
        defaultModel: 'gpt-4',
        autoSave: true,
        conversationLimit: 100,
        allowFileUploads: true,
        ...options?.settings
      }
    };

    return new ChatGPTProject(props);
  }

  /**
   * Create from JSON data
   */
  static fromJSON(data: any): ChatGPTProject {
    const projectId = ProjectId.fromString(data.id);
    
    const conversations = (data.conversations || []).map((convData: any) => 
      ChatGPTConversation.fromJSON(convData)
    );

    const props: ChatGPTProjectProps = {
      id: projectId,
      name: data.name,
      description: data.description,
      conversations,
      isActive: data.isActive ?? true,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      metadata: data.metadata || {},
      settings: data.settings || {}
    };

    return new ChatGPTProject(props);
  }

  /**
   * Get project ID
   */
  getId(): string {
    return this.props.id.getValue();
  }

  /**
   * Get project name
   */
  getName(): string {
    return this.props.name;
  }

  /**
   * Get project description
   */
  getDescription(): string | undefined {
    return this.props.description;
  }

  /**
   * Get all conversations
   */
  getConversations(): ChatGPTConversation[] {
    return [...this.props.conversations];
  }

  /**
   * Get active conversations
   */
  getActiveConversations(): ChatGPTConversation[] {
    return this.props.conversations.filter(conv => conv.isActiveConversation());
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId: string): ChatGPTConversation | undefined {
    return this.props.conversations.find(conv => conv.getId() === conversationId);
  }

  /**
   * Get latest conversation
   */
  getLatestConversation(): ChatGPTConversation | undefined {
    const conversations = this.getConversations();
    if (conversations.length === 0) return undefined;
    
    return conversations.reduce((latest, current) => 
      current.props.updatedAt > latest.props.updatedAt ? current : latest
    );
  }

  /**
   * Get project settings
   */
  getSettings(): ProjectSettings {
    return { ...this.props.settings };
  }

  /**
   * Get default model
   */
  getDefaultModel(): string {
    return this.props.settings?.defaultModel || 'gpt-4';
  }

  /**
   * Add a conversation to the project
   */
  addConversation(conversation: ChatGPTConversation): void {
    // Check conversation limit
    const limit = this.props.settings?.conversationLimit || 100;
    if (this.props.conversations.length >= limit) {
      throw new Error(`Project has reached conversation limit of ${limit}`);
    }

    const updatedConversations = [...this.props.conversations, conversation];
    
    this.updateProps({
      conversations: updatedConversations,
      updatedAt: new Date()
    });
  }

  /**
   * Remove a conversation from the project
   */
  removeConversation(conversationId: string): void {
    const updatedConversations = this.props.conversations.filter(
      conv => conv.getId() !== conversationId
    );
    
    this.updateProps({
      conversations: updatedConversations,
      updatedAt: new Date()
    });
  }

  /**
   * Update project name
   */
  updateName(newName: string): void {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      throw new Error('Project name cannot be empty');
    }

    this.updateProps({
      name: trimmedName,
      updatedAt: new Date()
    });
  }

  /**
   * Update project description
   */
  updateDescription(newDescription?: string): void {
    this.updateProps({
      description: newDescription?.trim(),
      updatedAt: new Date()
    });
  }

  /**
   * Update project settings
   */
  updateSettings(newSettings: Partial<ProjectSettings>): void {
    this.updateProps({
      settings: { ...this.props.settings, ...newSettings },
      updatedAt: new Date()
    });
  }

  /**
   * Mark project as active/inactive
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
   * Check if project is active
   */
  isActiveProject(): boolean {
    return this.props.isActive;
  }

  /**
   * Get conversation count
   */
  getConversationCount(): number {
    return this.props.conversations.length;
  }

  /**
   * Get active conversation count
   */
  getActiveConversationCount(): number {
    return this.getActiveConversations().length;
  }

  /**
   * Get total message count across all conversations
   */
  getTotalMessageCount(): number {
    return this.props.conversations.reduce((total, conv) => {
      return total + conv.getMessageCount();
    }, 0);
  }

  /**
   * Check if project has reached conversation limit
   */
  isAtConversationLimit(): boolean {
    const limit = this.props.settings?.conversationLimit || 100;
    return this.getConversationCount() >= limit;
  }

  /**
   * Search conversations by title or content
   */
  searchConversations(query: string, caseSensitive: boolean = false): ChatGPTConversation[] {
    const searchTerm = caseSensitive ? query : query.toLowerCase();
    
    return this.props.conversations.filter(conv => {
      const title = caseSensitive ? conv.getTitle() : conv.getTitle().toLowerCase();
      
      // Search in title
      if (title.includes(searchTerm)) {
        return true;
      }
      
      // Search in message content
      return conv.getMessages().some(message => 
        message.contains(query, caseSensitive)
      );
    });
  }

  /**
   * Get project statistics
   */
  getStatistics(): {
    conversationCount: number;
    activeConversationCount: number;
    totalMessageCount: number;
    averageMessagesPerConversation: number;
    isAtLimit: boolean;
  } {
    const conversationCount = this.getConversationCount();
    const totalMessageCount = this.getTotalMessageCount();
    
    return {
      conversationCount,
      activeConversationCount: this.getActiveConversationCount(),
      totalMessageCount,
      averageMessagesPerConversation: conversationCount > 0 ? totalMessageCount / conversationCount : 0,
      isAtLimit: this.isAtConversationLimit()
    };
  }

  /**
   * Validate project business rules
   */
  validate(): ProjectValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate name
    if (!this.props.name || this.props.name.trim().length === 0) {
      errors.push('Project name is required');
    }

    if (this.props.name && this.props.name.length > 100) {
      warnings.push('Project name is very long (>100 characters)');
    }

    // Validate conversation limit
    const limit = this.props.settings?.conversationLimit || 100;
    if (this.getConversationCount() > limit) {
      errors.push(`Project exceeds conversation limit of ${limit}`);
    }

    if (this.getConversationCount() > limit * 0.9) {
      warnings.push(`Project is approaching conversation limit (${this.getConversationCount()}/${limit})`);
    }

    // Validate conversations
    this.props.conversations.forEach((conv, index) => {
      const convValidation = conv.validate();
      if (!convValidation.valid) {
        errors.push(`Conversation ${index + 1} is invalid: ${convValidation.errors.join(', ')}`);
      }
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
      name: this.getName(),
      description: this.getDescription(),
      conversations: this.props.conversations.map(conv => conv.toJSON()),
      isActive: this.isActiveProject(),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      metadata: this.props.metadata,
      settings: this.getSettings(),
      statistics: this.getStatistics()
    };
  }
}