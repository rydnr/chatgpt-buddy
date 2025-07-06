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
 * @fileoverview ChatGPT application orchestrator
 * @author Semantest Team
 * @module application/chatgpt-application
 */

import { Application, Listen } from 'typescript-eda-application';
import { 
  ProjectSelectedEvent,
  ConversationStartedEvent,
  PromptSubmittedEvent,
  ResponseReceivedEvent,
  ConversationExportedEvent,
  FileUploadedEvent
} from '../domain/events/chatgpt-events';
import { ChatGPTCommunicationAdapter } from '../infrastructure/adapters/chatgpt-communication.adapter';
import { ChatGPTDOMAdapter } from '../infrastructure/adapters/chatgpt-dom.adapter';

/**
 * ChatGPT application configuration
 */
export interface ChatGPTApplicationConfig {
  communicationAdapter: ChatGPTCommunicationAdapter;
  domAdapter: ChatGPTDOMAdapter;
  enableEventLogging?: boolean;
  enablePerformanceMonitoring?: boolean;
  defaultTimeout?: number;
}

/**
 * ChatGPT application orchestrator
 * Handles business logic and coordinates between domain, infrastructure, and external systems
 */
export class ChatGPTApplication extends Application {
  private communicationAdapter: ChatGPTCommunicationAdapter;
  private domAdapter: ChatGPTDOMAdapter;
  private enableEventLogging: boolean;
  private enablePerformanceMonitoring: boolean;
  private defaultTimeout: number;

  constructor(config: ChatGPTApplicationConfig) {
    super();
    this.communicationAdapter = config.communicationAdapter;
    this.domAdapter = config.domAdapter;
    this.enableEventLogging = config.enableEventLogging ?? false;
    this.enablePerformanceMonitoring = config.enablePerformanceMonitoring ?? false;
    this.defaultTimeout = config.defaultTimeout ?? 30000;
  }

  /**
   * Handle project selection events
   */
  @Listen(ProjectSelectedEvent)
  async handleProjectSelected(event: ProjectSelectedEvent): Promise<void> {
    const startTime = this.enablePerformanceMonitoring ? Date.now() : 0;
    
    try {
      this.logEvent('Project selection initiated', event);

      // Use DOM adapter to perform project selection
      const result = await this.domAdapter.selectProject(event.getProjectName());

      if (result.success) {
        // Notify through communication adapter
        await this.communicationAdapter.publishChatGPTEvent(event);
        
        this.logEvent('Project selection completed successfully', event);
      } else {
        this.logError('Project selection failed', result.error, event);
        throw new Error(`Project selection failed: ${result.error}`);
      }

    } catch (error) {
      this.logError('Project selection error', error.message, event);
      throw error;
    } finally {
      if (this.enablePerformanceMonitoring) {
        const duration = Date.now() - startTime;
        this.logPerformance('handleProjectSelected', duration, event.getCorrelationId());
      }
    }
  }

  /**
   * Handle conversation started events
   */
  @Listen(ConversationStartedEvent)
  async handleConversationStarted(event: ConversationStartedEvent): Promise<void> {
    const startTime = this.enablePerformanceMonitoring ? Date.now() : 0;
    
    try {
      this.logEvent('Conversation start initiated', event);

      const title = event.getConversationTitle();
      
      // Use DOM adapter to start new conversation
      const result = await this.domAdapter.startNewChat(title);

      if (result.success) {
        // Notify through communication adapter
        await this.communicationAdapter.publishChatGPTEvent(event);
        
        this.logEvent('Conversation started successfully', event);
      } else {
        this.logError('Conversation start failed', result.error, event);
        throw new Error(`Conversation start failed: ${result.error}`);
      }

    } catch (error) {
      this.logError('Conversation start error', error.message, event);
      throw error;
    } finally {
      if (this.enablePerformanceMonitoring) {
        const duration = Date.now() - startTime;
        this.logPerformance('handleConversationStarted', duration, event.getCorrelationId());
      }
    }
  }

  /**
   * Handle prompt submission events
   */
  @Listen(PromptSubmittedEvent)
  async handlePromptSubmitted(event: PromptSubmittedEvent): Promise<void> {
    const startTime = this.enablePerformanceMonitoring ? Date.now() : 0;
    
    try {
      this.logEvent('Prompt submission initiated', event);

      const prompt = event.getPrompt();
      const model = event.getModel();
      
      // Use DOM adapter to submit prompt
      const result = await this.domAdapter.submitPrompt(prompt, model);

      if (result.success) {
        // Notify through communication adapter
        await this.communicationAdapter.publishChatGPTEvent(event);
        
        this.logEvent('Prompt submitted successfully', event);
      } else {
        this.logError('Prompt submission failed', result.error, event);
        throw new Error(`Prompt submission failed: ${result.error}`);
      }

    } catch (error) {
      this.logError('Prompt submission error', error.message, event);
      throw error;
    } finally {
      if (this.enablePerformanceMonitoring) {
        const duration = Date.now() - startTime;
        this.logPerformance('handlePromptSubmitted', duration, event.getCorrelationId());
      }
    }
  }

  /**
   * Handle response received events
   */
  @Listen(ResponseReceivedEvent)
  async handleResponseReceived(event: ResponseReceivedEvent): Promise<void> {
    const startTime = this.enablePerformanceMonitoring ? Date.now() : 0;
    
    try {
      this.logEvent('Response processing initiated', event);

      // Get response from DOM
      const result = await this.domAdapter.getResponse(true);

      if (result.success) {
        // Update event with actual response content if needed
        // This might involve creating a new event with the complete response
        
        // Notify through communication adapter
        await this.communicationAdapter.publishChatGPTEvent(event);
        
        this.logEvent('Response processed successfully', event);
      } else {
        this.logError('Response processing failed', result.error, event);
        throw new Error(`Response processing failed: ${result.error}`);
      }

    } catch (error) {
      this.logError('Response processing error', error.message, event);
      throw error;
    } finally {
      if (this.enablePerformanceMonitoring) {
        const duration = Date.now() - startTime;
        this.logPerformance('handleResponseReceived', duration, event.getCorrelationId());
      }
    }
  }

