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
 * @fileoverview Google search adapter for browser automation
 * @author Semantest Team
 * @module infrastructure/adapters/google-search-adapter
 */

import { SearchQuery } from '../../domain/value-objects/search-query';
import { SearchResult } from '../../domain/entities/search-result';
import { 
  SearchRequestedEvent, 
  SearchCompletedEvent, 
  SearchFailedEvent,
  SearchErrorCode 
} from '../../domain/events';

/**
 * Browser context interface for DOM manipulation
 */
export interface BrowserContext {
  querySelector(selector: string): Element | null;
  querySelectorAll(selector: string): NodeListOf<Element>;
  getElementById(id: string): Element | null;
  getElementsByClassName(className: string): HTMLCollectionOf<Element>;
  dispatchEvent(element: Element, event: Event): void;
  click(element: Element): void;
  setValue(element: HTMLInputElement, value: string): void;
  submit(form: HTMLFormElement): void;
  waitForElement(selector: string, timeout?: number): Promise<Element>;
  waitForNavigation(timeout?: number): Promise<void>;
  getCurrentUrl(): string;
  getTitle(): string;
}

/**
 * Google search adapter for executing searches in the browser
 * This adapter runs in the content script context
 */
export class GoogleSearchAdapter {
  /**
   * Selector constants for Google search page
   */
  private static readonly SELECTORS = {
    SEARCH_INPUT: 'input[name="q"]',
    SEARCH_FORM: 'form[role="search"], form[action="/search"]',
    SEARCH_BUTTON: 'input[name="btnK"], button[type="submit"]',
    RESULTS_CONTAINER: '#search',
    RESULT_ITEM: '#search .g',
    RESULT_TITLE: 'h3',
    RESULT_LINK: 'a[href]',
    RESULT_DESCRIPTION: '[data-sncf="1"], .VwiC3b',
    AD_INDICATOR: '[data-text-ad], .ads-ad',
    FEATURED_SNIPPET: '.xpdopen',
    TOTAL_RESULTS: '#result-stats',
    SUGGESTED_QUERIES: '.k8XOCe',
    RELATED_SEARCHES: '.s75CSd'
  };

  constructor(private browserContext: BrowserContext) {}

  /**
   * Handles a search requested event
   */
  async handleSearchRequest(event: SearchRequestedEvent): Promise<SearchCompletedEvent | SearchFailedEvent> {
    try {
      // Navigate to Google if not already there
      if (!this.isOnGoogleSearchPage()) {
        await this.navigateToGoogle(event.query);
      }

      // Enter search term
      await this.enterSearchTerm(event.query);

      // Submit search
      await this.submitSearch();

      // Wait for results
      await this.waitForSearchResults();

      // Extract results
      const results = await this.extractSearchResults();
      const metadata = await this.extractSearchMetadata();
      const searchTime = await this.extractSearchTime();

      // Create completed event
      return SearchCompletedEvent.create(
        event.searchId,
        event.query,
        results,
        searchTime,
        {
          tabId: event.tabId,
          clientId: event.clientId,
          metadata
        }
      );

    } catch (error) {
      // Create failed event
      return this.createFailedEvent(event, error);
    }
  }

  /**
   * Clicks on a search result
   */
  async clickSearchResult(result: SearchResult): Promise<void> {
    const resultElements = this.browserContext.querySelectorAll(GoogleSearchAdapter.SELECTORS.RESULT_ITEM);
    
    for (const element of resultElements) {
      const linkElement = element.querySelector(GoogleSearchAdapter.SELECTORS.RESULT_LINK) as HTMLAnchorElement;
      if (linkElement && linkElement.href === result.url) {
        this.browserContext.click(linkElement);
        await this.browserContext.waitForNavigation();
        return;
      }
    }

    throw new Error(`Result with URL ${result.url} not found on page`);
  }

  /**
   * Checks if we're on Google search page
   */
  private isOnGoogleSearchPage(): boolean {
    const url = this.browserContext.getCurrentUrl();
    return url.includes('google.com');
  }

  /**
   * Navigates to Google with the search query
   */
  private async navigateToGoogle(query: SearchQuery): Promise<void> {
    window.location.href = query.toGoogleSearchUrl();
    await this.browserContext.waitForNavigation();
  }

  /**
   * Enters search term in the search box
   */
  private async enterSearchTerm(query: SearchQuery): Promise<void> {
    const searchInput = await this.browserContext.waitForElement(
      GoogleSearchAdapter.SELECTORS.SEARCH_INPUT
    ) as HTMLInputElement;

    if (!searchInput) {
      throw new Error('Search input not found');
    }

    // Clear existing value
    searchInput.value = '';
    searchInput.focus();

    // Simulate typing for realistic behavior
    for (const char of query.value) {
      searchInput.value += char;
      const inputEvent = new Event('input', { bubbles: true });
      this.browserContext.dispatchEvent(searchInput, inputEvent);
      await this.delay(50); // Realistic typing speed
    }
  }

  /**
   * Submits the search form
   */
  private async submitSearch(): Promise<void> {
    const searchForm = this.browserContext.querySelector(
      GoogleSearchAdapter.SELECTORS.SEARCH_FORM
    ) as HTMLFormElement;

    if (searchForm) {
      this.browserContext.submit(searchForm);
    } else {
      // Fallback: press Enter
      const searchInput = this.browserContext.querySelector(
        GoogleSearchAdapter.SELECTORS.SEARCH_INPUT
      ) as HTMLInputElement;
      
      if (searchInput) {
        const enterEvent = new KeyboardEvent('keydown', { 
          key: 'Enter', 
          bubbles: true 
        });
        this.browserContext.dispatchEvent(searchInput, enterEvent);
      }
    }

    await this.browserContext.waitForNavigation();
  }

