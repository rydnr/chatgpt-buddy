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
 * @fileoverview Search completed event for Google domain
 * @author Semantest Team
 * @module domain/events/search-completed
 */

import { Event } from '@typescript-eda/domain';
import { SearchResult } from '../entities/search-result';
import { SearchQuery } from '../value-objects/search-query';

/**
 * Payload for SearchCompletedEvent
 */
export interface SearchCompletedPayload {
  readonly searchId: string;
  readonly query: SearchQuery;
  readonly results: SearchResult[];
  readonly totalResults: number;
  readonly searchTime: number;
  readonly completedAt: Date;
  readonly tabId?: number;
  readonly clientId?: string;
  readonly metadata?: {
    readonly suggestedQueries?: string[];
    readonly relatedSearches?: string[];
    readonly didYouMean?: string;
  };
}

/**
 * Event emitted when a Google search is successfully completed
 * Contains the search results and metadata
 */
export class SearchCompletedEvent extends Event {
  /**
   * Creates a SearchCompletedEvent
   * @param payload The event payload
   */
  constructor(payload: SearchCompletedPayload) {
    super(payload);
  }

  /**
   * Gets the search ID
   */
  get searchId(): string {
    return (this.payload as SearchCompletedPayload).searchId;
  }

  /**
   * Gets the search query
   */
  get query(): SearchQuery {
    return (this.payload as SearchCompletedPayload).query;
  }

  /**
   * Gets the search results
   */
  get results(): ReadonlyArray<SearchResult> {
    return (this.payload as SearchCompletedPayload).results;
  }

  /**
   * Gets the total number of results
   */
  get totalResults(): number {
    return (this.payload as SearchCompletedPayload).totalResults;
  }

  /**
   * Gets the search execution time in milliseconds
   */
  get searchTime(): number {
    return (this.payload as SearchCompletedPayload).searchTime;
  }

  /**
   * Gets when the search completed
   */
  get completedAt(): Date {
    return (this.payload as SearchCompletedPayload).completedAt;
  }

  /**
   * Gets the tab ID if specified
   */
  get tabId(): number | undefined {
    return (this.payload as SearchCompletedPayload).tabId;
  }

  /**
   * Gets the client ID if specified
   */
  get clientId(): string | undefined {
    return (this.payload as SearchCompletedPayload).clientId;
  }

  /**
   * Gets search metadata
   */
  get metadata(): SearchCompletedPayload['metadata'] {
    return (this.payload as SearchCompletedPayload).metadata;
  }

  /**
   * Factory method to create the event
   */
  static create(
    searchId: string,
    query: SearchQuery,
    results: SearchResult[],
    searchTime: number,
    options?: Partial<Omit<SearchCompletedPayload, 'searchId' | 'query' | 'results' | 'searchTime' | 'completedAt'>>
  ): SearchCompletedEvent {
    return new SearchCompletedEvent({
      searchId,
      query,
      results,
      searchTime,
      totalResults: options?.totalResults ?? results.length,
      completedAt: new Date(),
      ...options
    });
  }

  /**
   * Gets the event name
   */
  static get eventName(): string {
    return 'google.search.completed';
  }

  /**
   * Gets organic (non-ad) results
   */
  getOrganicResults(): SearchResult[] {
    return this.results.filter(result => !result.isAd);
  }

  /**
   * Gets featured results
   */
  getFeaturedResults(): SearchResult[] {
    return this.results.filter(result => result.isFeatured);
  }

  /**
   * Gets results from a specific domain
   */
  getResultsFromDomain(domain: string): SearchResult[] {
    return this.results.filter(result => result.isFromDomain(domain));
  }

  /**
   * Serializes the event for transport
   */
  toJSON(): any {
    const payload = this.payload as SearchCompletedPayload;
    return {
      eventName: SearchCompletedEvent.eventName,
      payload: {
        ...payload,
        query: payload.query.toJSON(),
        results: payload.results.map(r => r.toJSON()),
        completedAt: payload.completedAt.toISOString()
      }
    };
  }

  /**
   * Deserializes the event from transport format
   */
  static fromJSON(data: any): SearchCompletedEvent {
    return new SearchCompletedEvent({
      ...data.payload,
      query: new SearchQuery(data.payload.query),
      results: data.payload.results.map((r: any) => SearchResult.fromJSON(r)),
      completedAt: new Date(data.payload.completedAt)
    });
  }
}