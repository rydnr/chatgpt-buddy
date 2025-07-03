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
import { GoogleMessages } from './messages';
/**
 * Google-specific client that provides convenient methods
 * Built on top of the generic WebBuddyClient
 *
 * This demonstrates the API layer - developer-friendly wrappers
 */
export class GoogleBuddyClient {
    webBuddyClient;
    constructor(webBuddyClient) {
        this.webBuddyClient = webBuddyClient;
    }
    /**
     * Enter search term in Google search box
     * Convenient wrapper around ENTER_SEARCH_TERM message
     */
    async enterSearchTerm(term, options) {
        return this.webBuddyClient.sendMessage({
            [GoogleMessages.ENTER_SEARCH_TERM]: { searchTerm: term }
        }, {
            tabId: options?.tabId
        });
    }
    /**
     * Get all search results from current page
     * Convenient wrapper around GET_SEARCH_RESULTS message
     */
    async getSearchResults(options) {
        const response = await this.webBuddyClient.sendMessage({
            [GoogleMessages.GET_SEARCH_RESULTS]: {}
        }, {
            tabId: options?.tabId
        });
        return response.results || [];
    }
    /**
     * Get the first search result
     * Convenient wrapper around GET_FIRST_RESULT message
     */
    async getFirstResult(options) {
        const response = await this.webBuddyClient.sendMessage({
            [GoogleMessages.GET_FIRST_RESULT]: {}
        }, {
            tabId: options?.tabId
        });
        if (!response.result) {
            throw new Error('No first result found');
        }
        return response.result;
    }
    /**
     * Click on a specific search result
     * Convenient wrapper around CLICK_RESULT message
     */
    async clickResult(index = 0, options) {
        const response = await this.webBuddyClient.sendMessage({
            [GoogleMessages.CLICK_RESULT]: { index }
        }, {
            tabId: options?.tabId
        });
        return {
            success: response.success,
            url: response.url || ''
        };
    }
    /**
     * Extract page title from current page
     * Convenient wrapper around EXTRACT_PAGE_TITLE message
     */
    async extractPageTitle(options) {
        const response = await this.webBuddyClient.sendMessage({
            [GoogleMessages.EXTRACT_PAGE_TITLE]: {}
        }, {
            tabId: options?.tabId
        });
        return response.title || '';
    }
    /**
     * Convenience method: Complete search flow
     * Combines multiple operations into a single method
     */
    async search(term, options) {
        await this.enterSearchTerm(term, options);
        return this.getSearchResults(options);
    }
    /**
     * Convenience method: Search and click first result
     * Common workflow for "I'm feeling lucky" behavior
     */
    async searchAndClickFirst(term, options) {
        await this.enterSearchTerm(term, options);
        return this.clickResult(0, options);
    }
    /**
     * Advanced: Batch search multiple terms
     * Returns results for all terms
     */
    async batchSearch(terms, options) {
        const parallel = options?.parallel ?? true;
        if (parallel) {
            const searchPromises = terms.map(term => this.search(term, options));
            return Promise.all(searchPromises);
        }
        else {
            const results = [];
            for (const term of terms) {
                const termResults = await this.search(term, options);
                results.push(termResults);
            }
            return results;
        }
    }
    /**
     * Advanced: Search with result filtering
     * Searches and filters results based on criteria
     */
    async searchWithFilter(term, filter, options) {
        const results = await this.search(term, options);
        const filteredResults = results.filter(filter);
        if (options?.maxResults) {
            return filteredResults.slice(0, options.maxResults);
        }
        return filteredResults;
    }
    /**
     * Advanced: Search and extract specific data
     * Performs search and extracts data from results using custom extractor
     */
    async searchAndExtract(term, extractor, options) {
        const results = await this.search(term, options);
        return extractor(results);
    }
    /**
     * Utility: Check if we're on Google search page
     */
    async isOnGoogleSearchPage(options) {
        try {
            const title = await this.extractPageTitle(options);
            return title.includes('Google Search') || title.includes('Google');
        }
        catch {
            return false;
        }
    }
    /**
     * Access to underlying WebBuddyClient for advanced use cases
     */
    getWebBuddyClient() {
        return this.webBuddyClient;
    }
}
//# sourceMappingURL=client.js.map