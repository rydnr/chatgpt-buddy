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
 * @fileoverview ChatGPT Buddy backward compatibility wrapper
 * @description Maintains the original ChatGPTBuddyClient API while using new TypeScript-EDA foundation
 * @deprecated Use ChatGPTClient from @semantest/chatgpt.com directly. This compatibility layer will be removed in v3.0.0
 */

import { ChatGPTClient, ChatGPTClientConfig } from '../chatgpt.client';

/**
 * Helper function to create deprecation warning
 */
function createDeprecationWarning(methodName: string): void {
  console.warn(
    `[DEPRECATED] ChatGPTBuddyClient.${methodName} is deprecated and will be removed in v3.0.0.\n` +
    `Please migrate to ChatGPTClient from @semantest/chatgpt.com.\n` +
    `Migration guide: https://docs.semantest.com/migration/chatgpt.com`
  );
}

/**
 * Legacy ChatGPT response interface
 */
export interface ChatGPTResponse {
  success: boolean;
  data?: any;
  content?: string;
  conversation?: any;
  project?: any;
  error?: string;
  correlationId: string;
  timestamp: number;
}

/**
 * Legacy conversation message interface  
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  messageId?: string;
}

/**
 * Legacy file upload response interface
 */
export interface FileUploadResponse {
  success: boolean;
  fileId?: string;
  fileName: string;
  size?: number;
  error?: string;
  correlationId: string;
}

/**
 * Legacy ChatGPT project interface
 */
export interface ChatGPTProject {
  id: string;
  name: string;
  description?: string;
  conversations: any[];
}

/**
 * Legacy ChatGPT conversation interface
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
 * Backward compatibility wrapper for ChatGPTBuddyClient
 * Maintains the original API while using the new TypeScript-EDA based implementation
 * 
 * @deprecated Use ChatGPTClient from @semantest/chatgpt.com directly
 */
export class ChatGPTBuddyClient {
  private chatGPTClient: ChatGPTClient;

  constructor(config: any) {
    createDeprecationWarning('constructor');
    
    // Convert legacy config to new format
    const clientConfig: ChatGPTClientConfig = {
      serverUrl: config.serverUrl || 'ws://localhost:8080',
      timeout: config.timeout,
      retries: config.retries,
      headers: config.headers,
      clientId: config.clientId,
      debug: config.debug,
      enableEventLogging: config.enableEventLogging,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring
    };

    this.chatGPTClient = new ChatGPTClient(clientConfig);
  }

  /**
   * Select a ChatGPT project
   * @deprecated Use ChatGPTClient.selectProject() instead
   */
  async selectProject(projectName: string, options?: { tabId?: number }): Promise<ChatGPTResponse> {
    createDeprecationWarning('selectProject');
    
    const result = await this.chatGPTClient.selectProject(projectName, options);
    
    return {
      success: result.success,
      data: result.project ? { project: result.project.toJSON() } : undefined,
      error: result.error,
      correlationId: Date.now().toString(),
      timestamp: Date.now()
    };
  }

  /**
   * Select a specific chat conversation
   * @deprecated Use ChatGPTClient.selectChat() instead
   */
  async selectChat(chatTitle?: string, chatId?: string, options?: { tabId?: number }): Promise<ChatGPTResponse> {
    createDeprecationWarning('selectChat');
    
    const result = await this.chatGPTClient.selectChat(chatTitle, chatId, options);
    
    return {
      success: result.success,
      data: result.conversation ? { conversation: result.conversation.toJSON() } : undefined,
      error: result.error,
      correlationId: Date.now().toString(),
      timestamp: Date.now()
    };
  }

  /**
   * Submit a prompt to ChatGPT
   * @deprecated Use ChatGPTClient.submitPrompt() instead
   */
  async submitPrompt(prompt: string, model?: string, options?: { tabId?: number }): Promise<ChatGPTResponse> {
    createDeprecationWarning('submitPrompt');
    
    const result = await this.chatGPTClient.submitPrompt(prompt, model, options);
    
    return {
      success: result.success,
      data: { messageId: result.messageId },
      error: result.error,
      correlationId: Date.now().toString(),
      timestamp: Date.now()
    };
  }

