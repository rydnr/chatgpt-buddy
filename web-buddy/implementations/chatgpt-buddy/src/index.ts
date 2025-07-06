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

/**
 * ChatGPT-Buddy Implementation
 * 
 * This package provides ChatGPT-specific automation capabilities
 * built on the Web-Buddy framework. It demonstrates the domain
 * implementation layer of the Web-Buddy architecture.
 */

// Export message types and constants
export {
  ChatGPTMessages,
  type ChatGPTMessageType,
  SelectProjectMessage,
  SelectChatMessage,
  SubmitPromptMessage,
  GetResponseMessage,
  StartNewChatMessage,
  ExportConversationMessage,
  UploadFileMessage,
  type ChatGPTConversation,
  type ConversationMessage,
  type ChatGPTProject,
  type ChatGPTResponse,
  type FileUploadResponse
} from './messages';

// Export client wrapper
export { ChatGPTBuddyClient } from './client';

// Export message handler
export { ChatGPTHandler } from './handlers';

// Convenience factory function
import { WebBuddyClient } from '@web-buddy/core';
import { ChatGPTBuddyClient } from './client';

/**
 * Create a ChatGPT-Buddy client instance
 * 
 * @param serverUrl - URL of the Web-Buddy server
 * @param config - Additional client configuration
 * @returns Configured ChatGPT-Buddy client
 */
export function createChatGPTBuddyClient(
  serverUrl: string,
  config?: {
    apiKey?: string;
    timeout?: number;
    retryAttempts?: number;
  }
): ChatGPTBuddyClient {
  const webBuddyClient = new WebBuddyClient({
    serverUrl,
    ...config
  });
  
  return new ChatGPTBuddyClient(webBuddyClient);
}

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