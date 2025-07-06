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
 * @fileoverview ChatGPT Client using TypeScript-EDA foundation
 * @author Semantest Team
 * @module chatgpt-client
 */

import { v4 as uuidv4 } from 'uuid';
import { WebSocketConfig } from 'typescript-eda-infrastructure';
import { ChatGPTCommunicationAdapter } from './infrastructure/adapters/chatgpt-communication.adapter';
import { ChatGPTDOMAdapter } from './infrastructure/adapters/chatgpt-dom.adapter';
import { ChatGPTApplication, ChatGPTApplicationConfig } from './application/chatgpt.application';
import { 
  ChatGPTConversation, 
  ConversationMessage, 
  ChatGPTProject 
} from './domain/entities';
import { 
  ProjectSelectedEvent,
  ConversationStartedEvent,
  PromptSubmittedEvent,
  ResponseReceivedEvent,
  ConversationExportedEvent,
  FileUploadedEvent,
  createChatGPTEvent
} from './domain/events/chatgpt-events';

/**
 * ChatGPT client configuration
 */
export interface ChatGPTClientConfig {
  serverUrl: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  clientId?: string;
  debug?: boolean;
  enableEventLogging?: boolean;
  enablePerformanceMonitoring?: boolean;
}

/**
 * ChatGPT operation options
 */
export interface ChatGPTOperationOptions {
  tabId?: number;
  timeout?: number;
  correlationId?: string;
}

/**
 * Conversation workflow options
 */
export interface ConversationWorkflowOptions extends ChatGPTOperationOptions {
  chatTitle?: string;
  model?: string;
  delayBetweenPrompts?: number;
  exportFormat?: 'json' | 'markdown' | 'text';
}

/**
 * ChatGPT Client built on TypeScript-EDA foundation
 * Provides intelligent, event-driven ChatGPT automation capabilities
 */
export class ChatGPTClient {
  private communicationAdapter: ChatGPTCommunicationAdapter;
  private domAdapter: ChatGPTDOMAdapter;
  private application: ChatGPTApplication;
  private eventListeners = new Map<string, Array<(event: any) => void>>();

  constructor(config: ChatGPTClientConfig) {
    this.validateConfig(config);
    this.setupAdapters(config);
    this.setupApplication(config);
    this.setupEventHandlers();
  }

  /**
   * Connect to Semantest server
   */
  async connect(): Promise<void> {
    await this.communicationAdapter.connect();
    this.log('Connected to Semantest server for ChatGPT automation', 'info');
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    await this.communicationAdapter.disconnect();
    this.log('Disconnected from Semantest server', 'info');
  }