  /**
   * Get the latest response from ChatGPT
   * @deprecated Use ChatGPTClient.getResponse() instead
   */
  async getResponse(waitForCompletion: boolean = true, options?: { tabId?: number }): Promise<string> {
    createDeprecationWarning('getResponse');
    
    const result = await this.chatGPTClient.getResponse(waitForCompletion, options);
    
    return result.content || '';
  }

  /**
   * Start a new chat conversation
   * @deprecated Use ChatGPTClient.startNewChat() instead
   */
  async startNewChat(title?: string, options?: { tabId?: number }): Promise<ChatGPTResponse> {
    createDeprecationWarning('startNewChat');
    
    const result = await this.chatGPTClient.startNewChat(title, options);
    
    return {
      success: result.success,
      data: result.conversation ? { conversation: result.conversation.toJSON() } : undefined,
      error: result.error,
      correlationId: Date.now().toString(),
      timestamp: Date.now()
    };
  }

  /**
   * Export current conversation to various formats
   * @deprecated Use ChatGPTClient.exportConversation() instead
   */
  async exportConversation(format: 'json' | 'markdown' | 'text' = 'markdown', options?: { tabId?: number }): Promise<string> {
    createDeprecationWarning('exportConversation');
    
    const result = await this.chatGPTClient.exportConversation(format, options);
    
    return result.content || '';
  }

  /**
   * Upload a file to ChatGPT
   * @deprecated Use ChatGPTClient.uploadFile() instead
   */
  async uploadFile(fileData: string, fileName: string, mimeType?: string, options?: { tabId?: number }): Promise<FileUploadResponse> {
    createDeprecationWarning('uploadFile');
    
    const result = await this.chatGPTClient.uploadFile(fileData, fileName, mimeType, options);
    
    return {
      success: result.success,
      fileId: result.uploadId,
      fileName,
      error: result.error,
      correlationId: Date.now().toString()
    };
  }

  /**
   * Complete conversation flow
   * @deprecated Use ChatGPTClient.executeConversationWorkflow() instead
   */
  async askQuestion(
    projectName: string, 
    question: string, 
    options?: { 
      tabId?: number; 
      model?: string; 
      chatTitle?: string;
      waitForResponse?: boolean;
    }
  ): Promise<string> {
    createDeprecationWarning('askQuestion');
    
    const result = await this.chatGPTClient.executeConversationWorkflow(
      projectName, 
      [question], 
      {
        chatTitle: options?.chatTitle,
        model: options?.model,
        tabId: options?.tabId
      }
    );
    
    if (result.success && result.messages.length > 1) {
      return result.messages[result.messages.length - 1].getContent();
    }
    
    return result.error || '';
  }

  /**
   * Multi-turn conversation
   * @deprecated Use ChatGPTClient.executeConversationWorkflow() instead
   */
  async conversation(
    projectName: string,
    prompts: string[],
    options?: {
      tabId?: number;
      model?: string;
      chatTitle?: string;
      delayBetweenPrompts?: number;
    }
  ): Promise<ConversationMessage[]> {
    createDeprecationWarning('conversation');
    
    const result = await this.chatGPTClient.executeConversationWorkflow(
      projectName, 
      prompts, 
      {
        chatTitle: options?.chatTitle,
        model: options?.model,
        delayBetweenPrompts: options?.delayBetweenPrompts,
        tabId: options?.tabId
      }
    );
    
    return result.messages.map(msg => ({
      role: msg.getRole(),
      content: msg.getContent(),
      timestamp: msg.getTimestamp(),
      messageId: msg.getId()
    }));
  }

