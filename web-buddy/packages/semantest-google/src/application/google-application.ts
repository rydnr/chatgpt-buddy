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
 * @fileoverview Google application following TypeScript-EDA patterns
 * @author Semantest Team
 * @module application/google-application
 */

import { Application, Listen } from '@typescript-eda/application';
import { Event } from '@typescript-eda/domain';
import { 
  SearchRequestedEvent,
  SearchCompletedEvent,
  SearchFailedEvent,
  ResultClickedEvent,
  GoogleEventNames
} from '../domain/events';
import { GoogleSearch, SearchStatus } from '../domain/entities/google-search';
import { SearchResult } from '../domain/entities/search-result';
import { GoogleSearchAdapter } from '../infrastructure/adapters/google-search-adapter';
import { GoogleCommunicationAdapter } from '../infrastructure/adapters/google-communication-adapter';

/**
 * Application configuration
 */
export interface GoogleApplicationConfig {
  searchAdapter?: GoogleSearchAdapter;
  communicationAdapter?: GoogleCommunicationAdapter;
  maxConcurrentSearches?: number;
  defaultTimeout?: number;
}

/**
 * Google search application
 * Orchestrates the search workflow using event-driven architecture
 */
export class GoogleApplication extends Application {
  private readonly activeSearches = new Map<string, GoogleSearch>();
  private readonly searchAdapter: GoogleSearchAdapter;
  private readonly communicationAdapter?: GoogleCommunicationAdapter;
  private readonly maxConcurrentSearches: number;
  private readonly defaultTimeout: number;

  constructor(config: GoogleApplicationConfig = {}) {
    super();
    
    this.searchAdapter = config.searchAdapter || this.createDefaultSearchAdapter();
    this.communicationAdapter = config.communicationAdapter;
    this.maxConcurrentSearches = config.maxConcurrentSearches || 5;
    this.defaultTimeout = config.defaultTimeout || 30000;
  }

  /**
   * Handles search requested events
   */
  @Listen(SearchRequestedEvent)
  async handleSearchRequested(event: SearchRequestedEvent): Promise<void> {
    try {
      // Check concurrent search limit
      if (this.activeSearches.size >= this.maxConcurrentSearches) {
        await this.emitSearchFailed(
          event,
          'Maximum concurrent searches reached',
          'RATE_LIMITED'
        );
        return;
      }

      // Create search entity
      const search = GoogleSearch.create(event.query);
      this.activeSearches.set(search.id, search);

      // Mark as in progress
      const inProgressSearch = search.markAsInProgress();
      this.activeSearches.set(search.id, inProgressSearch);

      // Execute search with timeout
      const timeoutMs = event.options?.timeout || this.defaultTimeout;
      const searchPromise = this.searchAdapter.handleSearchRequest(event);
      
      const result = await this.withTimeout(searchPromise, timeoutMs);

      // Handle result
      if (result instanceof SearchCompletedEvent) {
        await this.handleSearchSuccess(event.searchId, result);
      } else if (result instanceof SearchFailedEvent) {
        await this.handleSearchFailure(event.searchId, result);
      }

    } catch (error) {
      await this.emitSearchFailed(
        event,
        error.message || 'Unknown error',
        'UNKNOWN'
      );
    } finally {
      // Clean up
      this.activeSearches.delete(event.searchId);
    }
  }

  /**
   * Handles result click events
   */
  @Listen(ResultClickedEvent)
  async handleResultClicked(event: ResultClickedEvent): Promise<void> {
    try {
      // Find the search
      const search = this.activeSearches.get(event.searchId);
      if (!search) {
        throw new Error(`Search ${event.searchId} not found`);
      }

      // Verify the result belongs to this search
      const resultExists = search.results.some(r => r.id === event.result.id);
      if (!resultExists) {
        throw new Error(`Result ${event.result.id} not found in search ${event.searchId}`);
      }

      // Execute click
      await this.searchAdapter.clickSearchResult(event.result);

      // Emit success event
      await this.emit(new Event({
        type: 'google.result.click.success',
        searchId: event.searchId,
        resultId: event.result.id,
        url: event.result.url,
        timestamp: new Date()
      }));

    } catch (error) {
      // Emit failure event
      await this.emit(new Event({
        type: 'google.result.click.failed',
        searchId: event.searchId,
        resultId: event.result.id,
        error: error.message,
        timestamp: new Date()
      }));
    }
  }

