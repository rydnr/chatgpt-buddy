/*
 * Copyright 2025-today Semantest Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Google communication adapter for WebSocket messaging
 * @author Semantest Team
 * @module infrastructure/adapters/google-communication-adapter
 */

import { Event } from '@typescript-eda/domain';
import { 
  WebSocketCommunicationAdapter,
  WebSocketConfig,
  WebSocketMessage 
} from '@typescript-eda/infrastructure';
import { 
  SearchRequestedEvent,
  SearchCompletedEvent,
  SearchFailedEvent,
  ResultClickedEvent,
  GoogleEventNames
} from '../../domain/events';
import { SearchQuery } from '../../domain/value-objects/search-query';
import { SearchResult } from '../../domain/entities/search-result';

/**
 * Google-specific communication adapter
 * Extends the base WebSocket adapter with Google domain functionality
 */
export class GoogleCommunicationAdapter extends WebSocketCommunicationAdapter {
  /**
   * Message type constants for Google domain
   */
  private static readonly MESSAGE_TYPES = {
    SEARCH_REQUEST: 'GOOGLE_SEARCH_REQUEST',
    SEARCH_RESPONSE: 'GOOGLE_SEARCH_RESPONSE',
    CLICK_RESULT: 'GOOGLE_CLICK_RESULT',
    EXTRACT_TITLE: 'GOOGLE_EXTRACT_TITLE',
    GET_RESULTS: 'GOOGLE_GET_RESULTS'
  };

  constructor(config: WebSocketConfig) {
    super({
      ...config,
      clientId: config.clientId || 'semantest-google-client'
    });
    
    this.setupGoogleHandlers();
  }

