/**
 * ChatGPT-Buddy Implementation
 *
 * This package provides ChatGPT-specific automation capabilities
 * built on the Web-Buddy framework. It demonstrates the domain
 * implementation layer of the Web-Buddy architecture.
 */
export { ChatGPTMessages, type ChatGPTMessageType, SelectProjectMessage, SelectChatMessage, SubmitPromptMessage, GetResponseMessage, StartNewChatMessage, ExportConversationMessage, UploadFileMessage, type ChatGPTConversation, type ConversationMessage, type ChatGPTProject, type ChatGPTResponse, type FileUploadResponse } from './messages';
export { ChatGPTBuddyClient } from './client';
export { ChatGPTHandler } from './handlers';
import { ChatGPTBuddyClient } from './client';
/**
 * Create a ChatGPT-Buddy client instance
 *
 * @param serverUrl - URL of the Web-Buddy server
 * @param config - Additional client configuration
 * @returns Configured ChatGPT-Buddy client
 */
export declare function createChatGPTBuddyClient(serverUrl: string, config?: {
    apiKey?: string;
    timeout?: number;
    retryAttempts?: number;
}): ChatGPTBuddyClient;
/**
 * Example usage:
 *
 * ```typescript
 * import { createChatGPTBuddyClient } from '@chatgpt-buddy/client';
 *
 * const client = createChatGPTBuddyClient('http://localhost:3000');
 *
 * // Simple usage
 * const response = await client.askQuestion(
 *   'my-project',
 *   'Generate a hello world function in TypeScript'
 * );
 *
 * // Advanced usage
 * const codeResult = await client.generateCode(
 *   'development-project',
 *   'Create a REST API with authentication',
 *   'TypeScript',
 *   {
 *     includeTests: true,
 *     includeDocumentation: true,
 *     codeStyle: 'clean architecture'
 *   }
 * );
 * ```
 */ 
//# sourceMappingURL=index.d.ts.map