  /**
   * Handles search success
   */
  private async handleSearchSuccess(
    searchId: string, 
    event: SearchCompletedEvent
  ): Promise<void> {
    const search = this.activeSearches.get(searchId);
    if (!search) return;

    // Update search entity
    const completedSearch = search.completeWithResults(
      event.results,
      event.totalResults,
      event.searchTime
    );
    
    this.activeSearches.set(searchId, completedSearch);

    // Emit completed event
    await this.emit(event);

    // If communication adapter is available, notify through WebSocket
    if (this.communicationAdapter) {
      await this.communicationAdapter.publishEvent(event);
    }
  }

  /**
   * Handles search failure
   */
  private async handleSearchFailure(
    searchId: string,
    event: SearchFailedEvent
  ): Promise<void> {
    const search = this.activeSearches.get(searchId);
    if (!search) return;

    // Update search entity
    const failedSearch = search.failWithError(event.error);
    this.activeSearches.set(searchId, failedSearch);

    // Emit failed event
    await this.emit(event);

    // If communication adapter is available, notify through WebSocket
    if (this.communicationAdapter) {
      await this.communicationAdapter.publishEvent(event);
    }
  }

  /**
   * Emits a search failed event
   */
  private async emitSearchFailed(
    request: SearchRequestedEvent,
    error: string,
    errorCode: string
  ): Promise<void> {
    const failedEvent = SearchFailedEvent.create(
      request.searchId,
      request.query,
      error,
      errorCode as any,
      {
        tabId: request.tabId,
        clientId: request.clientId
      }
    );

    await this.emit(failedEvent);

    if (this.communicationAdapter) {
      await this.communicationAdapter.publishEvent(failedEvent);
    }
  }

  /**
   * Gets active searches
   */
  getActiveSearches(): ReadonlyMap<string, GoogleSearch> {
    return new Map(this.activeSearches);
  }

  /**
   * Gets a specific search
   */
  getSearch(searchId: string): GoogleSearch | undefined {
    return this.activeSearches.get(searchId);
  }

  /**
   * Cancels an active search
   */
  async cancelSearch(searchId: string): Promise<void> {
    const search = this.activeSearches.get(searchId);
    if (!search) {
      throw new Error(`Search ${searchId} not found`);
    }

    const cancelledSearch = search.cancel();
    this.activeSearches.set(searchId, cancelledSearch);

    // Emit cancelled event
    await this.emit(new Event({
      type: 'google.search.cancelled',
      searchId,
      timestamp: new Date()
    }));

    // Clean up
    this.activeSearches.delete(searchId);
  }

  /**
   * Clears all completed or failed searches
   */
  clearInactiveSearches(): void {
    for (const [id, search] of this.activeSearches) {
      if (search.isComplete() || search.isFailed()) {
        this.activeSearches.delete(id);
      }
    }
  }

  /**
   * Creates default search adapter
   */
  private createDefaultSearchAdapter(): GoogleSearchAdapter {
    // In a real implementation, this would create an adapter
    // with proper browser context injection
    return new GoogleSearchAdapter({
      querySelector: (selector: string) => document.querySelector(selector),
      querySelectorAll: (selector: string) => document.querySelectorAll(selector),
      getElementById: (id: string) => document.getElementById(id),
      getElementsByClassName: (className: string) => document.getElementsByClassName(className),
      dispatchEvent: (element: Element, event: Event) => element.dispatchEvent(event),
      click: (element: Element) => (element as HTMLElement).click(),
      setValue: (element: HTMLInputElement, value: string) => { element.value = value; },
      submit: (form: HTMLFormElement) => form.submit(),
      waitForElement: async (selector: string, timeout?: number) => {
        // Simplified implementation
        const element = document.querySelector(selector);
        if (element) return element;
        throw new Error(`Element ${selector} not found`);
      },
      waitForNavigation: async () => {
        // Simplified implementation
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      getCurrentUrl: () => window.location.href,
      getTitle: () => document.title
    });
  }

  /**
   * Utility: Execute with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Gets application statistics
   */
  getStatistics(): {
    activeSearches: number;
    totalSearches: number;
    successRate: number;
  } {
    let totalSearches = 0;
    let successfulSearches = 0;

    for (const search of this.activeSearches.values()) {
      totalSearches++;
      if (search.isComplete()) {
        successfulSearches++;
      }
    }

    return {
      activeSearches: this.activeSearches.size,
      totalSearches,
      successRate: totalSearches > 0 ? successfulSearches / totalSearches : 0
    };
  }
}