import { type MessageHandler, type WebBuddyMessage } from '@web-buddy/core';
import { type SearchResponse } from './messages';
/**
 * Google search handler that implements DOM manipulation for Google pages
 * This runs in the browser content script context
 */
export declare class GoogleSearchHandler implements MessageHandler {
    handle(message: WebBuddyMessage): Promise<SearchResponse>;
    /**
     * Enters search term in Google search box
     * Specification: Should type in search box and trigger search
     */
    private enterSearchTerm;
    /**
     * Extracts search results from Google results page
     * Specification: Should return array of structured result objects
     */
    private getSearchResults;
    /**
     * Gets the first search result
     * Specification: Should return the top result with title, URL, description
     */
    private getFirstResult;
    /**
     * Clicks on a specific search result
     * Specification: Should click the nth result and navigate to target page
     */
    private clickResult;
    /**
     * Extracts the page title from the current page
     */
    private extractPageTitle;
    /**
     * Utility: Wait for element to appear
     */
    private waitForElement;
    /**
     * Utility: Add realistic delay
     */
    private delay;
}
//# sourceMappingURL=handlers.d.ts.map