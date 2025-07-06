"use strict";
/*
                       Wikipedia-Buddy

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WikipediaBuddyClient = void 0;
const messages_1 = require("./messages");
/**
 * Wikipedia-specific client that provides convenient methods
 * Built on top of the generic WebBuddyClient
 *
 * This demonstrates the API layer - developer-friendly wrappers for Wikipedia automation
 */
class WikipediaBuddyClient {
    webBuddyClient;
    constructor(webBuddyClient) {
        this.webBuddyClient = webBuddyClient;
    }
    /**
     * Search for articles on Wikipedia
     */
    async searchArticle(query, options) {
        const response = await this.webBuddyClient.sendMessage({
            [messages_1.WikipediaMessages.SEARCH_ARTICLE]: {
                query,
                limit: options?.limit || 10
            }
        }, {
            tabId: options?.tabId
        });
        return response.data || [];
    }
    /**
     * Get the complete content of current article
     */
    async getArticleContent(options) {
        const response = await this.webBuddyClient.sendMessage({
            [messages_1.WikipediaMessages.GET_ARTICLE_CONTENT]: {}
        }, {
            tabId: options?.tabId
        });
        return response?.data;
    }
    /**
     * Get just the summary (first paragraph) of current article
     */
    async getArticleSummary(options) {
        const response = await this.webBuddyClient.sendMessage({
            [messages_1.WikipediaMessages.GET_ARTICLE_SUMMARY]: {}
        }, {
            tabId: options?.tabId
        });
        return response.data || '';
    }
    /**
     * Get the section structure of current article
     */
    async getArticleSections(options) {
        const response = await this.webBuddyClient.sendMessage({
            [messages_1.WikipediaMessages.GET_ARTICLE_SECTIONS]: {}
        }, {
            tabId: options?.tabId
        });
        return response.data || [];
    }
    /**
     * Navigate to a specific section in the current article
     */
    async navigateToSection(sectionTitle, options) {
        const response = await this.webBuddyClient.sendMessage({
            [messages_1.WikipediaMessages.NAVIGATE_TO_SECTION]: { sectionTitle }
        }, {
            tabId: options?.tabId
        });
        return response.success;
    }
    /**
     * Get all links from the current article
     */
    async getArticleLinks(options) {
        const response = await this.webBuddyClient.sendMessage({
            [messages_1.WikipediaMessages.GET_ARTICLE_LINKS]: {
                type: options?.type || 'all'
            }
        }, {
            tabId: options?.tabId
        });
        return response.data || [];
    }
    /**
     * Get references/citations from the current article
     */
    async getArticleReferences(options) {
        const response = await this.webBuddyClient.sendMessage({
            [messages_1.WikipediaMessages.GET_ARTICLE_REFERENCES]: {}
        }, {
            tabId: options?.tabId
        });
        return response.data || [];
    }
    /**
     * Get categories of the current article
     */
    async getArticleCategories(options) {
        const response = await this.webBuddyClient.sendMessage({
            [messages_1.WikipediaMessages.GET_ARTICLE_CATEGORIES]: {}
        }, {
            tabId: options?.tabId
        });
        return response.data || [];
    }
    /**
     * Get infobox data from the current article
     */
    async getArticleInfobox(options) {
        const response = await this.webBuddyClient.sendMessage({
            [messages_1.WikipediaMessages.GET_ARTICLE_INFOBOX]: {}
        }, {
            tabId: options?.tabId
        });
        return response.data;
    }
    /**
     * Navigate to a random Wikipedia article
     */
    async getRandomArticle(options) {
        return this.webBuddyClient.sendMessage({
            [messages_1.WikipediaMessages.GET_RANDOM_ARTICLE]: {}
        }, {
            tabId: options?.tabId
        });
    }
    /**
     * Navigate to today's featured article
     */
    async getFeaturedArticle(options) {
        return this.webBuddyClient.sendMessage({
            [messages_1.WikipediaMessages.GET_FEATURED_ARTICLE]: {}
        }, {
            tabId: options?.tabId
        });
    }
    /**
     * Search within specific categories
     */
    async searchInCategories(categories, query, options) {
        const response = await this.webBuddyClient.sendMessage({
            [messages_1.WikipediaMessages.SEARCH_IN_CATEGORIES]: {
                categories,
                query,
                limit: options?.limit || 10
            }
        }, {
            tabId: options?.tabId
        });
        return response.data || [];
    }
    // High-level convenience methods
    /**
     * Quick research method - search and get article summary
     */
    async quickResearch(topic, options) {
        // Search for the topic
        const searchResults = await this.searchArticle(topic, { limit: 1, tabId: options?.tabId });
        if (searchResults.length === 0) {
            throw new Error(`No articles found for topic: ${topic}`);
        }
        // Navigate to first result (this would require additional navigation logic)
        // For now, assume we're already on the correct page
        const article = await this.getArticleContent(options);
        const summary = await this.getArticleSummary(options);
        const result = { article, summary };
        if (options?.includeLinks) {
            result.links = await this.getArticleLinks({ type: 'internal', tabId: options.tabId });
        }
        if (options?.includeReferences) {
            result.references = await this.getArticleReferences(options);
        }
        return result;
    }
    /**
     * Deep research method - analyze multiple related articles
     */
    async deepResearch(mainTopic, options) {
        const sessionId = this.webBuddyClient.generateCorrelationId();
        const startTime = new Date();
        // Start with main topic
        const articles = [];
        const mainArticle = await this.quickResearch(mainTopic, {
            includeLinks: true,
            includeReferences: true,
            tabId: options?.tabId
        });
        articles.push(mainArticle.article);
        // Follow internal links for deeper research
        const maxDepth = options?.maxDepth || 2;
        const maxArticles = options?.maxArticles || 5;
        if (mainArticle.links && articles.length < maxArticles) {
            const internalLinks = mainArticle.links.filter(link => link.type === 'internal');
            for (let i = 0; i < Math.min(internalLinks.length, maxArticles - articles.length); i++) {
                // This would require navigation to each link
                // Simplified for this implementation
            }
        }
        return {
            id: sessionId,
            topic: mainTopic,
            articles,
            notes: [`Research started for topic: ${mainTopic}`],
            startTime,
            lastAccessed: new Date(),
            tags: options?.includeCategories ? await this.getArticleCategories(options) : []
        };
    }
    /**
     * Compare multiple articles
     */
    async compareArticles(topics, options) {
        const articles = [];
        // Get all articles
        for (const topic of topics) {
            const research = await this.quickResearch(topic, {
                tabId: options?.tabId
            });
            articles.push(research.article);
        }
        // Generate comparison metrics
        const comparison = {};
        const compareBy = options?.compareBy || 'length';
        switch (compareBy) {
            case 'length':
                comparison.wordCounts = articles.map(a => ({
                    title: a.title,
                    wordCount: (a.content || '').split(/\s+/).length
                }));
                break;
            case 'references':
                comparison.referenceCounts = articles.map(a => ({
                    title: a.title,
                    referenceCount: a.references.length
                }));
                break;
            case 'categories':
                comparison.categories = articles.map(a => ({
                    title: a.title,
                    categories: a.categories
                }));
                break;
            case 'links':
                comparison.linkCounts = articles.map(a => ({
                    title: a.title,
                    linkCount: a.links.length
                }));
                break;
        }
        return { articles, comparison };
    }
    /**
     * Get the underlying WebBuddyClient for advanced usage
     */
    getWebBuddyClient() {
        return this.webBuddyClient;
    }
}
exports.WikipediaBuddyClient = WikipediaBuddyClient;
//# sourceMappingURL=client.js.map