import { MessageHandler, WebBuddyMessage } from '@web-buddy/core';
import { type ChatGPTResponse } from './messages';
/**
 * ChatGPT-specific message handler
 * Implements the domain logic for ChatGPT automation
 */
export declare class ChatGPTHandler implements MessageHandler {
    handle(message: WebBuddyMessage): Promise<ChatGPTResponse>;
    /**
     * Select a ChatGPT project
     */
    private selectProject;
    /**
     * Select a specific chat conversation
     */
    private selectChat;
    /**
     * Submit a prompt to ChatGPT
     */
    private submitPrompt;
    /**
     * Get the latest response from ChatGPT
     */
    private getResponse;
    /**
     * Start a new chat conversation
     */
    private startNewChat;
    /**
     * Export current conversation
     */
    private exportConversation;
    /**
     * Upload a file to ChatGPT
     */
    private uploadFile;
    /**
     * Utility: Type text naturally into an element
     */
    private typeText;
    /**
     * Utility: Wait for an element to appear
     */
    private waitForElement;
    /**
     * Utility: Wait for project to load
     */
    private waitForProjectLoad;
    /**
     * Utility: Wait for chat to load
     */
    private waitForChatLoad;
    /**
     * Utility: Wait for response completion
     */
    private waitForResponseCompletion;
    /**
     * Utility: Wait for new chat to be ready
     */
    private waitForNewChatReady;
    /**
     * Utility: Wait for file upload completion
     */
    private waitForUploadCompletion;
    /**
     * Utility: Extract content from message element
     */
    private extractMessageContent;
    /**
     * Utility: Extract all messages from conversation
     */
    private extractAllMessages;
    /**
     * Utility: Convert messages to markdown format
     */
    private convertToMarkdown;
    /**
     * Utility: Convert messages to plain text format
     */
    private convertToText;
    /**
     * Utility: Generate correlation ID
     */
    private generateCorrelationId;
}
//# sourceMappingURL=handlers.d.ts.map