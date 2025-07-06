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

import { BaseMessage, type WebBuddyMessage } from '@web-buddy/core';

/**
 * ChatGPT-specific message types
 * These define the domain language for ChatGPT automation
 */
export const ChatGPTMessages = {
  SELECT_PROJECT: 'SELECT_PROJECT',
  SELECT_CHAT: 'SELECT_CHAT', 
  SUBMIT_PROMPT: 'SUBMIT_PROMPT',
  GET_RESPONSE: 'GET_RESPONSE',
  START_NEW_CHAT: 'START_NEW_CHAT',
  EXPORT_CONVERSATION: 'EXPORT_CONVERSATION',
  UPLOAD_FILE: 'UPLOAD_FILE'
} as const;

export type ChatGPTMessageType = typeof ChatGPTMessages[keyof typeof ChatGPTMessages];

/**
 * Select a ChatGPT project
 */
export class SelectProjectMessage extends BaseMessage {
  public readonly type = ChatGPTMessages.SELECT_PROJECT;
  
  constructor(projectName: string, correlationId?: string) {
    super({ projectName }, correlationId, 'chatgpt.com');
  }
  
  static fromJSON(data: WebBuddyMessage): SelectProjectMessage {
    return new SelectProjectMessage(
      data.payload.projectName,
      data.correlationId
    );
  }
}

/**
 * Select a specific chat conversation
 */
export class SelectChatMessage extends BaseMessage {
  public readonly type = ChatGPTMessages.SELECT_CHAT;
  
  constructor(chatTitle?: string, chatId?: string, correlationId?: string) {
    super({ chatTitle, chatId }, correlationId, 'chatgpt.com');
  }
  
  static fromJSON(data: WebBuddyMessage): SelectChatMessage {
    return new SelectChatMessage(
      data.payload.chatTitle,
      data.payload.chatId,
      data.correlationId
    );
  }
}

/**
 * Submit a prompt to ChatGPT
 */
export class SubmitPromptMessage extends BaseMessage {
  public readonly type = ChatGPTMessages.SUBMIT_PROMPT;
  
  constructor(prompt: string, model?: string, correlationId?: string) {
    super({ prompt, model }, correlationId, 'chatgpt.com');
  }
  
  static fromJSON(data: WebBuddyMessage): SubmitPromptMessage {
    return new SubmitPromptMessage(
      data.payload.prompt,
      data.payload.model,
      data.correlationId
    );
  }
}

/**
 * Get the latest response from ChatGPT
 */
export class GetResponseMessage extends BaseMessage {
  public readonly type = ChatGPTMessages.GET_RESPONSE;
  
  constructor(waitForCompletion: boolean = true, correlationId?: string) {
    super({ waitForCompletion }, correlationId, 'chatgpt.com');
  }
  
  static fromJSON(data: WebBuddyMessage): GetResponseMessage {
    return new GetResponseMessage(
      data.payload.waitForCompletion,
      data.correlationId
    );
  }
}

/**
 * Start a new chat conversation
 */
export class StartNewChatMessage extends BaseMessage {
  public readonly type = ChatGPTMessages.START_NEW_CHAT;
  
  constructor(title?: string, correlationId?: string) {
    super({ title }, correlationId, 'chatgpt.com');
  }
  
  static fromJSON(data: WebBuddyMessage): StartNewChatMessage {
    return new StartNewChatMessage(
      data.payload.title,
      data.correlationId
    );
  }
}

/**
 * Export conversation to various formats
 */
export class ExportConversationMessage extends BaseMessage {
  public readonly type = ChatGPTMessages.EXPORT_CONVERSATION;
  
  constructor(format: 'json' | 'markdown' | 'text' = 'markdown', correlationId?: string) {
    super({ format }, correlationId, 'chatgpt.com');
  }
  
  static fromJSON(data: WebBuddyMessage): ExportConversationMessage {
    return new ExportConversationMessage(
      data.payload.format,
      data.correlationId
    );
  }
}

/**
 * Upload a file to ChatGPT
 */
export class UploadFileMessage extends BaseMessage {
  public readonly type = ChatGPTMessages.UPLOAD_FILE;
  
  constructor(fileData: string, fileName: string, mimeType?: string, correlationId?: string) {
    super({ fileData, fileName, mimeType }, correlationId, 'chatgpt.com');
  }
  
  static fromJSON(data: WebBuddyMessage): UploadFileMessage {
    return new UploadFileMessage(
      data.payload.fileData,
      data.payload.fileName,
      data.payload.mimeType,
      data.correlationId
    );
  }
}

/**
 * Interface for ChatGPT conversation data
 */
export interface ChatGPTConversation {
  id?: string;
  title: string;
  messages: ConversationMessage[];
  model?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface for individual messages in conversation
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  messageId?: string;
}

/**
 * Interface for ChatGPT project information
 */
export interface ChatGPTProject {
  id: string;
  name: string;
  description?: string;
  conversations: ChatGPTConversation[];
}

/**
 * Success response for ChatGPT operations
 */
export interface ChatGPTResponse {
  success: boolean;
  data?: any;
  content?: string;
  conversation?: ChatGPTConversation;
  project?: ChatGPTProject;
  error?: string;
  correlationId: string;
  timestamp: number;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  success: boolean;
  fileId?: string;
  fileName: string;
  size?: number;
  error?: string;
  correlationId: string;
}