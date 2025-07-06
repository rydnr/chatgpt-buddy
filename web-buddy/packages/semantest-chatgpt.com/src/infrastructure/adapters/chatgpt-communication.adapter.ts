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
 * @fileoverview ChatGPT communication adapter
 * @author Semantest Team
 * @module infrastructure/adapters/chatgpt-communication
 */

import { 
  WebSocketCommunicationAdapter, 
  WebSocketConfig,
  type WebSocketMessage 
} from 'typescript-eda-infrastructure';
import { Event } from 'typescript-eda-domain';

/**
 * ChatGPT-specific message types
 */
export const ChatGPTMessageTypes = {
  SELECT_PROJECT: 'CHATGPT_SELECT_PROJECT',
  SELECT_CHAT: 'CHATGPT_SELECT_CHAT',
  START_NEW_CHAT: 'CHATGPT_START_NEW_CHAT',
  SUBMIT_PROMPT: 'CHATGPT_SUBMIT_PROMPT',
  GET_RESPONSE: 'CHATGPT_GET_RESPONSE',
  UPLOAD_FILE: 'CHATGPT_UPLOAD_FILE',
  EXPORT_CONVERSATION: 'CHATGPT_EXPORT_CONVERSATION',
  GET_CONVERSATION_LIST: 'CHATGPT_GET_CONVERSATION_LIST',
  GET_PROJECT_LIST: 'CHATGPT_GET_PROJECT_LIST'
} as const;

export type ChatGPTMessageType = typeof ChatGPTMessageTypes[keyof typeof ChatGPTMessageTypes];

/**
 * ChatGPT operation result interface
 */
export interface ChatGPTOperationResult {
  success: boolean;
  data?: any;
  error?: string;
  correlationId: string;
  timestamp: Date;
  operationType: string;
}

/**
 * ChatGPT communication adapter
 * Extends WebSocketCommunicationAdapter with ChatGPT-specific functionality
 */
export class ChatGPTCommunicationAdapter extends WebSocketCommunicationAdapter {
  private domain = 'chatgpt.com';

  constructor(config: WebSocketConfig) {
    super(config);
    this.setupChatGPTHandlers();
  }

  /**
   * Set up ChatGPT-specific message handlers
   */
  private setupChatGPTHandlers(): void {
    // Handle ChatGPT-specific responses
    this.onMessage('CHATGPT_OPERATION_RESULT', this.handleOperationResult.bind(this));
    this.onMessage('CHATGPT_ERROR', this.handleChatGPTError.bind(this));
    this.onMessage('CHATGPT_STATUS_UPDATE', this.handleStatusUpdate.bind(this));
  }

  /**
   * Select a ChatGPT project
   */
  async selectProject(
    projectName: string, 
    options?: { 
      tabId?: number;
      timeout?: number;
    }
  ): Promise<ChatGPTOperationResult> {
    const result = await this.sendMessage(
      ChatGPTMessageTypes.SELECT_PROJECT,
      { 
        projectName,
        tabId: options?.tabId 
      },
      { 
        expectResponse: true, 
        timeout: options?.timeout || 10000 
      }
    );

    return this.processOperationResult(result, 'selectProject');
  }

  /**
   * Select a chat conversation
   */
  async selectChat(
    chatTitle?: string, 
    chatId?: string,
    options?: { 
      tabId?: number;
      timeout?: number;
    }
  ): Promise<ChatGPTOperationResult> {
    const result = await this.sendMessage(
      ChatGPTMessageTypes.SELECT_CHAT,
      { 
        chatTitle, 
        chatId,
        tabId: options?.tabId 
      },
      { 
        expectResponse: true, 
        timeout: options?.timeout || 10000 
      }
    );

    return this.processOperationResult(result, 'selectChat');
  }

  /**
   * Start a new chat conversation
   */
  async startNewChat(
    title?: string,
    options?: { 
      tabId?: number;
      timeout?: number;
    }
  ): Promise<ChatGPTOperationResult> {
    const result = await this.sendMessage(
      ChatGPTMessageTypes.START_NEW_CHAT,
      { 
        title,
        tabId: options?.tabId 
      },
      { 
        expectResponse: true, 
        timeout: options?.timeout || 10000 
      }
    );

    return this.processOperationResult(result, 'startNewChat');
  }

  /**
   * Submit a prompt to ChatGPT
   */
  async submitPrompt(
    prompt: string, 
    model?: string,
    options?: { 
      tabId?: number;
      timeout?: number;
      attachments?: string[];
    }
  ): Promise<ChatGPTOperationResult> {
    const result = await this.sendMessage(
      ChatGPTMessageTypes.SUBMIT_PROMPT,
      { 
        prompt, 
        model,
        attachments: options?.attachments,
        tabId: options?.tabId 
      },
      { 
        expectResponse: true, 
        timeout: options?.timeout || 30000 
      }
    );

    return this.processOperationResult(result, 'submitPrompt');
  }

  /**
   * Get the latest response from ChatGPT
   */
  async getResponse(
    waitForCompletion: boolean = true,
    options?: { 
      tabId?: number;
      timeout?: number;
    }
  ): Promise<ChatGPTOperationResult> {
    const result = await this.sendMessage(
      ChatGPTMessageTypes.GET_RESPONSE,
      { 
        waitForCompletion,
        tabId: options?.tabId 
      },
      { 
        expectResponse: true, 
        timeout: options?.timeout || 60000 
      }
    );

    return this.processOperationResult(result, 'getResponse');
  }

