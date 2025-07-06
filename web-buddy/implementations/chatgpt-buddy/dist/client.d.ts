import { WebBuddyClient } from '@web-buddy/core';
import { type ChatGPTResponse, type ConversationMessage, type FileUploadResponse } from './messages';
/**
 * ChatGPT-specific client that provides convenient methods
 * Built on top of the generic WebBuddyClient
 *
 * This demonstrates the API layer - developer-friendly wrappers
 */
export declare class ChatGPTBuddyClient {
    private webBuddyClient;
    constructor(webBuddyClient: WebBuddyClient);
    /**
     * Select a ChatGPT project
     * Convenient wrapper around SELECT_PROJECT message
     */
    selectProject(projectName: string, options?: {
        tabId?: number;
    }): Promise<ChatGPTResponse>;
    /**
     * Select a specific chat conversation
     * Can select by title or ID
     */
    selectChat(chatTitle?: string, chatId?: string, options?: {
        tabId?: number;
    }): Promise<ChatGPTResponse>;
    /**
     * Submit a prompt to ChatGPT
     * Convenient wrapper around SUBMIT_PROMPT message
     */
    submitPrompt(prompt: string, model?: string, options?: {
        tabId?: number;
    }): Promise<ChatGPTResponse>;
    /**
     * Get the latest response from ChatGPT
     * Can wait for completion or get current state
     */
    getResponse(waitForCompletion?: boolean, options?: {
        tabId?: number;
    }): Promise<string>;
    /**
     * Start a new chat conversation
     * Optionally provide a title
     */
    startNewChat(title?: string, options?: {
        tabId?: number;
    }): Promise<ChatGPTResponse>;
    /**
     * Export current conversation to various formats
     */
    exportConversation(format?: 'json' | 'markdown' | 'text', options?: {
        tabId?: number;
    }): Promise<string>;
    /**
     * Upload a file to ChatGPT
     */
    uploadFile(fileData: string, fileName: string, mimeType?: string, options?: {
        tabId?: number;
    }): Promise<FileUploadResponse>;
    /**
     * Convenience method: Complete conversation flow
     * Selects project, starts new chat, and submits prompt
     */
    askQuestion(projectName: string, question: string, options?: {
        tabId?: number;
        model?: string;
        chatTitle?: string;
        waitForResponse?: boolean;
    }): Promise<string>;
    /**
     * Convenience method: Multi-turn conversation
     * Handles a series of prompts and responses
     */
    conversation(projectName: string, prompts: string[], options?: {
        tabId?: number;
        model?: string;
        chatTitle?: string;
        delayBetweenPrompts?: number;
    }): Promise<ConversationMessage[]>;
    /**
     * Advanced: Research workflow
     * Combines multiple prompts with structured output
     */
    researchWorkflow(projectName: string, topic: string, options?: {
        tabId?: number;
        includeAnalysis?: boolean;
        includeSummary?: boolean;
        exportFormat?: 'json' | 'markdown' | 'text';
    }): Promise<{
        topic: string;
        research: string;
        analysis?: string;
        summary?: string;
        exportedData?: string;
    }>;
    /**
     * Advanced: Code generation workflow
     * Specialized for programming tasks
     */
    generateCode(projectName: string, specification: string, language: string, options?: {
        tabId?: number;
        includeTests?: boolean;
        includeDocumentation?: boolean;
        codeStyle?: string;
    }): Promise<{
        specification: string;
        language: string;
        code: string;
        tests?: string;
        documentation?: string;
    }>;
    /**
     * Utility: Check if we're on ChatGPT page
     */
    isOnChatGPTPage(options?: {
        tabId?: number;
    }): Promise<boolean>;
    /**
     * Utility method for delays
     */
    private delay;
    /**
     * Access to underlying WebBuddyClient for advanced use cases
     */
    getWebBuddyClient(): WebBuddyClient;
}
//# sourceMappingURL=client.d.ts.map