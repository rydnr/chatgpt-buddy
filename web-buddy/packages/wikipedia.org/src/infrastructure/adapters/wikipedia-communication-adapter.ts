/*
 * Copyright (C) 2024-present Semantest, rydnr
 *
 * This file is part of @semantest/wikipedia.org.
 *
 * @semantest/wikipedia.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * @semantest/wikipedia.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with @semantest/wikipedia.org. If not, see <https://www.gnu.org/licenses/>.
 */
import { PrimaryPort } from '@typescript-eda/core';
import { WikipediaApplication } from '../../application/wikipedia-application';
import { ArticleRequestedEvent } from '../../domain/events/article-requested-event';
import { BaseMessage, MessageHandler } from '@web-buddy/core';

interface WikipediaMessage extends BaseMessage {
  action: 'navigate' | 'search' | 'extract' | 'get-sections';
  data?: {
    articleId?: string;
    query?: string;
    sectionId?: string;
  };
}

export class WikipediaCommunicationAdapter extends PrimaryPort<WikipediaApplication> implements MessageHandler {
  constructor(application: WikipediaApplication) {
    super(application);
    this.setupMessageListener();
  }
  
  private setupMessageListener(): void {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message as WikipediaMessage)
          .then(response => sendResponse(response))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
      });
    }
  }
  
  public async handleMessage(message: WikipediaMessage): Promise<any> {
    try {
      switch (message.action) {
        case 'navigate':
          if (message.data?.articleId) {
            const event = ArticleRequestedEvent.fromTitle(message.data.articleId);
            this.application.accept(event);
            return { success: true };
          }
          break;
          
        case 'search':
          if (message.data?.query) {
            // For search, we'll handle it directly in the DOM adapter
            return { success: true, query: message.data.query };
          }
          break;
          
        case 'extract':
          // Trigger article extraction
          return { success: true, action: 'extract' };
          
        case 'get-sections':
          // Get article sections
          return { success: true, action: 'get-sections' };
          
        default:
          throw new Error(`Unknown action: ${message.action}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  public sendArticleData(data: any): void {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'wikipedia-article-data',
        data: data
      });
    }
  }
  
  public sendSearchResults(results: any[]): void {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'wikipedia-search-results',
        data: results
      });
    }
  }
  
  public sendError(error: Error): void {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'wikipedia-error',
        error: error.message
      });
    }
  }
}