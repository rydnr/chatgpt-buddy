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
 * @fileoverview ChatGPT domain events
 * @author Semantest Team
 * @module domain/events/chatgpt-events
 */

import { Event } from 'typescript-eda-domain';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base interface for ChatGPT event properties
 */
export interface ChatGPTEventProps {
  readonly correlationId: string;
  readonly timestamp: Date;
  readonly domain: string;
  readonly userId?: string;
  readonly sessionId?: string;
}

/**
 * Project selection event properties
 */
export interface ProjectSelectedEventProps extends ChatGPTEventProps {
  readonly projectId: string;
  readonly projectName: string;
  readonly previousProjectId?: string;
}

/**
 * Project selected event
 * Emitted when a user selects a ChatGPT project
 */
export class ProjectSelectedEvent extends Event {
  public readonly type = 'ProjectSelectedEvent';

  constructor(private eventProps: ProjectSelectedEventProps) {
    super();
  }

  get correlationId(): string {
    return this.eventProps.correlationId;
  }

  get timestamp(): Date {
    return this.eventProps.timestamp;
  }

  getProjectId(): string {
    return this.eventProps.projectId;
  }

  getProjectName(): string {
    return this.eventProps.projectName;
  }

  getPreviousProjectId(): string | undefined {
    return this.eventProps.previousProjectId;
  }

  getDomain(): string {
    return this.eventProps.domain;
  }

  getUserId(): string | undefined {
    return this.eventProps.userId;
  }

  getSessionId(): string | undefined {
    return this.eventProps.sessionId;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      projectId: this.getProjectId(),
      projectName: this.getProjectName(),
      previousProjectId: this.getPreviousProjectId(),
      domain: this.getDomain(),
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    };
  }
}

/**
 * Conversation started event properties
 */
export interface ConversationStartedEventProps extends ChatGPTEventProps {
  readonly conversationId: string;
  readonly conversationTitle?: string;
  readonly projectId?: string;
  readonly model?: string;
}

/**
 * Conversation started event
 * Emitted when a new conversation is created
 */
export class ConversationStartedEvent extends Event {
  public readonly type = 'ConversationStartedEvent';

  constructor(private eventProps: ConversationStartedEventProps) {
    super();
  }

  get correlationId(): string {
    return this.eventProps.correlationId;
  }

  get timestamp(): Date {
    return this.eventProps.timestamp;
  }

  getConversationId(): string {
    return this.eventProps.conversationId;
  }

  getConversationTitle(): string | undefined {
    return this.eventProps.conversationTitle;
  }

  getProjectId(): string | undefined {
    return this.eventProps.projectId;
  }

  getModel(): string | undefined {
    return this.eventProps.model;
  }

  getDomain(): string {
    return this.eventProps.domain;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      conversationId: this.getConversationId(),
      conversationTitle: this.getConversationTitle(),
      projectId: this.getProjectId(),
      model: this.getModel(),
      domain: this.getDomain()
    };
  }
}

/**
 * Prompt submitted event properties
 */
export interface PromptSubmittedEventProps extends ChatGPTEventProps {
  readonly conversationId: string;
  readonly messageId: string;
  readonly prompt: string;
  readonly model?: string;
  readonly attachments?: string[];
}

/**
 * Prompt submitted event
 * Emitted when a user submits a prompt to ChatGPT
 */
export class PromptSubmittedEvent extends Event {
  public readonly type = 'PromptSubmittedEvent';

  constructor(private eventProps: PromptSubmittedEventProps) {
    super();
  }

  get correlationId(): string {
    return this.eventProps.correlationId;
  }

  get timestamp(): Date {
    return this.eventProps.timestamp;
  }

  getConversationId(): string {
    return this.eventProps.conversationId;
  }

  getMessageId(): string {
    return this.eventProps.messageId;
  }

  getPrompt(): string {
    return this.eventProps.prompt;
  }

  getModel(): string | undefined {
    return this.eventProps.model;
  }

  getAttachments(): string[] {
    return this.eventProps.attachments || [];
  }

  getDomain(): string {
    return this.eventProps.domain;
  }

  getPromptLength(): number {
    return this.getPrompt().length;
  }

  hasAttachments(): boolean {
    return this.getAttachments().length > 0;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      conversationId: this.getConversationId(),
      messageId: this.getMessageId(),
      prompt: this.getPrompt(),
      model: this.getModel(),
      attachments: this.getAttachments(),
      domain: this.getDomain(),
      promptLength: this.getPromptLength(),
      hasAttachments: this.hasAttachments()
    };
  }
}

/**
 * Response received event properties
 */