  /**
   * Upload a file to ChatGPT
   */
  async uploadFile(
    fileData: string, 
    fileName: string, 
    mimeType?: string,
    options?: { 
      tabId?: number;
      timeout?: number;
    }
  ): Promise<ChatGPTOperationResult> {
    const result = await this.sendMessage(
      ChatGPTMessageTypes.UPLOAD_FILE,
      { 
        fileData, 
        fileName, 
        mimeType,
        tabId: options?.tabId 
      },
      { 
        expectResponse: true, 
        timeout: options?.timeout || 30000 
      }
    );

    return this.processOperationResult(result, 'uploadFile');
  }

  /**
   * Export conversation
   */
  async exportConversation(
    format: 'json' | 'markdown' | 'text' = 'markdown',
    options?: { 
      tabId?: number;
      timeout?: number;
    }
  ): Promise<ChatGPTOperationResult> {
    const result = await this.sendMessage(
      ChatGPTMessageTypes.EXPORT_CONVERSATION,
      { 
        format,
        tabId: options?.tabId 
      },
      { 
        expectResponse: true, 
        timeout: options?.timeout || 15000 
      }
    );

    return this.processOperationResult(result, 'exportConversation');
  }

  /**
   * Get list of conversations
   */
  async getConversationList(
    projectId?: string,
    options?: { 
      tabId?: number;
      timeout?: number;
      limit?: number;
    }
  ): Promise<ChatGPTOperationResult> {
    const result = await this.sendMessage(
      ChatGPTMessageTypes.GET_CONVERSATION_LIST,
      { 
        projectId,
        limit: options?.limit,
        tabId: options?.tabId 
      },
      { 
        expectResponse: true, 
        timeout: options?.timeout || 10000 
      }
    );

    return this.processOperationResult(result, 'getConversationList');
  }

  /**
   * Get list of projects
   */
  async getProjectList(
    options?: { 
      tabId?: number;
      timeout?: number;
    }
  ): Promise<ChatGPTOperationResult> {
    const result = await this.sendMessage(
      ChatGPTMessageTypes.GET_PROJECT_LIST,
      { 
        tabId: options?.tabId 
      },
      { 
        expectResponse: true, 
        timeout: options?.timeout || 10000 
      }
    );

    return this.processOperationResult(result, 'getProjectList');
  }

  /**
   * Execute a complete conversation workflow
   */
  async executeConversationWorkflow(
    projectName: string,
    prompts: string[],
    options?: {
      chatTitle?: string;
      model?: string;
      tabId?: number;
      delayBetweenPrompts?: number;
    }
  ): Promise<ChatGPTOperationResult[]> {
    const results: ChatGPTOperationResult[] = [];

    try {
      // Step 1: Select project
      const projectResult = await this.selectProject(projectName, options);
      results.push(projectResult);
      
      if (!projectResult.success) {
        return results;
      }

      // Step 2: Start new chat if title provided
      if (options?.chatTitle) {
        const chatResult = await this.startNewChat(options.chatTitle, options);
        results.push(chatResult);
        
        if (!chatResult.success) {
          return results;
        }
      }

      // Step 3: Submit prompts sequentially
      for (const [index, prompt] of prompts.entries()) {
        // Submit prompt
        const promptResult = await this.submitPrompt(prompt, options?.model, options);
        results.push(promptResult);
        
        if (!promptResult.success) {
          break;
        }

        // Get response
        const responseResult = await this.getResponse(true, options);
        results.push(responseResult);
        
        if (!responseResult.success) {
          break;
        }

        // Delay between prompts if specified
        if (options?.delayBetweenPrompts && index < prompts.length - 1) {
          await this.delay(options.delayBetweenPrompts);
        }
      }

      return results;
    } catch (error) {
      results.push({
        success: false,
        error: `Workflow failed: ${error.message}`,
        correlationId: this.generateCorrelationId(),
        timestamp: new Date(),
        operationType: 'executeConversationWorkflow'
      });
      
      return results;
    }
  }

  /**
   * Publish ChatGPT-specific domain event
   */
  async publishChatGPTEvent(event: Event): Promise<void> {
    await this.publishEvent(event);
  }

  /**
   * Handle operation result messages
   */
  private async handleOperationResult(message: WebSocketMessage): Promise<void> {
    this.emit('operation_result', {
      result: message.payload,
      correlationId: message.correlationId,
      timestamp: new Date()
    });
  }

  /**
   * Handle ChatGPT error messages
   */
  private async handleChatGPTError(message: WebSocketMessage): Promise<void> {
    this.emit('chatgpt_error', {
      error: message.payload.error,
      correlationId: message.correlationId,
      timestamp: new Date()
    });
  }

  /**
   * Handle status update messages
   */
  private async handleStatusUpdate(message: WebSocketMessage): Promise<void> {
    this.emit('status_update', {
      status: message.payload,
      correlationId: message.correlationId,
      timestamp: new Date()
    });
  }

  /**
   * Process operation result from server
   */
  private processOperationResult(result: any, operationType: string): ChatGPTOperationResult {
    return {
      success: result?.success ?? false,
      data: result?.data,
      error: result?.error,
      correlationId: result?.correlationId || this.generateCorrelationId(),
      timestamp: new Date(),
      operationType
    };
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `chatgpt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility method for delays
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get domain
   */
  getDomain(): string {
    return this.domain;
  }
}