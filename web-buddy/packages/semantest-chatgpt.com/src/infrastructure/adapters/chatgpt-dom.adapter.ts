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
 * @fileoverview ChatGPT DOM manipulation adapter
 * @author Semantest Team
 * @module infrastructure/adapters/chatgpt-dom
 */

/**
 * ChatGPT DOM element selectors
 */
export const ChatGPTSelectors = {
  // Project selectors
  projectSelector: '[data-testid="project-selector"]',
  projectOption: '[data-testid="project-option"]',
  activeProject: '[data-testid="active-project"]',

  // Chat selectors
  chatList: '[data-testid="chat-list"]',
  chatItem: '[data-testid="chat-item"]',
  activeChat: '[data-testid="active-chat"]',
  newChatButton: '[data-testid="new-chat-button"]',

  // Message selectors
  promptTextarea: '[data-testid="prompt-textarea"]',
  submitButton: '[data-testid="submit-button"]',
  messageContainer: '[data-testid="message-container"]',
  userMessage: '[data-testid="user-message"]',
  assistantMessage: '[data-testid="assistant-message"]',
  messageContent: '[data-testid="message-content"]',
  
  // Response selectors
  streamingIndicator: '[data-testid="streaming-indicator"]',
  copyButton: '[data-testid="copy-button"]',
  regenerateButton: '[data-testid="regenerate-button"]',

  // File upload selectors
  fileUploadButton: '[data-testid="file-upload-button"]',
  fileInput: 'input[type="file"]',
  attachmentList: '[data-testid="attachment-list"]',

  // Model selector
  modelSelector: '[data-testid="model-selector"]',
  modelOption: '[data-testid="model-option"]',

  // Export/Share selectors
  shareButton: '[data-testid="share-button"]',
  exportButton: '[data-testid="export-button"]',
  exportOptions: '[data-testid="export-options"]'
} as const;

/**
 * Interface for DOM operation results
 */
export interface DOMOperationResult {
  success: boolean;
  data?: any;
  error?: string;
  element?: Element | null;
}

/**
 * ChatGPT DOM manipulation adapter
 * Provides ChatGPT-specific DOM interaction capabilities
 */
export class ChatGPTDOMAdapter {
  private document: Document;

  constructor(document: Document = window.document) {
    this.document = document;
  }

  /**
   * Wait for element to appear in DOM
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<Element> {
    return new Promise((resolve, reject) => {
      const element = this.document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = this.document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(this.document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Select a ChatGPT project
   */
  async selectProject(projectName: string): Promise<DOMOperationResult> {
    try {
      // Find project selector
      const projectSelector = await this.waitForElement(ChatGPTSelectors.projectSelector);
      
      if (!projectSelector) {
        return { success: false, error: 'Project selector not found' };
      }

      // Click to open project dropdown
      (projectSelector as HTMLElement).click();
      
      // Wait for options to appear
      await this.waitForElement(ChatGPTSelectors.projectOption);
      
      // Find the specific project option
      const projectOptions = this.document.querySelectorAll(ChatGPTSelectors.projectOption);
      const targetProject = Array.from(projectOptions).find(option => 
        option.textContent?.trim().toLowerCase() === projectName.toLowerCase()
      );

      if (!targetProject) {
        return { 
          success: false, 
          error: `Project "${projectName}" not found`,
          data: { availableProjects: Array.from(projectOptions).map(opt => opt.textContent?.trim()) }
        };
      }

      // Click the target project
      (targetProject as HTMLElement).click();

      return { 
        success: true, 
        data: { projectName, element: targetProject },
        element: targetProject
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to select project: ${error.message}` 
      };
    }
  }

  /**
   * Select a chat conversation
   */
  async selectChat(chatTitle?: string, chatId?: string): Promise<DOMOperationResult> {
    try {
      const chatList = await this.waitForElement(ChatGPTSelectors.chatList);
      
      if (!chatList) {
        return { success: false, error: 'Chat list not found' };
      }

      const chatItems = this.document.querySelectorAll(ChatGPTSelectors.chatItem);
      
      let targetChat: Element | undefined;
      
      if (chatId) {
        // Find by ID (data attribute)
        targetChat = Array.from(chatItems).find(item => 
          item.getAttribute('data-chat-id') === chatId
        );
      } else if (chatTitle) {
        // Find by title text
        targetChat = Array.from(chatItems).find(item => 
          item.textContent?.trim().toLowerCase().includes(chatTitle.toLowerCase())
        );
      }

      if (!targetChat) {
        return { 
          success: false, 
          error: `Chat not found: ${chatTitle || chatId}`,
          data: { 
            availableChats: Array.from(chatItems).map(item => ({
              id: item.getAttribute('data-chat-id'),
              title: item.textContent?.trim()
            }))
          }
        };
      }

      // Click the target chat
      (targetChat as HTMLElement).click();

      return { 
        success: true, 
        data: { chatTitle, chatId, element: targetChat },
        element: targetChat
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to select chat: ${error.message}` 
      };
    }
  }

