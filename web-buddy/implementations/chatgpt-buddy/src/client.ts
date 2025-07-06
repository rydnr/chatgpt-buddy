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

import { WebBuddyClient } from '@web-buddy/core';
import { 
  ChatGPTMessages, 
  type ChatGPTConversation, 
  type ChatGPTProject,
  type ChatGPTResponse,
  type ConversationMessage,
  type FileUploadResponse
} from './messages';

/**
 * ChatGPT-specific client that provides convenient methods
 * Built on top of the generic WebBuddyClient
 * 
 * This demonstrates the API layer - developer-friendly wrappers
 */
export class ChatGPTBuddyClient {
  constructor(private webBuddyClient: WebBuddyClient) {}
  
  /**
   * Select a ChatGPT project
   * Convenient wrapper around SELECT_PROJECT message
   */
  async selectProject(projectName: string, options?: { tabId?: number }): Promise<ChatGPTResponse> {
    return this.webBuddyClient.sendMessage({
      [ChatGPTMessages.SELECT_PROJECT]: { projectName }
    }, {
      tabId: options?.tabId
    });
  }
  
  /**
   * Select a specific chat conversation
   * Can select by title or ID
   */
  async selectChat(chatTitle?: string, chatId?: string, options?: { tabId?: number }): Promise<ChatGPTResponse> {
    return this.webBuddyClient.sendMessage({
      [ChatGPTMessages.SELECT_CHAT]: { chatTitle, chatId }
    }, {
      tabId: options?.tabId
    });
  }
  
  /**
   * Submit a prompt to ChatGPT
   * Convenient wrapper around SUBMIT_PROMPT message
   */
  async submitPrompt(prompt: string, model?: string, options?: { tabId?: number }): Promise<ChatGPTResponse> {
    return this.webBuddyClient.sendMessage({
      [ChatGPTMessages.SUBMIT_PROMPT]: { prompt, model }
    }, {
      tabId: options?.tabId
    });
  }
  
  /**
   * Get the latest response from ChatGPT
   * Can wait for completion or get current state
   */
  async getResponse(waitForCompletion: boolean = true, options?: { tabId?: number }): Promise<string> {
    const response = await this.webBuddyClient.sendMessage({
      [ChatGPTMessages.GET_RESPONSE]: { waitForCompletion }
    }, {
      tabId: options?.tabId
    });
    
    return response.content || '';
  }
  
  /**
   * Start a new chat conversation
   * Optionally provide a title
   */
  async startNewChat(title?: string, options?: { tabId?: number }): Promise<ChatGPTResponse> {
    return this.webBuddyClient.sendMessage({
      [ChatGPTMessages.START_NEW_CHAT]: { title }
    }, {
      tabId: options?.tabId
    });
  }
  
  /**
   * Export current conversation to various formats
   */
  async exportConversation(format: 'json' | 'markdown' | 'text' = 'markdown', options?: { tabId?: number }): Promise<string> {
    const response = await this.webBuddyClient.sendMessage({
      [ChatGPTMessages.EXPORT_CONVERSATION]: { format }
    }, {
      tabId: options?.tabId
    });
    
    return response.data || '';
  }
  
  /**
   * Upload a file to ChatGPT
   */
  async uploadFile(fileData: string, fileName: string, mimeType?: string, options?: { tabId?: number }): Promise<FileUploadResponse> {
    return this.webBuddyClient.sendMessage({
      [ChatGPTMessages.UPLOAD_FILE]: { fileData, fileName, mimeType }
    }, {
      tabId: options?.tabId
    });
  }
  
