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

import { WebBuddyClient } from '@web-buddy/core';
import { ChatGPTBuddyClient } from './client';
import { ChatGPTMessages } from './messages';

// Mock the WebBuddyClient
jest.mock('@web-buddy/core');

describe('ChatGPTBuddyClient', () => {
  let mockWebBuddyClient: jest.Mocked<WebBuddyClient>;
  let chatGPTClient: ChatGPTBuddyClient;

  beforeEach(() => {
    mockWebBuddyClient = {
      sendMessage: jest.fn(),
      sendMessages: jest.fn(),
      generateCorrelationId: jest.fn(() => 'test-correlation-id'),
      getTransportInfo: jest.fn()
    } as any;

    chatGPTClient = new ChatGPTBuddyClient(mockWebBuddyClient);
  });

  describe('selectProject', () => {
    it('should send SELECT_PROJECT message with project name', async () => {
      const projectName = 'test-project';
      const expectedResponse = { success: true, data: { projectName } };
      
      mockWebBuddyClient.sendMessage.mockResolvedValue(expectedResponse);

      const result = await chatGPTClient.selectProject(projectName);

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [ChatGPTMessages.SELECT_PROJECT]: { projectName } },
        { tabId: undefined }
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should pass tabId option when provided', async () => {
      const projectName = 'test-project';
      const tabId = 123;
      
      mockWebBuddyClient.sendMessage.mockResolvedValue({ success: true });

      await chatGPTClient.selectProject(projectName, { tabId });

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [ChatGPTMessages.SELECT_PROJECT]: { projectName } },
        { tabId }
      );
    });
  });

  describe('submitPrompt', () => {
    it('should send SUBMIT_PROMPT message with prompt text', async () => {
      const prompt = 'Test prompt';
      const expectedResponse = { success: true, data: { prompt } };
      
      mockWebBuddyClient.sendMessage.mockResolvedValue(expectedResponse);

      const result = await chatGPTClient.submitPrompt(prompt);

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [ChatGPTMessages.SUBMIT_PROMPT]: { prompt, model: undefined } },
        { tabId: undefined }
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should include model when provided', async () => {
      const prompt = 'Test prompt';
      const model = 'gpt-4';
      
      mockWebBuddyClient.sendMessage.mockResolvedValue({ success: true });

      await chatGPTClient.submitPrompt(prompt, model);

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [ChatGPTMessages.SUBMIT_PROMPT]: { prompt, model } },
        { tabId: undefined }
      );
    });
  });

  describe('getResponse', () => {
    it('should send GET_RESPONSE message and return content', async () => {
      const responseContent = 'AI response content';
      const mockResponse = { 
        success: true, 
        content: responseContent 
      };
      
      mockWebBuddyClient.sendMessage.mockResolvedValue(mockResponse);

      const result = await chatGPTClient.getResponse();

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [ChatGPTMessages.GET_RESPONSE]: { waitForCompletion: true } },
        { tabId: undefined }
      );
      expect(result).toBe(responseContent);
    });

    it('should return empty string when no content in response', async () => {
      mockWebBuddyClient.sendMessage.mockResolvedValue({ success: true });

      const result = await chatGPTClient.getResponse();

      expect(result).toBe('');
    });

    it('should pass waitForCompletion parameter', async () => {
      mockWebBuddyClient.sendMessage.mockResolvedValue({ success: true, content: 'test' });

      await chatGPTClient.getResponse(false);

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [ChatGPTMessages.GET_RESPONSE]: { waitForCompletion: false } },
        { tabId: undefined }
      );
    });
  });

  describe('askQuestion', () => {
    it('should orchestrate complete conversation flow', async () => {
      const projectName = 'test-project';
      const question = 'What is TypeScript?';
      const expectedResponse = 'TypeScript is a programming language...';

      // Mock all the method calls
      mockWebBuddyClient.sendMessage
        .mockResolvedValueOnce({ success: true }) // selectProject
        .mockResolvedValueOnce({ success: true }) // submitPrompt
        .mockResolvedValueOnce({ success: true, content: expectedResponse }); // getResponse

      const result = await chatGPTClient.askQuestion(projectName, question);

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledTimes(3);
      expect(mockWebBuddyClient.sendMessage).toHaveBeenNthCalledWith(1,
        { [ChatGPTMessages.SELECT_PROJECT]: { projectName } },
        {}
      );
      expect(mockWebBuddyClient.sendMessage).toHaveBeenNthCalledWith(2,
        { [ChatGPTMessages.SUBMIT_PROMPT]: { prompt: question, model: undefined } },
        {}
      );
      expect(mockWebBuddyClient.sendMessage).toHaveBeenNthCalledWith(3,
        { [ChatGPTMessages.GET_RESPONSE]: { waitForCompletion: true } },
        {}
      );
      expect(result).toBe(expectedResponse);
    });

    it('should start new chat when chatTitle is provided', async () => {
      const projectName = 'test-project';
      const question = 'Test question';
      const chatTitle = 'Test Chat';

      mockWebBuddyClient.sendMessage.mockResolvedValue({ success: true, content: 'response' });

      await chatGPTClient.askQuestion(projectName, question, { chatTitle });

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [ChatGPTMessages.START_NEW_CHAT]: { title: chatTitle } },
        { tabId: undefined }
      );
    });

    it('should not wait for response when waitForResponse is false', async () => {
      const projectName = 'test-project';
      const question = 'Test question';

      mockWebBuddyClient.sendMessage.mockResolvedValue({ success: true });

      const result = await chatGPTClient.askQuestion(projectName, question, { 
        waitForResponse: false 
      });

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledTimes(2); // Only selectProject and submitPrompt
      expect(result).toBe('');
    });
  });

  describe('startNewChat', () => {
    it('should send START_NEW_CHAT message', async () => {
      const title = 'New Chat Title';
      const expectedResponse = { success: true, data: { title } };
      
      mockWebBuddyClient.sendMessage.mockResolvedValue(expectedResponse);

      const result = await chatGPTClient.startNewChat(title);

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [ChatGPTMessages.START_NEW_CHAT]: { title } },
        { tabId: undefined }
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('exportConversation', () => {
    it('should send EXPORT_CONVERSATION message and return data', async () => {
      const exportData = 'Exported conversation data';
      const format = 'markdown';
      const mockResponse = { 
        success: true, 
        data: exportData 
      };
      
      mockWebBuddyClient.sendMessage.mockResolvedValue(mockResponse);

      const result = await chatGPTClient.exportConversation(format);

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [ChatGPTMessages.EXPORT_CONVERSATION]: { format } },
        { tabId: undefined }
      );
      expect(result).toBe(exportData);
    });

    it('should default to markdown format', async () => {
      mockWebBuddyClient.sendMessage.mockResolvedValue({ success: true, data: 'test' });

      await chatGPTClient.exportConversation();

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [ChatGPTMessages.EXPORT_CONVERSATION]: { format: 'markdown' } },
        { tabId: undefined }
      );
    });
  });

  describe('getWebBuddyClient', () => {
    it('should return the underlying WebBuddyClient instance', () => {
      const result = chatGPTClient.getWebBuddyClient();
      expect(result).toBe(mockWebBuddyClient);
    });
  });
});

describe('Factory function', () => {
  it('should create ChatGPTBuddyClient with correct configuration', () => {
    const { createChatGPTBuddyClient } = require('./index');
    
    const serverUrl = 'http://localhost:3000';
    const config = {
      apiKey: 'test-key',
      timeout: 5000
    };

    const client = createChatGPTBuddyClient(serverUrl, config);

    expect(client).toBeInstanceOf(ChatGPTBuddyClient);
  });
});