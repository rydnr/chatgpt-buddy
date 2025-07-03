/*
                        Google-Buddy

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

import { BaseMessage, type WebBuddyMessage } from '@web-buddy/core';

/**
 * Google-specific message types
 * These define the domain language for Google automation
 */
export const GoogleMessages = {
  ENTER_SEARCH_TERM: 'ENTER_SEARCH_TERM',
  GET_SEARCH_RESULTS: 'GET_SEARCH_RESULTS',
  GET_FIRST_RESULT: 'GET_FIRST_RESULT',
  CLICK_RESULT: 'CLICK_RESULT',
  EXTRACT_PAGE_TITLE: 'EXTRACT_PAGE_TITLE'
} as const;

export type GoogleMessageType = typeof GoogleMessages[keyof typeof GoogleMessages];

/**
 * Enter search term in Google search box
 */
export class EnterSearchTermMessage extends BaseMessage {
  public readonly type = GoogleMessages.ENTER_SEARCH_TERM;
  
  constructor(searchTerm: string, correlationId?: string) {
    super({ searchTerm }, correlationId, 'google.com');
  }
  
  static fromJSON(data: WebBuddyMessage): EnterSearchTermMessage {
    return new EnterSearchTermMessage(
      data.payload.searchTerm,
      data.correlationId
    );
  }
}

/**
 * Get search results from Google results page
 */
export class GetSearchResultsMessage extends BaseMessage {
  public readonly type = GoogleMessages.GET_SEARCH_RESULTS;
  
  constructor(correlationId?: string) {
    super({}, correlationId, 'google.com');
  }
  
  static fromJSON(data: WebBuddyMessage): GetSearchResultsMessage {
    return new GetSearchResultsMessage(data.correlationId);
  }
}

/**
 * Get the first search result
 */
export class GetFirstResultMessage extends BaseMessage {
  public readonly type = GoogleMessages.GET_FIRST_RESULT;
  
  constructor(correlationId?: string) {
    super({}, correlationId, 'google.com');
  }
  
  static fromJSON(data: WebBuddyMessage): GetFirstResultMessage {
    return new GetFirstResultMessage(data.correlationId);
  }
}

/**
 * Click on a specific search result
 */
export class ClickResultMessage extends BaseMessage {
  public readonly type = GoogleMessages.CLICK_RESULT;
  
  constructor(index: number = 0, correlationId?: string) {
    super({ index }, correlationId, 'google.com');
  }
  
  static fromJSON(data: WebBuddyMessage): ClickResultMessage {
    return new ClickResultMessage(
      data.payload.index || 0,
      data.correlationId
    );
  }
}

/**
 * Extract page title from current page
 */
export class ExtractPageTitleMessage extends BaseMessage {
  public readonly type = GoogleMessages.EXTRACT_PAGE_TITLE;
  
  constructor(correlationId?: string) {
    super({}, correlationId, 'google.com');
  }
  
  static fromJSON(data: WebBuddyMessage): ExtractPageTitleMessage {
    return new ExtractPageTitleMessage(data.correlationId);
  }
}

/**
 * Interface for Google search results
 */
export interface SearchResult {
  title: string;
  url: string;
  description: string;
  position?: number;
}

/**
 * Success response for search operations
 */
export interface SearchResponse {
  success: boolean;
  results?: SearchResult[];
  result?: SearchResult;
  title?: string;
  url?: string;
  error?: string;
  correlationId: string;
}