  /**
   * Convenience method: Complete conversation flow
   * Selects project, starts new chat, and submits prompt
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
    await this.selectProject(projectName, options);
    
    if (options?.chatTitle) {
      await this.startNewChat(options.chatTitle, { tabId: options.tabId });
    }
    
    await this.submitPrompt(question, options?.model, options);
    
    if (options?.waitForResponse !== false) {
      return this.getResponse(true, options);
    }
    
    return '';
  }
  
  /**
   * Convenience method: Multi-turn conversation
   * Handles a series of prompts and responses
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
    await this.selectProject(projectName, options);
    
    if (options?.chatTitle) {
      await this.startNewChat(options.chatTitle, options);
    }
    
    const messages: ConversationMessage[] = [];
    
    for (const prompt of prompts) {
      // Add user message
      messages.push({
        role: 'user',
        content: prompt,
        timestamp: new Date()
      });
      
      // Submit prompt and get response
      await this.submitPrompt(prompt, options?.model, options);
      const response = await this.getResponse(true, options);
      
      // Add assistant response
      messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });
      
      // Optional delay between prompts
      if (options?.delayBetweenPrompts && prompts.indexOf(prompt) < prompts.length - 1) {
        await this.delay(options.delayBetweenPrompts);
      }
    }
    
    return messages;
  }
  
  /**
   * Advanced: Research workflow
   * Combines multiple prompts with structured output
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
    const chatTitle = `Research: ${topic}`;
    await this.selectProject(projectName, options);
    await this.startNewChat(chatTitle, options);
    
    // Primary research prompt
    const researchPrompt = `Please research the topic "${topic}" and provide comprehensive information including key facts, recent developments, and important insights.`;
    await this.submitPrompt(researchPrompt, undefined, options);
    const research = await this.getResponse(true, options);
    
    const result: any = {
      topic,
      research
    };
    
    // Optional analysis
    if (options?.includeAnalysis) {
      const analysisPrompt = `Based on the research above, please provide a detailed analysis identifying patterns, implications, and key takeaways.`;
      await this.submitPrompt(analysisPrompt, undefined, options);
      result.analysis = await this.getResponse(true, options);
    }
    
    // Optional summary
    if (options?.includeSummary) {
      const summaryPrompt = `Please provide a concise summary of the key points from this research and analysis.`;
      await this.submitPrompt(summaryPrompt, undefined, options);
      result.summary = await this.getResponse(true, options);
    }
    
    // Optional export
    if (options?.exportFormat) {
      result.exportedData = await this.exportConversation(options.exportFormat, options);
    }
    
    return result;
  }
  
  /**
   * Advanced: Code generation workflow
   * Specialized for programming tasks
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
    const chatTitle = `Code Generation: ${language}`;
    await this.selectProject(projectName, options);
    await this.startNewChat(chatTitle, options);
    
    // Primary code generation prompt
    const codePrompt = `Generate ${language} code based on this specification: ${specification}${options?.codeStyle ? ` Following ${options.codeStyle} style guidelines.` : ''}`;
    await this.submitPrompt(codePrompt, undefined, options);
    const code = await this.getResponse(true, options);
    
    const result: any = {
      specification,
      language,
      code
    };
    
    // Optional tests
    if (options?.includeTests) {
      const testPrompt = `Generate comprehensive unit tests for the code you just created.`;
      await this.submitPrompt(testPrompt, undefined, options);
      result.tests = await this.getResponse(true, options);
    }
    
    // Optional documentation
    if (options?.includeDocumentation) {
      const docPrompt = `Generate comprehensive documentation for the code, including API documentation and usage examples.`;
      await this.submitPrompt(docPrompt, undefined, options);
      result.documentation = await this.getResponse(true, options);
    }
    
    return result;
  }
  
  /**
   * Utility: Check if we're on ChatGPT page
   */
  async isOnChatGPTPage(options?: { tabId?: number }): Promise<boolean> {
    try {
      // This would use a generic page detection message
      const response = await this.webBuddyClient.sendMessage({
        'EXTRACT_PAGE_TITLE': {}
      }, {
        tabId: options?.tabId
      });
      
      const title = response.title || '';
      return title.includes('ChatGPT') || title.includes('OpenAI');
    } catch {
      return false;
    }
  }
  
  /**
   * Utility method for delays
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Access to underlying WebBuddyClient for advanced use cases
   */
  getWebBuddyClient(): WebBuddyClient {
    return this.webBuddyClient;
  }
}