  /**
   * Waits for search results to load
   */
  private async waitForSearchResults(): Promise<void> {
    await this.browserContext.waitForElement(
      GoogleSearchAdapter.SELECTORS.RESULTS_CONTAINER,
      10000
    );
  }

  /**
   * Extracts search results from the page
   */
  private async extractSearchResults(): Promise<SearchResult[]> {
    const resultElements = this.browserContext.querySelectorAll(
      GoogleSearchAdapter.SELECTORS.RESULT_ITEM
    );
    
    const results: SearchResult[] = [];
    let position = 1;

    for (const element of resultElements) {
      try {
        const result = this.extractResultFromElement(element, position);
        if (result) {
          results.push(result);
          position++;
        }
      } catch (error) {
        console.warn('Failed to extract result from element:', error);
      }
    }

    return results;
  }

  /**
   * Extracts a single result from a DOM element
   */
  private extractResultFromElement(element: Element, position: number): SearchResult | null {
    const titleElement = element.querySelector(GoogleSearchAdapter.SELECTORS.RESULT_TITLE);
    const linkElement = element.querySelector(GoogleSearchAdapter.SELECTORS.RESULT_LINK) as HTMLAnchorElement;
    const descElement = element.querySelector(GoogleSearchAdapter.SELECTORS.RESULT_DESCRIPTION);

    if (!titleElement || !linkElement) {
      return null;
    }

    const title = titleElement.textContent?.trim() || '';
    const url = linkElement.href;
    const description = descElement?.textContent?.trim() || '';

    // Check if it's an ad
    const isAd = !!element.querySelector(GoogleSearchAdapter.SELECTORS.AD_INDICATOR);
    
    // Check if it's a featured snippet
    const isFeatured = element.classList.contains('xpdopen') || 
                      element.closest(GoogleSearchAdapter.SELECTORS.FEATURED_SNIPPET) !== null;

    // Extract display URL
    const displayUrl = this.extractDisplayUrl(element);
    
    // Extract favicon
    const favicon = this.extractFavicon(element);

    return SearchResult.create({
      title,
      url,
      description,
      position,
      displayUrl,
      favicon,
      isAd,
      isFeatured
    });
  }

  /**
   * Extracts the display URL from a result element
   */
  private extractDisplayUrl(element: Element): string | undefined {
    const citeElement = element.querySelector('cite');
    return citeElement?.textContent?.trim();
  }

  /**
   * Extracts the favicon URL from a result element
   */
  private extractFavicon(element: Element): string | undefined {
    const imgElement = element.querySelector('img[src*="favicon"]') as HTMLImageElement;
    return imgElement?.src;
  }

  /**
   * Extracts search metadata
   */
  private async extractSearchMetadata(): Promise<{
    suggestedQueries?: string[];
    relatedSearches?: string[];
    didYouMean?: string;
  }> {
    const metadata: any = {};

    // Extract suggested queries
    const suggestedElements = this.browserContext.querySelectorAll(
      GoogleSearchAdapter.SELECTORS.SUGGESTED_QUERIES
    );
    if (suggestedElements.length > 0) {
      metadata.suggestedQueries = Array.from(suggestedElements)
        .map(el => el.textContent?.trim())
        .filter(Boolean);
    }

    // Extract related searches
    const relatedElements = this.browserContext.querySelectorAll(
      GoogleSearchAdapter.SELECTORS.RELATED_SEARCHES
    );
    if (relatedElements.length > 0) {
      metadata.relatedSearches = Array.from(relatedElements)
        .map(el => el.textContent?.trim())
        .filter(Boolean);
    }

    // Extract "Did you mean?"
    const didYouMeanElement = this.browserContext.querySelector('span.spell_orig');
    if (didYouMeanElement) {
      metadata.didYouMean = didYouMeanElement.textContent?.trim();
    }

    return metadata;
  }

  /**
   * Extracts search execution time
   */
  private async extractSearchTime(): Promise<number> {
    const statsElement = this.browserContext.querySelector(
      GoogleSearchAdapter.SELECTORS.TOTAL_RESULTS
    );
    
    if (statsElement) {
      const text = statsElement.textContent || '';
      const match = text.match(/\(([0-9.]+) seconds?\)/);
      if (match) {
        return Math.round(parseFloat(match[1]) * 1000); // Convert to milliseconds
      }
    }

    return 0; // Default if not found
  }

  /**
   * Creates a failed event from an error
   */
  private createFailedEvent(
    request: SearchRequestedEvent, 
    error: any
  ): SearchFailedEvent {
    let errorCode = SearchErrorCode.UNKNOWN;
    let errorMessage = error.message || 'Unknown error';

    // Determine error code based on error type
    if (error.message?.includes('timeout')) {
      errorCode = SearchErrorCode.TIMEOUT;
    } else if (error.message?.includes('network')) {
      errorCode = SearchErrorCode.NETWORK_ERROR;
    } else if (error.message?.includes('not found')) {
      errorCode = SearchErrorCode.ELEMENT_NOT_FOUND;
    } else if (error.message?.includes('captcha')) {
      errorCode = SearchErrorCode.CAPTCHA_REQUIRED;
    }

    return SearchFailedEvent.create(
      request.searchId,
      request.query,
      errorMessage,
      errorCode,
      {
        tabId: request.tabId,
        clientId: request.clientId,
        details: {
          lastUrl: this.browserContext.getCurrentUrl(),
          stackTrace: error.stack
        }
      }
    );
  }

  /**
   * Utility: Add realistic delay
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}