  /**
   * Research workflow
   * @deprecated Use ChatGPTClient.executeConversationWorkflow() instead
   */
  async researchWorkflow(
    projectName: string,
    topic: string,
    options?: {
      tabId?: number;
      includeAnalysis?: boolean;
      includeSummary?: boolean;
      exportFormat?: 'json' | 'markdown' | 'text';
    }
  ): Promise<{
    topic: string;
    research: string;
    analysis?: string;
    summary?: string;
    exportedData?: string;
  }> {
    createDeprecationWarning('researchWorkflow');
    
    const prompts = [
      `Please research the topic "${topic}" and provide comprehensive information including key facts, recent developments, and important insights.`
    ];
    
    if (options?.includeAnalysis) {
      prompts.push(`Based on the research above, please provide a detailed analysis identifying patterns, implications, and key takeaways.`);
    }
    
    if (options?.includeSummary) {
      prompts.push(`Please provide a concise summary of the key points from this research and analysis.`);
    }
    
    const result = await this.chatGPTClient.executeConversationWorkflow(
      projectName, 
      prompts, 
      {
        chatTitle: `Research: ${topic}`,
        exportFormat: options?.exportFormat,
        tabId: options?.tabId
      }
    );
    
    const researchResult: any = { topic };
    
    if (result.messages.length >= 2) {
      researchResult.research = result.messages[1].getContent();
    }
    
    if (options?.includeAnalysis && result.messages.length >= 4) {
      researchResult.analysis = result.messages[3].getContent();
    }
    
    if (options?.includeSummary && result.messages.length >= 6) {
      researchResult.summary = result.messages[5].getContent();
    }
    
    if (result.conversationData) {
      researchResult.exportedData = result.conversationData;
    }
    
    return researchResult;
  }

  /**
   * Code generation workflow
   * @deprecated Use ChatGPTClient.executeConversationWorkflow() instead
   */
  async generateCode(
    projectName: string,
    specification: string,
    language: string,
    options?: {
      tabId?: number;
      includeTests?: boolean;
      includeDocumentation?: boolean;
      codeStyle?: string;
    }
  ): Promise<{
    specification: string;
    language: string;
    code: string;
    tests?: string;
    documentation?: string;
  }> {
    createDeprecationWarning('generateCode');
    
    const prompts = [
      `Generate ${language} code based on this specification: ${specification}${options?.codeStyle ? ` Following ${options.codeStyle} style guidelines.` : ''}`
    ];
    
    if (options?.includeTests) {
      prompts.push(`Generate comprehensive unit tests for the code you just created.`);
    }
    
    if (options?.includeDocumentation) {
      prompts.push(`Generate comprehensive documentation for the code, including API documentation and usage examples.`);
    }
    
    const result = await this.chatGPTClient.executeConversationWorkflow(
      projectName, 
      prompts, 
      {
        chatTitle: `Code Generation: ${language}`,
        tabId: options?.tabId
      }
    );
    
    const codeResult: any = { specification, language };
    
    if (result.messages.length >= 2) {
      codeResult.code = result.messages[1].getContent();
    }
    
    if (options?.includeTests && result.messages.length >= 4) {
      codeResult.tests = result.messages[3].getContent();
    }
    
    if (options?.includeDocumentation && result.messages.length >= 6) {
      codeResult.documentation = result.messages[5].getContent();
    }
    
    return codeResult;
  }

  /**
   * Check if we're on ChatGPT page
   * @deprecated Use ChatGPTClient.getStatus() instead
   */
  async isOnChatGPTPage(options?: { tabId?: number }): Promise<boolean> {
    createDeprecationWarning('isOnChatGPTPage');
    
    const status = await this.chatGPTClient.getStatus();
    return status.adaptersStatus.dom.isOnChatGPT;
  }

  /**
   * Access to underlying client for advanced use cases
   * @deprecated Migrate to ChatGPTClient directly
   */
  getChatGPTClient(): ChatGPTClient {
    createDeprecationWarning('getChatGPTClient');
    return this.chatGPTClient;
  }
}