  /**
   * Requests a Google search
   */
  async requestSearch(
    query: string | SearchQuery,
    options?: {
      tabId?: number;
      maxResults?: number;
      includeAds?: boolean;
      timeout?: number;
    }
  ): Promise<SearchCompletedEvent | SearchFailedEvent> {
    const searchQuery = typeof query === 'string' 
      ? SearchQuery.fromString(query) 
      : query;

    const searchId = `google-search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create and send search requested event
    const event = SearchRequestedEvent.create(searchId, searchQuery, {
      tabId: options?.tabId,
      options: {
        maxResults: options?.maxResults,
        includeAds: options?.includeAds,
        timeout: options?.timeout
      }
    });

    // Publish event through WebSocket
    await this.publishEvent(event);

    // Wait for response
    return new Promise((resolve, reject) => {
      const timeout = options?.timeout || 30000;
      const timeoutId = setTimeout(() => {
        reject(new Error(`Search timeout after ${timeout}ms`));
      }, timeout);

      // Listen for completion
      const completeHandler = (message: WebSocketMessage) => {
        if (message.payload.searchId === searchId) {
          clearTimeout(timeoutId);
          this.offMessage(GoogleEventNames.SEARCH_COMPLETED, completeHandler);
          this.offMessage(GoogleEventNames.SEARCH_FAILED, failHandler);
          
          const event = SearchCompletedEvent.fromJSON(message);
          resolve(event);
        }
      };

      // Listen for failure
      const failHandler = (message: WebSocketMessage) => {
        if (message.payload.searchId === searchId) {
          clearTimeout(timeoutId);
          this.offMessage(GoogleEventNames.SEARCH_COMPLETED, completeHandler);
          this.offMessage(GoogleEventNames.SEARCH_FAILED, failHandler);
          
          const event = SearchFailedEvent.fromJSON(message);
          resolve(event);
        }
      };

      this.onMessage(GoogleEventNames.SEARCH_COMPLETED, completeHandler);
      this.onMessage(GoogleEventNames.SEARCH_FAILED, failHandler);
    });
  }

  /**
   * Clicks on a search result
   */
  async clickResult(
    searchId: string,
    result: SearchResult | number,
    options?: {
      tabId?: number;
      openInNewTab?: boolean;
    }
  ): Promise<void> {
    let targetResult: SearchResult;

    if (typeof result === 'number') {
      // Need to get results first
      const results = await this.getSearchResults(searchId, { tabId: options?.tabId });
      if (result >= results.length) {
        throw new Error(`Result index ${result} out of bounds`);
      }
      targetResult = results[result];
    } else {
      targetResult = result;
    }

    // Create and send click event
    const event = ResultClickedEvent.create(searchId, targetResult, {
      tabId: options?.tabId,
      context: {
        openInNewTab: options?.openInNewTab
      }
    });

    await this.publishEvent(event);
  }

  /**
   * Gets current search results
   */
  async getSearchResults(
    searchId: string,
    options?: { tabId?: number }
  ): Promise<SearchResult[]> {
    const response = await this.sendMessage(
      GoogleCommunicationAdapter.MESSAGE_TYPES.GET_RESULTS,
      { searchId },
      {
        correlationId: `get-results-${searchId}`,
        timeout: 5000,
        expectResponse: true
      }
    );

    return response.results.map((r: any) => SearchResult.fromJSON(r));
  }

  /**
   * Extracts page title
   */
  async extractPageTitle(options?: { tabId?: number }): Promise<string> {
    const response = await this.sendMessage(
      GoogleCommunicationAdapter.MESSAGE_TYPES.EXTRACT_TITLE,
      { tabId: options?.tabId },
      {
        timeout: 5000,
        expectResponse: true
      }
    );

    return response.title;
  }

  /**
   * Legacy API support: Send search term
   */
  async enterSearchTerm(
    term: string,
    options?: { tabId?: number }
  ): Promise<void> {
    const searchQuery = SearchQuery.fromString(term);
    const event = await this.requestSearch(searchQuery, {
      tabId: options?.tabId,
      timeout: 10000
    });

    if (event instanceof SearchFailedEvent) {
      throw new Error(event.error);
    }
  }

  /**
   * Sets up Google-specific message handlers
   */
  private setupGoogleHandlers(): void {
    // Handle search requests from extension
    this.on('search_request', async (data: any) => {
      try {
        const query = SearchQuery.fromString(data.query);
        const result = await this.requestSearch(query, data.options);
        
        this.emit('search_result', {
          requestId: data.requestId,
          result: result.toJSON()
        });
      } catch (error) {
        this.emit('search_error', {
          requestId: data.requestId,
          error: error.message
        });
      }
    });

    // Handle click requests
    this.on('click_request', async (data: any) => {
      try {
        await this.clickResult(data.searchId, data.resultIndex, data.options);
        
        this.emit('click_complete', {
          requestId: data.requestId,
          success: true
        });
      } catch (error) {
        this.emit('click_error', {
          requestId: data.requestId,
          error: error.message
        });
      }
    });
  }

  /**
   * Converts legacy message format to events
   */
  async handleLegacyMessage(message: any, options?: { tabId?: number }): Promise<any> {
    const messageType = Object.keys(message)[0];
    const payload = message[messageType];

    switch (messageType) {
      case 'ENTER_SEARCH_TERM':
        await this.enterSearchTerm(payload.searchTerm, options);
        return { success: true };

      case 'GET_SEARCH_RESULTS':
        // Need to get the current search ID somehow
        const searchId = await this.getCurrentSearchId(options?.tabId);
        const results = await this.getSearchResults(searchId, options);
        return { results };

      case 'CLICK_RESULT':
        const currentSearchId = await this.getCurrentSearchId(options?.tabId);
        await this.clickResult(currentSearchId, payload.index, options);
        return { success: true };

      case 'EXTRACT_PAGE_TITLE':
        const title = await this.extractPageTitle(options);
        return { title };

      default:
        throw new Error(`Unknown message type: ${messageType}`);
    }
  }

  /**
   * Gets the current search ID for a tab
   * This would be tracked in the application state
   */
  private async getCurrentSearchId(tabId?: number): Promise<string> {
    // In a real implementation, this would query the application state
    // For now, we'll use a placeholder
    return `current-search-${tabId || 'default'}`;
  }

  /**
   * Batch search support
   */
  async batchSearch(
    queries: string[],
    options?: {
      tabId?: number;
      parallel?: boolean;
      maxResults?: number;
    }
  ): Promise<SearchCompletedEvent[]> {
    if (options?.parallel) {
      const promises = queries.map(query => 
        this.requestSearch(query, {
          tabId: options.tabId,
          maxResults: options.maxResults
        })
      );
      
      const results = await Promise.all(promises);
      return results.filter(r => r instanceof SearchCompletedEvent) as SearchCompletedEvent[];
    } else {
      const results: SearchCompletedEvent[] = [];
      
      for (const query of queries) {
        const result = await this.requestSearch(query, {
          tabId: options?.tabId,
          maxResults: options?.maxResults
        });
        
        if (result instanceof SearchCompletedEvent) {
          results.push(result);
        }
      }
      
      return results;
    }
  }
}