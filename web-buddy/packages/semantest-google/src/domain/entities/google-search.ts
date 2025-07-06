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
 * @fileoverview Google search aggregate root entity
 * @author Semantest Team
 * @module domain/entities/google-search
 */

import { Entity } from '@typescript-eda/domain';
import { v4 as uuidv4 } from 'uuid';
import { SearchQuery } from '../value-objects/search-query';
import { SearchResult } from './search-result';

/**
 * Search status enumeration
 */
export enum SearchStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

/**
 * Properties for GoogleSearch aggregate root
 */
export interface GoogleSearchProps {
  readonly id: string;
  readonly query: SearchQuery;
  readonly status: SearchStatus;
  readonly results: SearchResult[];
  readonly totalResults?: number;
  readonly searchTime?: number;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly error?: string;
  readonly metadata?: Record<string, any>;
}

/**
 * Represents a Google search operation aggregate root
 * Manages the lifecycle of a search from request to completion
 */
export class GoogleSearch extends Entity<GoogleSearchProps> {
  /**
   * Creates a GoogleSearch instance
   * @param props The search properties
   */
  constructor(props: GoogleSearchProps) {
    super(props);
    this.validate();
  }

  /**
   * Factory method to create a new search
   */
  static create(query: SearchQuery): GoogleSearch {
    return new GoogleSearch({
      id: uuidv4(),
      query,
      status: SearchStatus.PENDING,
      results: [],
      startedAt: new Date()
    });
  }

  /**
   * Gets the search ID
   */
  get id(): string {
    return this.props.id;
  }

  /**
   * Gets the search query
   */
  get query(): SearchQuery {
    return this.props.query;
  }

  /**
   * Gets the current status
   */
  get status(): SearchStatus {
    return this.props.status;
  }

  /**
   * Gets the search results
   */
  get results(): ReadonlyArray<SearchResult> {
    return [...this.props.results];
  }

  /**
   * Gets the total number of results
   */
  get totalResults(): number | undefined {
    return this.props.totalResults;
  }

  /**
   * Gets the search execution time in milliseconds
   */
  get searchTime(): number | undefined {
    return this.props.searchTime;
  }

  /**
   * Gets when the search started
   */
  get startedAt(): Date | undefined {
    return this.props.startedAt;
  }

  /**
   * Gets when the search completed
   */
  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  /**
   * Gets any error message
   */
  get error(): string | undefined {
    return this.props.error;
  }

  /**
   * Gets additional metadata
   */
  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }

  /**
   * Marks the search as in progress
   */
  markAsInProgress(): GoogleSearch {
    if (this.props.status !== SearchStatus.PENDING) {
      throw new Error(`Cannot start search in status: ${this.props.status}`);
    }

    return new GoogleSearch({
      ...this.props,
      status: SearchStatus.IN_PROGRESS
    });
  }

  /**
   * Completes the search with results
   */
  completeWithResults(
    results: SearchResult[], 
    totalResults?: number,
    searchTime?: number
  ): GoogleSearch {
    if (this.props.status !== SearchStatus.IN_PROGRESS) {
      throw new Error(`Cannot complete search in status: ${this.props.status}`);
    }

    return new GoogleSearch({
      ...this.props,
      status: SearchStatus.COMPLETED,
      results: [...results],
      totalResults: totalResults ?? results.length,
      searchTime,
      completedAt: new Date()
    });
  }

  /**
   * Marks the search as failed
   */
  failWithError(error: string): GoogleSearch {
    if (this.props.status === SearchStatus.COMPLETED) {
      throw new Error('Cannot fail a completed search');
    }

    return new GoogleSearch({
      ...this.props,
      status: SearchStatus.FAILED,
      error,
      completedAt: new Date()
    });
  }

  /**
   * Cancels the search
   */
  cancel(): GoogleSearch {
    if (this.props.status === SearchStatus.COMPLETED || 
        this.props.status === SearchStatus.FAILED) {
      throw new Error(`Cannot cancel search in status: ${this.props.status}`);
    }

    return new GoogleSearch({
      ...this.props,
      status: SearchStatus.CANCELLED,
      completedAt: new Date()
    });
  }

  /**
   * Adds a result to the search
   */
  addResult(result: SearchResult): GoogleSearch {
    if (this.props.status !== SearchStatus.IN_PROGRESS) {
      throw new Error('Can only add results to in-progress searches');
    }

    return new GoogleSearch({
      ...this.props,
      results: [...this.props.results, result]
    });
  }

  /**
   * Updates metadata
   */
  updateMetadata(metadata: Record<string, any>): GoogleSearch {
    return new GoogleSearch({
      ...this.props,
      metadata: {
        ...this.props.metadata,
        ...metadata
      }
    });
  }

  /**
   * Checks if the search is complete
   */
  isComplete(): boolean {
    return this.props.status === SearchStatus.COMPLETED;
  }

  /**
   * Checks if the search failed
   */
  isFailed(): boolean {
    return this.props.status === SearchStatus.FAILED;
  }

  /**
   * Checks if the search is in progress
   */
  isInProgress(): boolean {
    return this.props.status === SearchStatus.IN_PROGRESS;
  }

  /**
   * Gets the duration of the search
   */
  getDuration(): number | undefined {
    if (!this.props.startedAt || !this.props.completedAt) {
      return undefined;
    }
    return this.props.completedAt.getTime() - this.props.startedAt.getTime();
  }

  /**
   * Filters results by domain
   */
  getResultsFromDomain(domain: string): SearchResult[] {
    return this.props.results.filter(result => result.isFromDomain(domain));
  }

  /**
   * Gets non-ad results
   */
  getOrganicResults(): SearchResult[] {
    return this.props.results.filter(result => !result.isAd);
  }

  /**
   * Gets featured results
   */
  getFeaturedResults(): SearchResult[] {
    return this.props.results.filter(result => result.isFeatured);
  }

  /**
   * Validates the search
   */
  private validate(): void {
    if (!this.props.id) {
      throw new Error('Google search must have an ID');
    }

    if (!this.props.query) {
      throw new Error('Google search must have a query');
    }

    if (!this.props.status) {
      throw new Error('Google search must have a status');
    }

    if (!Array.isArray(this.props.results)) {
      throw new Error('Google search must have results array');
    }

    // Validate status transitions
    if (this.props.status === SearchStatus.COMPLETED && this.props.results.length === 0) {
      console.warn('Completed search has no results');
    }
  }

  /**
   * Converts to JSON for serialization
   */
  toJSON(): any {
    return {
      ...this.props,
      query: this.props.query.toJSON(),
      results: this.props.results.map(r => r.toJSON())
    };
  }

  /**
   * Creates from JSON data
   */
  static fromJSON(data: any): GoogleSearch {
    return new GoogleSearch({
      ...data,
      query: new SearchQuery(data.query),
      results: data.results.map((r: any) => SearchResult.fromJSON(r)),
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined
    });
  }
}