  /**
   * Start a new chat
   */
  async startNewChat(title?: string): Promise<DOMOperationResult> {
    try {
      const newChatButton = await this.waitForElement(ChatGPTSelectors.newChatButton);
      
      if (!newChatButton) {
        return { success: false, error: 'New chat button not found' };
      }

      // Click new chat button
      (newChatButton as HTMLElement).click();

      // If a title is provided, we might need to set it after the first message
      // For now, just return success
      return { 
        success: true, 
        data: { title },
        element: newChatButton
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to start new chat: ${error.message}` 
      };
    }
  }

  /**
   * Submit a prompt to ChatGPT
   */
  async submitPrompt(prompt: string, model?: string): Promise<DOMOperationResult> {
    try {
      // Select model if specified
      if (model) {
        await this.selectModel(model);
      }

      // Find prompt textarea
      const promptTextarea = await this.waitForElement(ChatGPTSelectors.promptTextarea);
      
      if (!promptTextarea) {
        return { success: false, error: 'Prompt textarea not found' };
      }

      // Clear existing content and enter new prompt
      (promptTextarea as HTMLTextAreaElement).value = '';
      (promptTextarea as HTMLTextAreaElement).value = prompt;

      // Trigger input event to enable submit button
      promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Find and click submit button
      const submitButton = await this.waitForElement(ChatGPTSelectors.submitButton);
      
      if (!submitButton) {
        return { success: false, error: 'Submit button not found' };
      }

      // Check if button is enabled
      if ((submitButton as HTMLButtonElement).disabled) {
        return { success: false, error: 'Submit button is disabled' };
      }

      // Click submit
      (submitButton as HTMLElement).click();

      return { 
        success: true, 
        data: { prompt, model },
        element: submitButton
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to submit prompt: ${error.message}` 
      };
    }
  }

  /**
   * Get the latest response from ChatGPT
   */
  async getResponse(waitForCompletion: boolean = true): Promise<DOMOperationResult> {
    try {
      if (waitForCompletion) {
        // Wait for streaming to complete
        await this.waitForResponseCompletion();
      }

      // Get all assistant messages
      const assistantMessages = this.document.querySelectorAll(ChatGPTSelectors.assistantMessage);
      
      if (assistantMessages.length === 0) {
        return { success: false, error: 'No assistant messages found' };
      }

      // Get the latest message
      const latestMessage = assistantMessages[assistantMessages.length - 1];
      const messageContent = latestMessage.querySelector(ChatGPTSelectors.messageContent);
      
      if (!messageContent) {
        return { success: false, error: 'Message content not found' };
      }

      const content = messageContent.textContent || messageContent.innerHTML;

      return { 
        success: true, 
        data: { content },
        element: latestMessage
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to get response: ${error.message}` 
      };
    }
  }

  /**
   * Wait for ChatGPT response to complete
   */
  private async waitForResponseCompletion(timeout: number = 60000): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        const streamingIndicator = this.document.querySelector(ChatGPTSelectors.streamingIndicator);
        if (!streamingIndicator) {
          resolve();
          return;
        }

        setTimeout(checkCompletion, 100);
      };

      checkCompletion();

      setTimeout(() => {
        reject(new Error('Response completion timeout'));
      }, timeout);
    });
  }

  /**
   * Select ChatGPT model
   */
  async selectModel(model: string): Promise<DOMOperationResult> {
    try {
      const modelSelector = this.document.querySelector(ChatGPTSelectors.modelSelector);
      
      if (!modelSelector) {
        return { success: false, error: 'Model selector not found' };
      }

      // Click to open model dropdown
      (modelSelector as HTMLElement).click();
      
      // Wait for options to appear
      await this.waitForElement(ChatGPTSelectors.modelOption);
      
      // Find the specific model option
      const modelOptions = this.document.querySelectorAll(ChatGPTSelectors.modelOption);
      const targetModel = Array.from(modelOptions).find(option => 
        option.textContent?.trim().toLowerCase().includes(model.toLowerCase())
      );

      if (!targetModel) {
        return { 
          success: false, 
          error: `Model "${model}" not found`,
          data: { availableModels: Array.from(modelOptions).map(opt => opt.textContent?.trim()) }
        };
      }

      // Click the target model
      (targetModel as HTMLElement).click();

      return { 
        success: true, 
        data: { model },
        element: targetModel
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to select model: ${error.message}` 
      };
    }
  }

