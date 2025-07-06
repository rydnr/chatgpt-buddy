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
 * @fileoverview Search requested event for Google domain
 * @author Semantest Team
 * @module domain/events/search-requested
 */

import { Event } from '@typescript-eda/domain';
import { SearchQuery } from '../value-objects/search-query';

/**
 * Payload for SearchRequestedEvent
 */
export interface SearchRequestedPayload {
  readonly searchId: string;
  readonly query: SearchQuery;
  readonly tabId?: number;
  readonly clientId?: string;
  readonly requestedAt: Date;
  readonly options?: {
    readonly maxResults?: number;
    readonly includeAds?: boolean;
    readonly timeout?: number;
  };
}

/**
 * Event emitted when a Google search is requested
 * This triggers the search automation process
 */
export class SearchRequestedEvent extends Event {
  /**
   * Creates a SearchRequestedEvent
   * @param payload The event payload
   */
  constructor(payload: SearchRequestedPayload) {
    super(payload);
  }

  /**
   * Gets the search ID
   */
  get searchId(): string {
    return (this.payload as SearchRequestedPayload).searchId;
  }

  /**
   * Gets the search query
   */
  get query(): SearchQuery {
    return (this.payload as SearchRequestedPayload).query;
  }

  /**
   * Gets the tab ID if specified
   */
  get tabId(): number | undefined {
    return (this.payload as SearchRequestedPayload).tabId;
  }

  /**
   * Gets the client ID if specified
   */
  get clientId(): string | undefined {
    return (this.payload as SearchRequestedPayload).clientId;
  }

  /**
   * Gets when the search was requested
   */
  get requestedAt(): Date {
    return (this.payload as SearchRequestedPayload).requestedAt;
  }

  /**
   * Gets search options
   */
  get options(): SearchRequestedPayload['options'] {
    return (this.payload as SearchRequestedPayload).options;
  }

  /**
   * Factory method to create the event
   */
  static create(
    searchId: string,
    query: SearchQuery,
    options?: Omit<SearchRequestedPayload, 'searchId' | 'query' | 'requestedAt'>
  ): SearchRequestedEvent {
    return new SearchRequestedEvent({
      searchId,
      query,
      requestedAt: new Date(),
      ...options
    });
  }

  /**
   * Gets the event name
   */
  static get eventName(): string {
    return 'google.search.requested';
  }

  /**
   * Serializes the event for transport
   */
  toJSON(): any {
    const payload = this.payload as SearchRequestedPayload;
    return {
      eventName: SearchRequestedEvent.eventName,
      payload: {
        ...payload,
        query: payload.query.toJSON(),
        requestedAt: payload.requestedAt.toISOString()
      }
    };
  }

  /**
   * Deserializes the event from transport format
   */
  static fromJSON(data: any): SearchRequestedEvent {
    return new SearchRequestedEvent({
      ...data.payload,
      query: new SearchQuery(data.payload.query),
      requestedAt: new Date(data.payload.requestedAt)
    });
  }
}