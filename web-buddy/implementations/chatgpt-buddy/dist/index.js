"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGPTHandler = exports.ChatGPTBuddyClient = exports.UploadFileMessage = exports.ExportConversationMessage = exports.StartNewChatMessage = exports.GetResponseMessage = exports.SubmitPromptMessage = exports.SelectChatMessage = exports.SelectProjectMessage = exports.ChatGPTMessages = void 0;
exports.createChatGPTBuddyClient = createChatGPTBuddyClient;
/**
 * ChatGPT-Buddy Implementation
 *
 * This package provides ChatGPT-specific automation capabilities
 * built on the Web-Buddy framework. It demonstrates the domain
 * implementation layer of the Web-Buddy architecture.
 */
// Export message types and constants
var messages_1 = require("./messages");
Object.defineProperty(exports, "ChatGPTMessages", { enumerable: true, get: function () { return messages_1.ChatGPTMessages; } });
Object.defineProperty(exports, "SelectProjectMessage", { enumerable: true, get: function () { return messages_1.SelectProjectMessage; } });
Object.defineProperty(exports, "SelectChatMessage", { enumerable: true, get: function () { return messages_1.SelectChatMessage; } });
Object.defineProperty(exports, "SubmitPromptMessage", { enumerable: true, get: function () { return messages_1.SubmitPromptMessage; } });
Object.defineProperty(exports, "GetResponseMessage", { enumerable: true, get: function () { return messages_1.GetResponseMessage; } });
Object.defineProperty(exports, "StartNewChatMessage", { enumerable: true, get: function () { return messages_1.StartNewChatMessage; } });
Object.defineProperty(exports, "ExportConversationMessage", { enumerable: true, get: function () { return messages_1.ExportConversationMessage; } });
Object.defineProperty(exports, "UploadFileMessage", { enumerable: true, get: function () { return messages_1.UploadFileMessage; } });
// Export client wrapper
var client_1 = require("./client");
Object.defineProperty(exports, "ChatGPTBuddyClient", { enumerable: true, get: function () { return client_1.ChatGPTBuddyClient; } });
// Export message handler
var handlers_1 = require("./handlers");
Object.defineProperty(exports, "ChatGPTHandler", { enumerable: true, get: function () { return handlers_1.ChatGPTHandler; } });
// Convenience factory function
const core_1 = require("@web-buddy/core");
const client_2 = require("./client");
/**
 * Create a ChatGPT-Buddy client instance
 *
 * @param serverUrl - URL of the Web-Buddy server
 * @param config - Additional client configuration
 * @returns Configured ChatGPT-Buddy client
 */
function createChatGPTBuddyClient(serverUrl, config) {
    const webBuddyClient = new core_1.WebBuddyClient({
        serverUrl,
        ...config
    });
    return new client_2.ChatGPTBuddyClient(webBuddyClient);
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
//# sourceMappingURL=index.js.map