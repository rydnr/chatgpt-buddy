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
 * @fileoverview Search query value object for Google domain
 * @author Semantest Team
 * @module domain/value-objects/search-query
 */

import { ValueObject } from '@typescript-eda/domain';

/**
 * Properties for SearchQuery value object
 */
interface SearchQueryProps {
  readonly value: string;
  readonly language?: string;
  readonly region?: string;
  readonly safeSearch?: boolean;
}

/**
 * Represents a search query in the Google domain
 * Encapsulates validation and business rules for search queries
 */
export class SearchQuery extends ValueObject<SearchQueryProps> {
  /**
   * Maximum allowed length for a search query
   */
  private static readonly MAX_QUERY_LENGTH = 2048;

  /**
   * Minimum required length for a search query
   */
  private static readonly MIN_QUERY_LENGTH = 1;

  /**
   * Creates a SearchQuery instance
   * @param props The search query properties
   * @throws {Error} If the query is invalid
   */
  constructor(props: SearchQueryProps) {
    super(props);
    this.validate();
  }

  /**
   * Factory method to create a SearchQuery from a string
   * @param query The search query string
   * @param options Optional configuration
   * @returns SearchQuery instance
   */
  static fromString(
    query: string, 
    options?: Omit<SearchQueryProps, 'value'>
  ): SearchQuery {
    return new SearchQuery({
      value: query.trim(),
      ...options
    });
  }

  /**
   * Gets the query value
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Gets the language preference
   */
  get language(): string | undefined {
    return this.props.language;
  }

  /**
   * Gets the region preference
   */
  get region(): string | undefined {
    return this.props.region;
  }

  /**
   * Gets the safe search setting
   */
  get safeSearch(): boolean {
    return this.props.safeSearch ?? true;
  }

  /**
   * Validates the search query
   * @throws {Error} If validation fails
   */
  private validate(): void {
    if (!this.props.value) {
      throw new Error('Search query cannot be empty');
    }

    if (this.props.value.length < SearchQuery.MIN_QUERY_LENGTH) {
      throw new Error(`Search query must be at least ${SearchQuery.MIN_QUERY_LENGTH} character(s)`);
    }

    if (this.props.value.length > SearchQuery.MAX_QUERY_LENGTH) {
      throw new Error(`Search query cannot exceed ${SearchQuery.MAX_QUERY_LENGTH} characters`);
    }

    // Validate language code if provided
    if (this.props.language && !this.isValidLanguageCode(this.props.language)) {
      throw new Error(`Invalid language code: ${this.props.language}`);
    }

    // Validate region code if provided
    if (this.props.region && !this.isValidRegionCode(this.props.region)) {
      throw new Error(`Invalid region code: ${this.props.region}`);
    }
  }

  /**
   * Checks if a language code is valid (ISO 639-1)
   */
  private isValidLanguageCode(code: string): boolean {
    return /^[a-z]{2}$/i.test(code);
  }

  /**
   * Checks if a region code is valid (ISO 3166-1 alpha-2)
   */
  private isValidRegionCode(code: string): boolean {
    return /^[A-Z]{2}$/i.test(code);
  }

  /**
   * Converts the search query to URL-encoded format
   */
  toUrlEncoded(): string {
    return encodeURIComponent(this.props.value);
  }

  /**
   * Creates a Google search URL for this query
   */
  toGoogleSearchUrl(): string {
    const params = new URLSearchParams();
    params.set('q', this.props.value);
    
    if (this.props.language) {
      params.set('hl', this.props.language);
    }
    
    if (this.props.region) {
      params.set('gl', this.props.region);
    }
    
    if (this.props.safeSearch === false) {
      params.set('safe', 'off');
    }
    
    return `https://www.google.com/search?${params.toString()}`;
  }
}