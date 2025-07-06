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
 * @fileoverview Search failed event for Google domain
 * @author Semantest Team
 * @module domain/events/search-failed
 */

import { Event } from '@typescript-eda/domain';
import { SearchQuery } from '../value-objects/search-query';

/**
 * Error codes for search failures
 */
export enum SearchErrorCode {
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  CAPTCHA_REQUIRED = 'CAPTCHA_REQUIRED',
  PAGE_NOT_LOADED = 'PAGE_NOT_LOADED',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  NAVIGATION_FAILED = 'NAVIGATION_FAILED',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Payload for SearchFailedEvent
 */
export interface SearchFailedPayload {
  readonly searchId: string;
  readonly query: SearchQuery;
  readonly error: string;
  readonly errorCode: SearchErrorCode;
  readonly failedAt: Date;
  readonly tabId?: number;
  readonly clientId?: string;
  readonly retryable?: boolean;
  readonly details?: {
    readonly attemptNumber?: number;
    readonly maxAttempts?: number;
    readonly lastUrl?: string;
    readonly stackTrace?: string;
  };
}

/**
 * Event emitted when a Google search fails
 * Contains error information and recovery hints
 */
export class SearchFailedEvent extends Event {
  /**
   * Creates a SearchFailedEvent
   * @param payload The event payload
   */
  constructor(payload: SearchFailedPayload) {
    super(payload);
  }

  /**
   * Gets the search ID
   */
  get searchId(): string {
    return (this.payload as SearchFailedPayload).searchId;
  }

  /**
   * Gets the search query
   */
  get query(): SearchQuery {
    return (this.payload as SearchFailedPayload).query;
  }

  /**
   * Gets the error message
   */
  get error(): string {
    return (this.payload as SearchFailedPayload).error;
  }

  /**
   * Gets the error code
   */
  get errorCode(): SearchErrorCode {
    return (this.payload as SearchFailedPayload).errorCode;
  }

  /**
   * Gets when the search failed
   */
  get failedAt(): Date {
    return (this.payload as SearchFailedPayload).failedAt;
  }

  /**
   * Gets the tab ID if specified
   */
  get tabId(): number | undefined {
    return (this.payload as SearchFailedPayload).tabId;
  }

  /**
   * Gets the client ID if specified
   */
  get clientId(): string | undefined {
    return (this.payload as SearchFailedPayload).clientId;
  }

  /**
   * Checks if the search can be retried
   */
  get isRetryable(): boolean {
    return (this.payload as SearchFailedPayload).retryable ?? this.determineRetryability();
  }

  /**
   * Gets error details
   */
  get details(): SearchFailedPayload['details'] {
    return (this.payload as SearchFailedPayload).details;
  }

  /**
   * Factory method to create the event
   */
  static create(
    searchId: string,
    query: SearchQuery,
    error: string,
    errorCode: SearchErrorCode = SearchErrorCode.UNKNOWN,
    options?: Partial<Omit<SearchFailedPayload, 'searchId' | 'query' | 'error' | 'errorCode' | 'failedAt'>>
  ): SearchFailedEvent {
    return new SearchFailedEvent({
      searchId,
      query,
      error,
      errorCode,
      failedAt: new Date(),
      ...options
    });
  }

  /**
   * Creates a timeout error event
   */
  static createTimeout(
    searchId: string,
    query: SearchQuery,
    timeoutMs: number,
    options?: Partial<SearchFailedPayload>
  ): SearchFailedEvent {
    return SearchFailedEvent.create(
      searchId,
      query,
      `Search timed out after ${timeoutMs}ms`,
      SearchErrorCode.TIMEOUT,
      {
        retryable: true,
        ...options
      }
    );
  }

  /**
   * Creates a rate limit error event
   */
  static createRateLimited(
    searchId: string,
    query: SearchQuery,
    options?: Partial<SearchFailedPayload>
  ): SearchFailedEvent {
    return SearchFailedEvent.create(
      searchId,
      query,
      'Google has rate limited this request',
      SearchErrorCode.RATE_LIMITED,
      {
        retryable: false,
        ...options
      }
    );
  }

  /**
   * Gets the event name
   */
  static get eventName(): string {
    return 'google.search.failed';
  }

  /**
   * Determines if the error is retryable based on error code
   */
  private determineRetryability(): boolean {
    switch (this.errorCode) {
      case SearchErrorCode.TIMEOUT:
      case SearchErrorCode.NETWORK_ERROR:
      case SearchErrorCode.PAGE_NOT_LOADED:
        return true;
      case SearchErrorCode.RATE_LIMITED:
      case SearchErrorCode.CAPTCHA_REQUIRED:
        return false;
      default:
        return true; // Optimistic retry for unknown errors
    }
  }

  /**
   * Serializes the event for transport
   */
  toJSON(): any {
    const payload = this.payload as SearchFailedPayload;
    return {
      eventName: SearchFailedEvent.eventName,
      payload: {
        ...payload,
        query: payload.query.toJSON(),
        failedAt: payload.failedAt.toISOString()
      }
    };
  }

  /**
   * Deserializes the event from transport format
   */
  static fromJSON(data: any): SearchFailedEvent {
    return new SearchFailedEvent({
      ...data.payload,
      query: new SearchQuery(data.payload.query),
      failedAt: new Date(data.payload.failedAt)
    });
  }
}