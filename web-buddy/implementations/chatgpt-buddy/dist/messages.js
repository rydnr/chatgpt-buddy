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
exports.UploadFileMessage = exports.ExportConversationMessage = exports.StartNewChatMessage = exports.GetResponseMessage = exports.SubmitPromptMessage = exports.SelectChatMessage = exports.SelectProjectMessage = exports.ChatGPTMessages = void 0;
const core_1 = require("@web-buddy/core");
/**
 * ChatGPT-specific message types
 * These define the domain language for ChatGPT automation
 */
exports.ChatGPTMessages = {
    SELECT_PROJECT: 'SELECT_PROJECT',
    SELECT_CHAT: 'SELECT_CHAT',
    SUBMIT_PROMPT: 'SUBMIT_PROMPT',
    GET_RESPONSE: 'GET_RESPONSE',
    START_NEW_CHAT: 'START_NEW_CHAT',
    EXPORT_CONVERSATION: 'EXPORT_CONVERSATION',
    UPLOAD_FILE: 'UPLOAD_FILE'
};
/**
 * Select a ChatGPT project
 */
class SelectProjectMessage extends core_1.BaseMessage {
    type = exports.ChatGPTMessages.SELECT_PROJECT;
    constructor(projectName, correlationId) {
        super({ projectName }, correlationId, 'chatgpt.com');
    }
    static fromJSON(data) {
        return new SelectProjectMessage(data.payload.projectName, data.correlationId);
    }
}
exports.SelectProjectMessage = SelectProjectMessage;
/**
 * Select a specific chat conversation
 */
class SelectChatMessage extends core_1.BaseMessage {
    type = exports.ChatGPTMessages.SELECT_CHAT;
    constructor(chatTitle, chatId, correlationId) {
        super({ chatTitle, chatId }, correlationId, 'chatgpt.com');
    }
    static fromJSON(data) {
        return new SelectChatMessage(data.payload.chatTitle, data.payload.chatId, data.correlationId);
    }
}
exports.SelectChatMessage = SelectChatMessage;
/**
 * Submit a prompt to ChatGPT
 */
class SubmitPromptMessage extends core_1.BaseMessage {
    type = exports.ChatGPTMessages.SUBMIT_PROMPT;
    constructor(prompt, model, correlationId) {
        super({ prompt, model }, correlationId, 'chatgpt.com');
    }
    static fromJSON(data) {
        return new SubmitPromptMessage(data.payload.prompt, data.payload.model, data.correlationId);
    }
}
exports.SubmitPromptMessage = SubmitPromptMessage;
/**
 * Get the latest response from ChatGPT
 */
class GetResponseMessage extends core_1.BaseMessage {
    type = exports.ChatGPTMessages.GET_RESPONSE;
    constructor(waitForCompletion = true, correlationId) {
        super({ waitForCompletion }, correlationId, 'chatgpt.com');
    }
    static fromJSON(data) {
        return new GetResponseMessage(data.payload.waitForCompletion, data.correlationId);
    }
}
exports.GetResponseMessage = GetResponseMessage;
/**
 * Start a new chat conversation
 */
class StartNewChatMessage extends core_1.BaseMessage {
    type = exports.ChatGPTMessages.START_NEW_CHAT;
    constructor(title, correlationId) {
        super({ title }, correlationId, 'chatgpt.com');
    }
    static fromJSON(data) {
        return new StartNewChatMessage(data.payload.title, data.correlationId);
    }
}
exports.StartNewChatMessage = StartNewChatMessage;
/**
 * Export conversation to various formats
 */
class ExportConversationMessage extends core_1.BaseMessage {
    type = exports.ChatGPTMessages.EXPORT_CONVERSATION;
    constructor(format = 'markdown', correlationId) {
        super({ format }, correlationId, 'chatgpt.com');
    }
    static fromJSON(data) {
        return new ExportConversationMessage(data.payload.format, data.correlationId);
    }
}
exports.ExportConversationMessage = ExportConversationMessage;
/**
 * Upload a file to ChatGPT
 */
class UploadFileMessage extends core_1.BaseMessage {
    type = exports.ChatGPTMessages.UPLOAD_FILE;
    constructor(fileData, fileName, mimeType, correlationId) {
        super({ fileData, fileName, mimeType }, correlationId, 'chatgpt.com');
    }
    static fromJSON(data) {
        return new UploadFileMessage(data.payload.fileData, data.payload.fileName, data.payload.mimeType, data.correlationId);
    }
}
exports.UploadFileMessage = UploadFileMessage;
//# sourceMappingURL=messages.js.map