export interface ResponseReceivedEventProps extends ChatGPTEventProps {
  readonly conversationId: string;
  readonly messageId: string;
  readonly responseContent: string;
  readonly model?: string;
  readonly responseTime?: number;
  readonly tokenCount?: number;
}

/**
 * Response received event
 * Emitted when ChatGPT provides a response
 */
export class ResponseReceivedEvent extends Event {
  public readonly type = 'ResponseReceivedEvent';

  constructor(private eventProps: ResponseReceivedEventProps) {
    super();
  }

  get correlationId(): string {
    return this.eventProps.correlationId;
  }

  get timestamp(): Date {
    return this.eventProps.timestamp;
  }

  getConversationId(): string {
    return this.eventProps.conversationId;
  }

  getMessageId(): string {
    return this.eventProps.messageId;
  }

  getResponseContent(): string {
    return this.eventProps.responseContent;
  }

  getModel(): string | undefined {
    return this.eventProps.model;
  }

  getResponseTime(): number | undefined {
    return this.eventProps.responseTime;
  }

  getTokenCount(): number | undefined {
    return this.eventProps.tokenCount;
  }

  getDomain(): string {
    return this.eventProps.domain;
  }

  getResponseLength(): number {
    return this.getResponseContent().length;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      conversationId: this.getConversationId(),
      messageId: this.getMessageId(),
      responseContent: this.getResponseContent(),
      model: this.getModel(),
      responseTime: this.getResponseTime(),
      tokenCount: this.getTokenCount(),
      domain: this.getDomain(),
      responseLength: this.getResponseLength()
    };
  }
}

/**
 * Conversation exported event properties
 */
export interface ConversationExportedEventProps extends ChatGPTEventProps {
  readonly conversationId: string;
  readonly exportFormat: 'json' | 'markdown' | 'text';
  readonly exportSize: number;
  readonly messageCount: number;
}

/**
 * Conversation exported event
 * Emitted when a conversation is exported
 */
export class ConversationExportedEvent extends Event {
  public readonly type = 'ConversationExportedEvent';

  constructor(private eventProps: ConversationExportedEventProps) {
    super();
  }

  get correlationId(): string {
    return this.eventProps.correlationId;
  }

  get timestamp(): Date {
    return this.eventProps.timestamp;
  }

  getConversationId(): string {
    return this.eventProps.conversationId;
  }

  getExportFormat(): string {
    return this.eventProps.exportFormat;
  }

  getExportSize(): number {
    return this.eventProps.exportSize;
  }

  getMessageCount(): number {
    return this.eventProps.messageCount;
  }

  getDomain(): string {
    return this.eventProps.domain;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      conversationId: this.getConversationId(),
      exportFormat: this.getExportFormat(),
      exportSize: this.getExportSize(),
      messageCount: this.getMessageCount(),
      domain: this.getDomain()
    };
  }
}

/**
 * File uploaded event properties
 */
export interface FileUploadedEventProps extends ChatGPTEventProps {
  readonly conversationId: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly fileType: string;
  readonly uploadId: string;
}

/**
 * File uploaded event
 * Emitted when a file is uploaded to ChatGPT
 */
export class FileUploadedEvent extends Event {
  public readonly type = 'FileUploadedEvent';

  constructor(private eventProps: FileUploadedEventProps) {
    super();
  }

  get correlationId(): string {
    return this.eventProps.correlationId;
  }

  get timestamp(): Date {
    return this.eventProps.timestamp;
  }

  getConversationId(): string {
    return this.eventProps.conversationId;
  }

  getFileName(): string {
    return this.eventProps.fileName;
  }

  getFileSize(): number {
    return this.eventProps.fileSize;
  }

  getFileType(): string {
    return this.eventProps.fileType;
  }

  getUploadId(): string {
    return this.eventProps.uploadId;
  }

  getDomain(): string {
    return this.eventProps.domain;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      conversationId: this.getConversationId(),
      fileName: this.getFileName(),
      fileSize: this.getFileSize(),
      fileType: this.getFileType(),
      uploadId: this.getUploadId(),
      domain: this.getDomain()
    };
  }
}

/**
 * Utility function to create ChatGPT events with common properties
 */
export function createChatGPTEvent<T extends ChatGPTEventProps>(
  EventClass: new (props: T) => Event,
  props: Omit<T, 'correlationId' | 'timestamp' | 'domain'> & {
    correlationId?: string;
    timestamp?: Date;
  }
): Event {
  const eventProps = {
    ...props,
    correlationId: props.correlationId || uuidv4(),
    timestamp: props.timestamp || new Date(),
    domain: 'chatgpt.com'
  } as T;

  return new EventClass(eventProps);
}