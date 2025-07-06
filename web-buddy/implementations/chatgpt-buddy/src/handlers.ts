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

import { MessageHandler, WebBuddyMessage } from '@web-buddy/core';
import { ChatGPTMessages, type ChatGPTResponse } from './messages';

/**
 * ChatGPT-specific message handler
 * Implements the domain logic for ChatGPT automation
 */
export class ChatGPTHandler implements MessageHandler {
  
  async handle(message: WebBuddyMessage): Promise<ChatGPTResponse> {
    try {
      switch (message.type) {
        case ChatGPTMessages.SELECT_PROJECT:
          return await this.selectProject(message.payload.projectName);
          
        case ChatGPTMessages.SELECT_CHAT:
          return await this.selectChat(message.payload.chatTitle, message.payload.chatId);
          
        case ChatGPTMessages.SUBMIT_PROMPT:
          return await this.submitPrompt(message.payload.prompt, message.payload.model);
          
        case ChatGPTMessages.GET_RESPONSE:
          return await this.getResponse(message.payload.waitForCompletion);
          
        case ChatGPTMessages.START_NEW_CHAT:
          return await this.startNewChat(message.payload.title);
          
        case ChatGPTMessages.EXPORT_CONVERSATION:
          return await this.exportConversation(message.payload.format);
          
        case ChatGPTMessages.UPLOAD_FILE:
          return await this.uploadFile(
            message.payload.fileData,
            message.payload.fileName,
            message.payload.mimeType
          );
          
        default:
          throw new Error(`Unknown ChatGPT message type: ${message.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: message.correlationId,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Select a ChatGPT project
   */
  private async selectProject(projectName: string): Promise<ChatGPTResponse> {
    // Look for project selector or dropdown
    const projectSelector = document.querySelector('[data-testid="project-selector"]') ||
                           document.querySelector('select[name="project"]') ||
                           document.querySelector('.project-dropdown');
    
    if (!projectSelector) {
      throw new Error('Project selector not found on page');
    }
    
    // Handle different types of project selectors
    if (projectSelector.tagName === 'SELECT') {
      const selectElement = projectSelector as HTMLSelectElement;
      const option = Array.from(selectElement.options).find(opt => 
        opt.text.toLowerCase().includes(projectName.toLowerCase())
      );
      
      if (!option) {
        throw new Error(`Project "${projectName}" not found`);
      }
      
      selectElement.value = option.value;
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Handle dropdown or button-based selectors
      projectSelector.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      // Wait for dropdown to appear
      await this.waitForElement('.project-option, [data-project-name]', 3000);
      
      const projectOption = Array.from(document.querySelectorAll('.project-option, [data-project-name]')).find(opt =>
        opt.textContent?.toLowerCase().includes(projectName.toLowerCase())
      );
      
      if (!projectOption) {
        throw new Error(`Project "${projectName}" not found in dropdown`);
      }
      
      (projectOption as HTMLElement).click();
    }
    
    // Wait for project to load
    await this.waitForProjectLoad();
    
    return {
      success: true,
      data: { projectName },
      correlationId: this.generateCorrelationId(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Select a specific chat conversation
   */
  private async selectChat(chatTitle?: string, chatId?: string): Promise<ChatGPTResponse> {
    if (chatId) {
      // Direct selection by ID
      const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
      if (!chatElement) {
        throw new Error(`Chat with ID "${chatId}" not found`);
      }
      (chatElement as HTMLElement).click();
    } else if (chatTitle) {
      // Selection by title
      const chatElements = document.querySelectorAll('.chat-item, [data-chat-title]');
      const chatElement = Array.from(chatElements).find(el =>
        el.textContent?.toLowerCase().includes(chatTitle.toLowerCase())
      );
      
      if (!chatElement) {
        throw new Error(`Chat with title "${chatTitle}" not found`);
      }
      
      (chatElement as HTMLElement).click();
    } else {
      throw new Error('Either chatTitle or chatId must be provided');
    }
    
    // Wait for chat to load
    await this.waitForChatLoad();
    
    return {
      success: true,
      data: { chatTitle, chatId },
      correlationId: this.generateCorrelationId(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Submit a prompt to ChatGPT
   */
  private async submitPrompt(prompt: string, model?: string): Promise<ChatGPTResponse> {
    // Find the prompt input area
    const promptInput = document.querySelector('textarea[data-testid="prompt-textarea"]') ||
                       document.querySelector('#prompt-textarea') ||
                       document.querySelector('.prompt-input textarea') ||
                       document.querySelector('textarea[placeholder*="message"]');
    
    if (!promptInput) {
      throw new Error('Prompt input not found on page');
    }
    
    // Clear existing content and set new prompt
    (promptInput as HTMLTextAreaElement).value = '';
    (promptInput as HTMLTextAreaElement).focus();
    
    // Simulate typing for better compatibility
    await this.typeText(promptInput as HTMLTextAreaElement, prompt);
    
    // Trigger input events
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));
    promptInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Find and click submit button
    const submitButton = document.querySelector('button[data-testid="send-button"]') ||
                        document.querySelector('button[type="submit"]') ||
                        document.querySelector('.send-button') ||
                        document.querySelector('button[aria-label*="Send"]');
    
    if (!submitButton) {
      throw new Error('Submit button not found');
    }
    
    // Ensure button is enabled
    if ((submitButton as HTMLButtonElement).disabled) {
      throw new Error('Submit button is disabled');
    }
    
    (submitButton as HTMLElement).click();
    
    return {
      success: true,
      data: { prompt, model },
      correlationId: this.generateCorrelationId(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Get the latest response from ChatGPT
   */
  private async getResponse(waitForCompletion: boolean = true): Promise<ChatGPTResponse> {
    if (waitForCompletion) {
      // Wait for response to complete
      await this.waitForResponseCompletion();
    }
    
    // Find the latest assistant message
    const messageElements = document.querySelectorAll('.message, [data-message-role="assistant"]');
    if (messageElements.length === 0) {
      throw new Error('No messages found on page');
    }
    
    const lastMessage = messageElements[messageElements.length - 1];
    const content = this.extractMessageContent(lastMessage);
    
    if (!content) {
      throw new Error('Could not extract response content');
    }
    
    return {
      success: true,
      content: content,
      correlationId: this.generateCorrelationId(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Start a new chat conversation
   */
  private async startNewChat(title?: string): Promise<ChatGPTResponse> {
    // Find new chat button
    const newChatButton = document.querySelector('button[data-testid="new-chat"]') ||
                         document.querySelector('.new-chat-button') ||
                         document.querySelector('button[aria-label*="New chat"]') ||
                         document.querySelector('button:has-text("New chat")');
    
    if (!newChatButton) {
      throw new Error('New chat button not found');
    }
    
    (newChatButton as HTMLElement).click();
    
    // Wait for new chat to initialize
    await this.waitForNewChatReady();
    
    // If title is provided, set it (implementation depends on ChatGPT UI)
    if (title) {
      // This might involve submitting an initial message or using a title field
      // Implementation would depend on current ChatGPT interface
    }
    
    return {
      success: true,
      data: { title },
      correlationId: this.generateCorrelationId(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Export current conversation
   */
  private async exportConversation(format: 'json' | 'markdown' | 'text' = 'markdown'): Promise<ChatGPTResponse> {
    // Extract all messages from the conversation
    const messages = this.extractAllMessages();
    
    let exportedData: string;
    
    switch (format) {
      case 'json':
        exportedData = JSON.stringify(messages, null, 2);
        break;
        
      case 'markdown':
        exportedData = this.convertToMarkdown(messages);
        break;
        
      case 'text':
        exportedData = this.convertToText(messages);
        break;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    return {
      success: true,
      data: exportedData,
      correlationId: this.generateCorrelationId(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Upload a file to ChatGPT
   */
  private async uploadFile(fileData: string, fileName: string, mimeType?: string): Promise<ChatGPTResponse> {
    // Find file upload button or drag area
    const fileInput = document.querySelector('input[type="file"]') ||
                     document.querySelector('[data-testid="file-upload"]');
    
    if (!fileInput) {
      throw new Error('File upload input not found');
    }
    
    // Create file object from data
    const blob = new Blob([fileData], { type: mimeType || 'text/plain' });
    const file = new File([blob], fileName, { type: mimeType });
    
    // Create file list and assign to input
    const dt = new DataTransfer();
    dt.items.add(file);
    (fileInput as HTMLInputElement).files = dt.files;
    
    // Trigger change event
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Wait for upload to complete
    await this.waitForUploadCompletion();
    
    return {
      success: true,
      data: { fileName, size: blob.size },
      correlationId: this.generateCorrelationId(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Utility: Type text naturally into an element
   */
  private async typeText(element: HTMLTextAreaElement, text: string): Promise<void> {
    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      // Small delay to simulate natural typing
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }
  
  /**
   * Utility: Wait for an element to appear
   */
  private async waitForElement(selector: string, timeout: number = 5000): Promise<Element> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Element "${selector}" not found within ${timeout}ms`);
  }
  
  /**
   * Utility: Wait for project to load
   */
  private async waitForProjectLoad(): Promise<void> {
    // Wait for project content to appear
    await this.waitForElement('.chat-list, .project-content, [data-testid="chat-list"]', 5000);
  }
  
  /**
   * Utility: Wait for chat to load
   */
  private async waitForChatLoad(): Promise<void> {
    // Wait for chat messages to appear
    await this.waitForElement('.message, [data-message-role]', 5000);
  }
  
  /**
   * Utility: Wait for response completion
   */
  private async waitForResponseCompletion(): Promise<void> {
    // Wait for any loading indicators to disappear
    const maxWait = 60000; // 60 seconds max
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const loadingIndicator = document.querySelector('.loading, .generating, [data-testid="loading"]');
      if (!loadingIndicator) {
        // Additional wait to ensure completion
        await new Promise(resolve => setTimeout(resolve, 1000));
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error('Response generation timeout');
  }
  
  /**
   * Utility: Wait for new chat to be ready
   */
  private async waitForNewChatReady(): Promise<void> {
    await this.waitForElement('textarea[data-testid="prompt-textarea"], #prompt-textarea', 5000);
  }
  
  /**
   * Utility: Wait for file upload completion
   */
  private async waitForUploadCompletion(): Promise<void> {
    // Wait for upload progress to complete
    const maxWait = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const uploadProgress = document.querySelector('.upload-progress, [data-testid="upload-progress"]');
      if (!uploadProgress) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  /**
   * Utility: Extract content from message element
   */
  private extractMessageContent(messageElement: Element): string {
    // Try different content selectors
    const contentElement = messageElement.querySelector('.message-content') ||
                          messageElement.querySelector('[data-message-content]') ||
                          messageElement.querySelector('.content') ||
                          messageElement;
    
    return contentElement.textContent?.trim() || '';
  }
  
  /**
   * Utility: Extract all messages from conversation
   */
  private extractAllMessages(): Array<{ role: string; content: string; timestamp: Date }> {
    const messageElements = document.querySelectorAll('.message, [data-message-role]');
    const messages: Array<{ role: string; content: string; timestamp: Date }> = [];
    
    messageElements.forEach(element => {
      const role = element.getAttribute('data-message-role') ||
                  (element.classList.contains('user-message') ? 'user' : 'assistant');
      const content = this.extractMessageContent(element);
      
      if (content) {
        messages.push({
          role,
          content,
          timestamp: new Date()
        });
      }
    });
    
    return messages;
  }
  
  /**
   * Utility: Convert messages to markdown format
   */
  private convertToMarkdown(messages: Array<{ role: string; content: string; timestamp: Date }>): string {
    return messages.map(msg => {
      const roleHeader = msg.role === 'user' ? '## User' : '## Assistant';
      return `${roleHeader}\n\n${msg.content}\n\n`;
    }).join('---\n\n');
  }
  
  /**
   * Utility: Convert messages to plain text format
   */
  private convertToText(messages: Array<{ role: string; content: string; timestamp: Date }>): string {
    return messages.map(msg => {
      const roleLabel = msg.role === 'user' ? 'User:' : 'Assistant:';
      return `${roleLabel} ${msg.content}`;
    }).join('\n\n');
  }
  
  /**
   * Utility: Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `chatgpt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}