  /**
   * Handle conversation export events
   */
  @Listen(ConversationExportedEvent)
  async handleConversationExported(event: ConversationExportedEvent): Promise<void> {
    const startTime = this.enablePerformanceMonitoring ? Date.now() : 0;
    
    try {
      this.logEvent('Conversation export initiated', event);

      const format = event.getExportFormat() as 'json' | 'markdown' | 'text';
      
      // Use DOM adapter to export conversation
      const result = await this.domAdapter.exportConversation(format);

      if (result.success) {
        // Notify through communication adapter
        await this.communicationAdapter.publishChatGPTEvent(event);
        
        this.logEvent('Conversation exported successfully', event);
      } else {
        this.logError('Conversation export failed', result.error, event);
        throw new Error(`Conversation export failed: ${result.error}`);
      }

    } catch (error) {
      this.logError('Conversation export error', error.message, event);
      throw error;
    } finally {
      if (this.enablePerformanceMonitoring) {
        const duration = Date.now() - startTime;
        this.logPerformance('handleConversationExported', duration, event.getCorrelationId());
      }
    }
  }

  /**
   * Handle file upload events
   */
  @Listen(FileUploadedEvent)
  async handleFileUploaded(event: FileUploadedEvent): Promise<void> {
    const startTime = this.enablePerformanceMonitoring ? Date.now() : 0;
    
    try {
      this.logEvent('File upload initiated', event);

      // File upload would need the actual file data
      // This would typically be handled through the communication adapter
      // since the DOM adapter needs the actual file content
      
      // Notify through communication adapter
      await this.communicationAdapter.publishChatGPTEvent(event);
      
      this.logEvent('File upload processed successfully', event);

    } catch (error) {
      this.logError('File upload error', error.message, event);
      throw error;
    } finally {
      if (this.enablePerformanceMonitoring) {
        const duration = Date.now() - startTime;
        this.logPerformance('handleFileUploaded', duration, event.getCorrelationId());
      }
    }
  }

  /**
   * Execute complete ChatGPT workflow
   */
  async executeWorkflow(
    projectName: string,
    prompts: string[],
    options?: {
      chatTitle?: string;
      model?: string;
      delayBetweenPrompts?: number;
      exportFormat?: 'json' | 'markdown' | 'text';
    }
  ): Promise<{
    success: boolean;
    results: any[];
    conversationData?: string;
    error?: string;
  }> {
    try {
      this.logInfo(`Starting ChatGPT workflow: ${projectName}`);

      // Execute through communication adapter
      const results = await this.communicationAdapter.executeConversationWorkflow(
        projectName, 
        prompts, 
        {
          chatTitle: options?.chatTitle,
          model: options?.model,
          delayBetweenPrompts: options?.delayBetweenPrompts
        }
      );

      // Check if all operations succeeded
      const allSuccessful = results.every(result => result.success);

      let conversationData: string | undefined;
      
      // Export conversation if requested and workflow was successful
      if (allSuccessful && options?.exportFormat) {
        const exportResult = await this.domAdapter.exportConversation(options.exportFormat);
        if (exportResult.success) {
          conversationData = exportResult.data?.content;
        }
      }

      this.logInfo(`ChatGPT workflow completed: ${allSuccessful ? 'success' : 'with errors'}`);

      return {
        success: allSuccessful,
        results,
        conversationData,
        error: allSuccessful ? undefined : 'Some operations failed'
      };

    } catch (error) {
      this.logError('Workflow execution failed', error.message);
      return {
        success: false,
        results: [],
        error: error.message
      };
    }
  }

  /**
   * Get application status
   */
  async getStatus(): Promise<{
    connected: boolean;
    domain: string;
    pageInfo: any;
    adaptersStatus: {
      communication: any;
      dom: any;
    };
  }> {
    return {
      connected: this.communicationAdapter.getConnectionStatus().connected,
      domain: this.communicationAdapter.getDomain(),
      pageInfo: this.domAdapter.getPageInfo(),
      adaptersStatus: {
        communication: this.communicationAdapter.getConnectionStatus(),
        dom: {
          isOnChatGPT: this.domAdapter.isOnChatGPTPage(),
          pageInfo: this.domAdapter.getPageInfo()
        }
      }
    };
  }

  /**
   * Private logging methods
   */

  private logEvent(message: string, event?: any): void {
    if (this.enableEventLogging) {
      const correlationId = event?.getCorrelationId?.() || event?.correlationId || 'unknown';
      console.log(`[ChatGPT App] [${correlationId}] ${message}`, event ? { event } : '');
    }
  }

  private logInfo(message: string): void {
    if (this.enableEventLogging) {
      console.info(`[ChatGPT App] ${message}`);
    }
  }

  private logError(message: string, error?: string, event?: any): void {
    const correlationId = event?.getCorrelationId?.() || event?.correlationId || 'unknown';
    console.error(`[ChatGPT App] [${correlationId}] ${message}:`, error);
  }

  private logPerformance(operation: string, duration: number, correlationId: string): void {
    if (this.enablePerformanceMonitoring) {
      console.log(`[ChatGPT App] [Performance] [${correlationId}] ${operation}: ${duration}ms`);
      
      if (duration > 5000) {
        console.warn(`[ChatGPT App] [Performance Warning] ${operation} took ${duration}ms`);
      }
    }
  }
}