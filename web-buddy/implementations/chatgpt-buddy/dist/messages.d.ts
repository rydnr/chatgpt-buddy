import { BaseMessage, type WebBuddyMessage } from '@web-buddy/core';
/**
 * ChatGPT-specific message types
 * These define the domain language for ChatGPT automation
 */
export declare const ChatGPTMessages: {
    readonly SELECT_PROJECT: "SELECT_PROJECT";
    readonly SELECT_CHAT: "SELECT_CHAT";
    readonly SUBMIT_PROMPT: "SUBMIT_PROMPT";
    readonly GET_RESPONSE: "GET_RESPONSE";
    readonly START_NEW_CHAT: "START_NEW_CHAT";
    readonly EXPORT_CONVERSATION: "EXPORT_CONVERSATION";
    readonly UPLOAD_FILE: "UPLOAD_FILE";
};
export type ChatGPTMessageType = typeof ChatGPTMessages[keyof typeof ChatGPTMessages];
/**
 * Select a ChatGPT project
 */
export declare class SelectProjectMessage extends BaseMessage {
    readonly type: "SELECT_PROJECT";
    constructor(projectName: string, correlationId?: string);
    static fromJSON(data: WebBuddyMessage): SelectProjectMessage;
}
/**
 * Select a specific chat conversation
 */
export declare class SelectChatMessage extends BaseMessage {
    readonly type: "SELECT_CHAT";
    constructor(chatTitle?: string, chatId?: string, correlationId?: string);
    static fromJSON(data: WebBuddyMessage): SelectChatMessage;
}
/**
 * Submit a prompt to ChatGPT
 */
export declare class SubmitPromptMessage extends BaseMessage {
    readonly type: "SUBMIT_PROMPT";
    constructor(prompt: string, model?: string, correlationId?: string);
    static fromJSON(data: WebBuddyMessage): SubmitPromptMessage;
}
/**
 * Get the latest response from ChatGPT
 */
export declare class GetResponseMessage extends BaseMessage {
    readonly type: "GET_RESPONSE";
    constructor(waitForCompletion?: boolean, correlationId?: string);
    static fromJSON(data: WebBuddyMessage): GetResponseMessage;
}
/**
 * Start a new chat conversation
 */
export declare class StartNewChatMessage extends BaseMessage {
    readonly type: "START_NEW_CHAT";
    constructor(title?: string, correlationId?: string);
    static fromJSON(data: WebBuddyMessage): StartNewChatMessage;
}
/**
 * Export conversation to various formats
 */
export declare class ExportConversationMessage extends BaseMessage {
    readonly type: "EXPORT_CONVERSATION";
    constructor(format?: 'json' | 'markdown' | 'text', correlationId?: string);
    static fromJSON(data: WebBuddyMessage): ExportConversationMessage;
}
/**
 * Upload a file to ChatGPT
 */
export declare class UploadFileMessage extends BaseMessage {
    readonly type: "UPLOAD_FILE";
    constructor(fileData: string, fileName: string, mimeType?: string, correlationId?: string);
    static fromJSON(data: WebBuddyMessage): UploadFileMessage;
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
//# sourceMappingURL=messages.d.ts.map