  /**
   * Select a ChatGPT project
   */
  async selectProject(
    projectName: string, 
    options?: ChatGPTOperationOptions
  ): Promise<{ success: boolean; project?: ChatGPTProject; error?: string }> {
    try {
      const correlationId = options?.correlationId || uuidv4();
      
      // Create and emit domain event
      const event = createChatGPTEvent(ProjectSelectedEvent, {
        projectId: projectName, // Will be normalized by ProjectId
        projectName,
        correlationId
      });

      this.emit('project_selecting', event);

      // Execute through communication adapter
      const result = await this.communicationAdapter.selectProject(projectName, options);

      if (result.success) {
        // Create project entity from result
        const project = result.data?.project ? ChatGPTProject.fromJSON(result.data.project) : undefined;
        
        this.emit('project_selected', { event, result, project });
        return { success: true, project };
      } else {
        this.emit('project_selection_failed', { event, result });
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.log(`Failed to select project: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Select a chat conversation
   */
  async selectChat(
    chatTitle?: string, 
    chatId?: string,
    options?: ChatGPTOperationOptions
  ): Promise<{ success: boolean; conversation?: ChatGPTConversation; error?: string }> {
    try {
      const result = await this.communicationAdapter.selectChat(chatTitle, chatId, options);

      if (result.success) {
        const conversation = result.data?.conversation ? 
          ChatGPTConversation.fromJSON(result.data.conversation) : undefined;
        
        return { success: true, conversation };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.log(`Failed to select chat: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Start a new chat conversation
   */
  async startNewChat(
    title?: string,
    options?: ChatGPTOperationOptions
  ): Promise<{ success: boolean; conversation?: ChatGPTConversation; error?: string }> {
    try {
      const correlationId = options?.correlationId || uuidv4();
      
      // Create and emit domain event
      const event = createChatGPTEvent(ConversationStartedEvent, {
        conversationId: uuidv4(),
        conversationTitle: title,
        correlationId
      });

      this.emit('conversation_starting', event);

      const result = await this.communicationAdapter.startNewChat(title, options);

      if (result.success) {
        const conversation = result.data?.conversation ? 
          ChatGPTConversation.fromJSON(result.data.conversation) : undefined;
        
        this.emit('conversation_started', { event, result, conversation });
        return { success: true, conversation };
      } else {
        this.emit('conversation_start_failed', { event, result });
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.log(`Failed to start new chat: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit a prompt to ChatGPT
   */
  async submitPrompt(
    prompt: string, 
    model?: string,
    options?: ChatGPTOperationOptions & { attachments?: string[] }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const correlationId = options?.correlationId || uuidv4();
      const messageId = uuidv4();
      
      // Create and emit domain event
      const event = createChatGPTEvent(PromptSubmittedEvent, {
        conversationId: 'current', // Would be set based on context
        messageId,
        prompt,
        model,
        attachments: options?.attachments,
        correlationId
      });

      this.emit('prompt_submitting', event);

      const result = await this.communicationAdapter.submitPrompt(prompt, model, options);

      if (result.success) {
        this.emit('prompt_submitted', { event, result });
        return { success: true, messageId };
      } else {
        this.emit('prompt_submission_failed', { event, result });
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.log(`Failed to submit prompt: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get the latest response from ChatGPT
   */
  async getResponse(
    waitForCompletion: boolean = true,
    options?: ChatGPTOperationOptions
  ): Promise<{ success: boolean; content?: string; message?: ConversationMessage; error?: string }> {
    try {
      const result = await this.communicationAdapter.getResponse(waitForCompletion, options);

      if (result.success) {
        const content = result.data?.content || '';
        const message = result.data?.message ? 
          ConversationMessage.fromJSON(result.data.message) : 
          ConversationMessage.createAssistantMessage(content);

        // Create and emit domain event
        const event = createChatGPTEvent(ResponseReceivedEvent, {
          conversationId: 'current',
          messageId: message.getId(),
          responseContent: content,
          correlationId: options?.correlationId || uuidv4()
        });

        this.emit('response_received', { event, result, message });
        return { success: true, content, message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.log(`Failed to get response: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload a file to ChatGPT
   */
  async uploadFile(
    fileData: string, 
    fileName: string, 
    mimeType?: string,
    options?: ChatGPTOperationOptions
  ): Promise<{ success: boolean; uploadId?: string; error?: string }> {
    try {
      const correlationId = options?.correlationId || uuidv4();
      const uploadId = uuidv4();
      
      // Create and emit domain event
      const event = createChatGPTEvent(FileUploadedEvent, {
        conversationId: 'current',
        fileName,
        fileSize: fileData.length,
        fileType: mimeType || 'application/octet-stream',
        uploadId,
        correlationId
      });

      this.emit('file_uploading', event);

      const result = await this.communicationAdapter.uploadFile(fileData, fileName, mimeType, options);

      if (result.success) {
        this.emit('file_uploaded', { event, result });
        return { success: true, uploadId };
      } else {
        this.emit('file_upload_failed', { event, result });
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.log(`Failed to upload file: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Export conversation
   */
  async exportConversation(
    format: 'json' | 'markdown' | 'text' = 'markdown',
    options?: ChatGPTOperationOptions
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const correlationId = options?.correlationId || uuidv4();
      
      const result = await this.communicationAdapter.exportConversation(format, options);

      if (result.success) {
        const content = result.data?.content || '';
        
        // Create and emit domain event
        const event = createChatGPTEvent(ConversationExportedEvent, {
          conversationId: 'current',
          exportFormat: format,
          exportSize: content.length,
          messageCount: 0, // Would be calculated based on actual conversation
          correlationId
        });

        this.emit('conversation_exported', { event, result });
        return { success: true, content };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.log(`Failed to export conversation: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute complete conversation workflow
   */
  async executeConversationWorkflow(
    projectName: string,
    prompts: string[],
    options?: ConversationWorkflowOptions
  ): Promise<{
    success: boolean;
    messages: ConversationMessage[];
    conversationData?: string;
    error?: string;
  }> {
    try {
      this.log(`Starting conversation workflow: ${projectName}`, 'info');

      const workflowResult = await this.application.executeWorkflow(projectName, prompts, {
        chatTitle: options?.chatTitle,
        model: options?.model,
        delayBetweenPrompts: options?.delayBetweenPrompts,
        exportFormat: options?.exportFormat
      });

      const messages: ConversationMessage[] = [];
      
      // Build conversation from workflow results
      for (const prompt of prompts) {
        const userMessage = ConversationMessage.createUserMessage(prompt);
        messages.push(userMessage);
        
        // Add corresponding assistant response (would be extracted from results)
        // This is a simplified version - in practice, would parse actual responses
        const assistantMessage = ConversationMessage.createAssistantMessage('Response content');
        messages.push(assistantMessage);
      }

      return {
        success: workflowResult.success,
        messages,
        conversationData: workflowResult.conversationData,
        error: workflowResult.error
      };
    } catch (error) {
      this.log(`Workflow execution failed: ${error.message}`, 'error');
      return {
        success: false,
        messages: [],
        error: error.message
      };
    }
  }

  /**
   * Get application status
   */
  async getStatus(): Promise<any> {
    return this.application.getStatus();
  }

  /**
   * Add event listener
   */
  on(eventType: string, listener: (event: any) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): any {
    return this.communicationAdapter.getConnectionStatus();
  }

  /**
   * Private setup methods
   */

  private validateConfig(config: ChatGPTClientConfig): void {
    if (!config.serverUrl) {
      throw new Error('Server URL is required');
    }

    if (!config.serverUrl.startsWith('ws://') && !config.serverUrl.startsWith('wss://')) {
      throw new Error('Server URL must be a WebSocket URL (ws:// or wss://)');
    }
  }

  private setupAdapters(config: ChatGPTClientConfig): void {
    const wsConfig: WebSocketConfig = {
      url: config.serverUrl,
      timeout: config.timeout,
      retries: config.retries,
      headers: config.headers,
      clientId: config.clientId,
      debug: config.debug
    };

    this.communicationAdapter = new ChatGPTCommunicationAdapter(wsConfig);
    this.domAdapter = new ChatGPTDOMAdapter();
  }

  private setupApplication(config: ChatGPTClientConfig): void {
    const appConfig: ChatGPTApplicationConfig = {
      communicationAdapter: this.communicationAdapter,
      domAdapter: this.domAdapter,
      enableEventLogging: config.enableEventLogging,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring,
      defaultTimeout: config.timeout
    };

    this.application = new ChatGPTApplication(appConfig);
  }

  private setupEventHandlers(): void {
    // Forward communication adapter events
    this.communicationAdapter.on('connected', (data) => {
      this.emit('connected', data);
    });

    this.communicationAdapter.on('disconnected', (data) => {
      this.emit('disconnected', data);
    });

    this.communicationAdapter.on('error', (data) => {
      this.emit('error', data);
    });
  }

  private emit(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          this.log(`Event listener error: ${error.message}`, 'error');
        }
      });
    }
  }

  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [ChatGPT Client] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'debug':
        console.log(`${prefix} ${message}`);
        break;
      case 'info':
        console.info(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
    }
  }
}