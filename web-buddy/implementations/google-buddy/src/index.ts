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

/**
 * Google-Buddy - Google Search Automation for Web-Buddy Framework
 * 
 * This package demonstrates the layered architecture of Web-Buddy:
 * 1. Domain Messages: Google-specific message types (ENTER_SEARCH_TERM, etc.)
 * 2. Domain Handlers: Google-specific DOM manipulation logic
 * 3. Client Wrapper: Developer-friendly API built on Web-Buddy Core
 */

// Export client API for developers
export { GoogleBuddyClient } from './client';

// Import for factory functions
import { GoogleBuddyClient } from './client';

// Export domain messages for advanced users
export {
  GoogleMessages,
  type GoogleMessageType,
  EnterSearchTermMessage,
  GetSearchResultsMessage,
  GetFirstResultMessage,
  ClickResultMessage,
  ExtractPageTitleMessage,
  type SearchResult,
  type SearchResponse
} from './messages';

// Export handlers for extension integration
export { GoogleSearchHandler } from './handlers';

// Version information
export const VERSION = '1.0.0';

/**
 * Factory function to create a configured GoogleBuddyClient
 * 
 * @param webBuddyClient - Configured WebBuddyClient instance
 * @returns GoogleBuddyClient instance
 */
import { type WebBuddyClient } from '@web-buddy/core';
export function createGoogleBuddyClient(webBuddyClient: WebBuddyClient): GoogleBuddyClient {
  return new GoogleBuddyClient(webBuddyClient);
}

/**
 * Convenience factory that creates both WebBuddyClient and GoogleBuddyClient
 * 
 * @param config - Configuration for the underlying WebBuddyClient
 * @returns GoogleBuddyClient instance with configured WebBuddyClient
 */
import { createWebBuddyClient, type WebBuddyClientConfig } from '@web-buddy/core';
export function createGoogleAutomationClient(config: WebBuddyClientConfig): GoogleBuddyClient {
  const webBuddyClient = createWebBuddyClient(config);
  return new GoogleBuddyClient(webBuddyClient);
}