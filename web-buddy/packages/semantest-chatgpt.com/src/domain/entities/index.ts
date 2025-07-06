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
 * @fileoverview Domain entities index
 */

export { ChatGPTConversation, type ChatGPTConversationProps } from './chatgpt-conversation.entity';
export { ConversationMessage, type ConversationMessageProps, type MessageRole, type MessageAttachment } from './conversation-message.entity';
export { ChatGPTProject, type ChatGPTProjectProps, type ProjectSettings } from './chatgpt-project.entity';