  /**
   * Upload a file to ChatGPT
   */
  async uploadFile(fileData: string, fileName: string, mimeType?: string): Promise<DOMOperationResult> {
    try {
      const fileUploadButton = this.document.querySelector(ChatGPTSelectors.fileUploadButton);
      
      if (!fileUploadButton) {
        return { success: false, error: 'File upload button not found' };
      }

      // Find the hidden file input
      const fileInput = this.document.querySelector(ChatGPTSelectors.fileInput) as HTMLInputElement;
      
      if (!fileInput) {
        return { success: false, error: 'File input not found' };
      }

      // Create a file object from the data
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const file = new File([byteArray], fileName, { type: mimeType });

      // Create a DataTransfer object to simulate file selection
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      // Trigger change event
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      return { 
        success: true, 
        data: { fileName, mimeType, size: file.size },
        element: fileInput
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to upload file: ${error.message}` 
      };
    }
  }

  /**
   * Export conversation
   */
  async exportConversation(format: 'json' | 'markdown' | 'text' = 'markdown'): Promise<DOMOperationResult> {
    try {
      const exportButton = this.document.querySelector(ChatGPTSelectors.exportButton);
      
      if (!exportButton) {
        return { success: false, error: 'Export button not found' };
      }

      // Click export button
      (exportButton as HTMLElement).click();

      // Wait for export options
      await this.waitForElement(ChatGPTSelectors.exportOptions);

      // Find the specific format option
      const exportOptions = this.document.querySelectorAll(`${ChatGPTSelectors.exportOptions} [data-format]`);
      const targetFormat = Array.from(exportOptions).find(option => 
        option.getAttribute('data-format') === format
      );

      if (!targetFormat) {
        return { 
          success: false, 
          error: `Export format "${format}" not found`,
          data: { 
            availableFormats: Array.from(exportOptions).map(opt => opt.getAttribute('data-format'))
          }
        };
      }

      // Click the target format
      (targetFormat as HTMLElement).click();

      // Get the conversation content (this would depend on ChatGPT's actual implementation)
      const conversationContent = this.extractConversationContent(format);

      return { 
        success: true, 
        data: { format, content: conversationContent },
        element: targetFormat
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to export conversation: ${error.message}` 
      };
    }
  }

  /**
   * Extract conversation content from DOM
   */
  private extractConversationContent(format: string): string {
    const messages = this.document.querySelectorAll(`${ChatGPTSelectors.userMessage}, ${ChatGPTSelectors.assistantMessage}`);
    
    const conversationData = Array.from(messages).map(message => {
      const isUser = message.matches(ChatGPTSelectors.userMessage);
      const content = message.querySelector(ChatGPTSelectors.messageContent)?.textContent || '';
      
      return {
        role: isUser ? 'user' : 'assistant',
        content: content.trim()
      };
    });

    switch (format) {
      case 'json':
        return JSON.stringify(conversationData, null, 2);
      
      case 'markdown':
        return conversationData.map(msg => 
          `## ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n${msg.content}\n`
        ).join('\n');
      
      case 'text':
        return conversationData.map(msg => 
          `${msg.role.toUpperCase()}: ${msg.content}`
        ).join('\n\n');
      
      default:
        return JSON.stringify(conversationData, null, 2);
    }
  }

  /**
   * Check if we're on a ChatGPT page
   */
  isOnChatGPTPage(): boolean {
    const url = this.document.location.href;
    const title = this.document.title;
    
    return url.includes('chat.openai.com') || 
           url.includes('chatgpt.com') || 
           title.toLowerCase().includes('chatgpt');
  }

  /**
   * Get current page information
   */
  getPageInfo(): {
    url: string;
    title: string;
    isOnChatGPT: boolean;
    hasActiveChat: boolean;
    currentProject?: string;
  } {
    const activeProject = this.document.querySelector(ChatGPTSelectors.activeProject);
    const activeChat = this.document.querySelector(ChatGPTSelectors.activeChat);
    
    return {
      url: this.document.location.href,
      title: this.document.title,
      isOnChatGPT: this.isOnChatGPTPage(),
      hasActiveChat: !!activeChat,
      currentProject: activeProject?.textContent?.trim()
    };
  }
}