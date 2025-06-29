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
 * Google search handler that implements DOM manipulation for Google pages
 * This runs in the browser content script context
 */
export class GoogleSearchHandler {
    async handle(message) {
        switch (message.type) {
            case GoogleMessages.ENTER_SEARCH_TERM:
                return await this.enterSearchTerm(message.payload.searchTerm);
            case GoogleMessages.GET_SEARCH_RESULTS:
                return await this.getSearchResults();
            case GoogleMessages.GET_FIRST_RESULT:
                return await this.getFirstResult();
            case GoogleMessages.CLICK_RESULT:
                return await this.clickResult(message.payload.index || 0);
            case GoogleMessages.EXTRACT_PAGE_TITLE:
                return await this.extractPageTitle();
            default:
                throw new Error(`Unknown Google message type: ${message.type}`);
        }
    }
    /**
     * Enters search term in Google search box
     * Specification: Should type in search box and trigger search
     */
    async enterSearchTerm(term) {
        try {
            const searchInput = document.querySelector('input[name="q"]');
            if (!searchInput) {
                throw new Error('Search input not found');
            }
            // Clear existing value and enter new term
            searchInput.value = '';
            searchInput.focus();
            // Simulate typing for realistic behavior
            for (const char of term) {
                searchInput.value += char;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                await this.delay(50); // Realistic typing speed
            }
            // Trigger search
            const searchForm = searchInput.closest('form');
            if (searchForm) {
                searchForm.submit();
            }
            else {
                // Fallback: press Enter
                searchInput.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    bubbles: true
                }));
            }
            // Wait for search results to load
            await this.waitForElement('#search', 5000);
            return {
                success: true,
                correlationId: 'temp-id' // Will be set by caller
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                correlationId: 'temp-id'
            };
        }
    }
    /**
     * Extracts search results from Google results page
     * Specification: Should return array of structured result objects
     */
    async getSearchResults() {
        try {
            await this.waitForElement('#search .g', 3000);
            const resultElements = document.querySelectorAll('#search .g');
            const results = [];
            for (let i = 0; i < resultElements.length; i++) {
                const element = resultElements[i];
                const titleElement = element.querySelector('h3');
                const linkElement = element.querySelector('a[href]');
                const descElement = element.querySelector('[data-sncf="1"]') ||
                    element.querySelector('.VwiC3b');
                if (titleElement && linkElement) {
                    results.push({
                        title: titleElement.textContent?.trim() || '',
                        url: linkElement.href,
                        description: descElement?.textContent?.trim() || '',
                        position: i + 1
                    });
                }
            }
            return {
                success: true,
                results,
                correlationId: 'temp-id'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                correlationId: 'temp-id'
            };
        }
    }
    /**
     * Gets the first search result
     * Specification: Should return the top result with title, URL, description
     */
    async getFirstResult() {
        try {
            const resultsResponse = await this.getSearchResults();
            if (!resultsResponse.success || !resultsResponse.results || resultsResponse.results.length === 0) {
                throw new Error('No search results found');
            }
            return {
                success: true,
                result: resultsResponse.results[0],
                correlationId: 'temp-id'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                correlationId: 'temp-id'
            };
        }
    }
    /**
     * Clicks on a specific search result
     * Specification: Should click the nth result and navigate to target page
     */
    async clickResult(index) {
        try {
            const resultElements = document.querySelectorAll('#search .g a[href]');
            if (index >= resultElements.length) {
                throw new Error(`Result index ${index} not found (only ${resultElements.length} results)`);
            }
            const linkElement = resultElements[index];
            const targetUrl = linkElement.href;
            linkElement.click();
            return {
                success: true,
                url: targetUrl,
                correlationId: 'temp-id'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                correlationId: 'temp-id'
            };
        }
    }
    /**
     * Extracts the page title from the current page
     */
    async extractPageTitle() {
        try {
            const title = document.title;
            return {
                success: true,
                title,
                correlationId: 'temp-id'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                correlationId: 'temp-id'
            };
        }
    }
    /**
     * Utility: Wait for element to appear
     */
    async waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element)
                return resolve(element);
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }
    /**
     * Utility: Add realistic delay
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=handlers.js.map