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
 * @fileoverview Result clicked event for Google domain
 * @author Semantest Team
 * @module domain/events/result-clicked
 */

import { Event } from '@typescript-eda/domain';
import { SearchResult } from '../entities/search-result';

/**
 * Payload for ResultClickedEvent
 */
export interface ResultClickedPayload {
  readonly searchId: string;
  readonly result: SearchResult;
  readonly clickedAt: Date;
  readonly tabId?: number;
  readonly clientId?: string;
  readonly context?: {
    readonly ctrlKey?: boolean;
    readonly shiftKey?: boolean;
    readonly metaKey?: boolean;
    readonly openInNewTab?: boolean;
  };
}

/**
 * Event emitted when a search result is clicked
 * Tracks user interaction with search results
 */
export class ResultClickedEvent extends Event {
  /**
   * Creates a ResultClickedEvent
   * @param payload The event payload
   */
  constructor(payload: ResultClickedPayload) {
    super(payload);
  }

  /**
   * Gets the search ID
   */
  get searchId(): string {
    return (this.payload as ResultClickedPayload).searchId;
  }

  /**
   * Gets the clicked result
   */
  get result(): SearchResult {
    return (this.payload as ResultClickedPayload).result;
  }

  /**
   * Gets when the result was clicked
   */
  get clickedAt(): Date {
    return (this.payload as ResultClickedPayload).clickedAt;
  }

  /**
   * Gets the tab ID if specified
   */
  get tabId(): number | undefined {
    return (this.payload as ResultClickedPayload).tabId;
  }

  /**
   * Gets the client ID if specified
   */
  get clientId(): string | undefined {
    return (this.payload as ResultClickedPayload).clientId;
  }

  /**
   * Gets click context
   */
  get context(): ResultClickedPayload['context'] {
    return (this.payload as ResultClickedPayload).context;
  }

  /**
   * Factory method to create the event
   */
  static create(
    searchId: string,
    result: SearchResult,
    options?: Partial<Omit<ResultClickedPayload, 'searchId' | 'result' | 'clickedAt'>>
  ): ResultClickedEvent {
    return new ResultClickedEvent({
      searchId,
      result,
      clickedAt: new Date(),
      ...options
    });
  }

  /**
   * Gets the event name
   */
  static get eventName(): string {
    return 'google.result.clicked';
  }

  /**
   * Checks if the click will open in a new tab
   */
  willOpenInNewTab(): boolean {
    const ctx = this.context;
    return !!(ctx?.openInNewTab || ctx?.ctrlKey || ctx?.metaKey || ctx?.shiftKey);
  }

  /**
   * Serializes the event for transport
   */
  toJSON(): any {
    const payload = this.payload as ResultClickedPayload;
    return {
      eventName: ResultClickedEvent.eventName,
      payload: {
        ...payload,
        result: payload.result.toJSON(),
        clickedAt: payload.clickedAt.toISOString()
      }
    };
  }

  /**
   * Deserializes the event from transport format
   */
  static fromJSON(data: any): ResultClickedEvent {
    return new ResultClickedEvent({
      ...data.payload,
      result: SearchResult.fromJSON(data.payload.result),
      clickedAt: new Date(data.payload.clickedAt)
    });
  }
}