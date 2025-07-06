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
 * @fileoverview Semantest ChatGPT automation package
 * @description Intelligent, contract-driven ChatGPT automation built on TypeScript-EDA
 * @version 2.0.0
 */

// Main client export
export { ChatGPTClient } from './chatgpt.client';
export type { 
  ChatGPTClientConfig, 
  ChatGPTOperationOptions,
  ConversationWorkflowOptions 
} from './chatgpt.client';

// Domain entities
export { 
  ChatGPTConversation, 
  ConversationMessage, 
  ChatGPTProject 
} from './domain/entities';
export type { 
  ChatGPTConversationProps,
  ConversationMessageProps,
  ChatGPTProjectProps,
  MessageRole,
  MessageAttachment,
  ProjectSettings
} from './domain/entities';

// Value objects
export { 
  ConversationId, 
  MessageId, 
  ProjectId 
} from './domain/value-objects';

// Domain events
export { 
  ProjectSelectedEvent,
  ConversationStartedEvent,
  PromptSubmittedEvent,
  ResponseReceivedEvent,
  ConversationExportedEvent,
  FileUploadedEvent,
  createChatGPTEvent
} from './domain/events/chatgpt-events';

// Infrastructure adapters
export { ChatGPTCommunicationAdapter } from './infrastructure/adapters/chatgpt-communication.adapter';
export { ChatGPTDOMAdapter, ChatGPTSelectors } from './infrastructure/adapters/chatgpt-dom.adapter';
export type { 
  ChatGPTOperationResult,
  DOMOperationResult 
} from './infrastructure/adapters';

// Application layer
export { ChatGPTApplication } from './application/chatgpt.application';
export type { ChatGPTApplicationConfig } from './application/chatgpt.application';

// Backward compatibility
export { ChatGPTBuddyClient } from './compatibility/chatgpt-buddy-compat';

// Package metadata
export const CHATGPT_PACKAGE_VERSION = '2.0.0';
export const CHATGPT_PACKAGE_INFO = {
  name: '@semantest/chatgpt.com',
  version: CHATGPT_PACKAGE_VERSION,
  description: 'Semantest ChatGPT domain automation - intelligent conversation and prompt management',
  domain: 'chatgpt.com',
  foundation: 'TypeScript-EDA',
  capabilities: [
    'conversation-management',
    'prompt-submission',
    'response-extraction',
    'project-navigation',
    'file-upload',
    'export-conversation'
  ],
  migration: {
    from: '@web-buddy/implementations/chatgpt-buddy',
    guide: 'https://docs.semantest.com/migration/chatgpt.com'
  }
};

console.log(`✨ ${CHATGPT_PACKAGE_INFO.name} v${CHATGPT_PACKAGE_VERSION} loaded (Built on ${CHATGPT_PACKAGE_INFO.foundation})`);