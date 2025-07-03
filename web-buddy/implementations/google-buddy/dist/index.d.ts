/**
 * Google-Buddy - Google Search Automation for Web-Buddy Framework
 *
 * This package demonstrates the layered architecture of Web-Buddy:
 * 1. Domain Messages: Google-specific message types (ENTER_SEARCH_TERM, etc.)
 * 2. Domain Handlers: Google-specific DOM manipulation logic
 * 3. Client Wrapper: Developer-friendly API built on Web-Buddy Core
 */
export { GoogleBuddyClient } from './client';
import { GoogleBuddyClient } from './client';
export { GoogleMessages, type GoogleMessageType, EnterSearchTermMessage, GetSearchResultsMessage, GetFirstResultMessage, ClickResultMessage, ExtractPageTitleMessage, type SearchResult, type SearchResponse } from './messages';
export { GoogleSearchHandler } from './handlers';
export declare const VERSION = "1.0.0";
/**
 * Factory function to create a configured GoogleBuddyClient
 *
 * @param webBuddyClient - Configured WebBuddyClient instance
 * @returns GoogleBuddyClient instance
 */
import { type WebBuddyClient } from '@web-buddy/core';
export declare function createGoogleBuddyClient(webBuddyClient: WebBuddyClient): GoogleBuddyClient;
/**
 * Convenience factory that creates both WebBuddyClient and GoogleBuddyClient
 *
 * @param config - Configuration for the underlying WebBuddyClient
 * @returns GoogleBuddyClient instance with configured WebBuddyClient
 */
import { type WebBuddyClientConfig } from '@web-buddy/core';
export declare function createGoogleAutomationClient(config: WebBuddyClientConfig): GoogleBuddyClient;
//# sourceMappingURL=index.d.ts.map