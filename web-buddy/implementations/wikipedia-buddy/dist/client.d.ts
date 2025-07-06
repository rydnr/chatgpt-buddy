import { WebBuddyClient } from '@web-buddy/core';
import { type WikipediaArticle, type WikipediaSearchResult, type WikipediaSection, type WikipediaLink, type WikipediaReference, type WikipediaInfobox, type WikipediaResponse, type ResearchSession } from './messages';
/**
 * Wikipedia-specific client that provides convenient methods
 * Built on top of the generic WebBuddyClient
 *
 * This demonstrates the API layer - developer-friendly wrappers for Wikipedia automation
 */
export declare class WikipediaBuddyClient {
    private webBuddyClient;
    constructor(webBuddyClient: WebBuddyClient);
    /**
     * Search for articles on Wikipedia
     */
    searchArticle(query: string, options?: {
        limit?: number;
        tabId?: number;
    }): Promise<WikipediaSearchResult[]>;
    /**
     * Get the complete content of current article
     */
    getArticleContent(options?: {
        tabId?: number;
    }): Promise<WikipediaArticle>;
    /**
     * Get just the summary (first paragraph) of current article
     */
    getArticleSummary(options?: {
        tabId?: number;
    }): Promise<string>;
    /**
     * Get the section structure of current article
     */
    getArticleSections(options?: {
        tabId?: number;
    }): Promise<WikipediaSection[]>;
    /**
     * Navigate to a specific section in the current article
     */
    navigateToSection(sectionTitle: string, options?: {
        tabId?: number;
    }): Promise<boolean>;
    /**
     * Get all links from the current article
     */
    getArticleLinks(options?: {
        type?: 'internal' | 'external' | 'all';
        tabId?: number;
    }): Promise<WikipediaLink[]>;
    /**
     * Get references/citations from the current article
     */
    getArticleReferences(options?: {
        tabId?: number;
    }): Promise<WikipediaReference[]>;
    /**
     * Get categories of the current article
     */
    getArticleCategories(options?: {
        tabId?: number;
    }): Promise<string[]>;
    /**
     * Get infobox data from the current article
     */
    getArticleInfobox(options?: {
        tabId?: number;
    }): Promise<WikipediaInfobox | undefined>;
    /**
     * Navigate to a random Wikipedia article
     */
    getRandomArticle(options?: {
        tabId?: number;
    }): Promise<WikipediaResponse>;
    /**
     * Navigate to today's featured article
     */
    getFeaturedArticle(options?: {
        tabId?: number;
    }): Promise<WikipediaResponse>;
    /**
     * Search within specific categories
     */
    searchInCategories(categories: string[], query: string, options?: {
        limit?: number;
        tabId?: number;
    }): Promise<WikipediaSearchResult[]>;
    /**
     * Quick research method - search and get article summary
     */
    quickResearch(topic: string, options?: {
        includeLinks?: boolean;
        includeReferences?: boolean;
        tabId?: number;
    }): Promise<{
        article: WikipediaArticle;
        summary: string;
        links?: WikipediaLink[];
        references?: WikipediaReference[];
    }>;
    /**
     * Deep research method - analyze multiple related articles
     */
    deepResearch(mainTopic: string, options?: {
        maxDepth?: number;
        maxArticles?: number;
        includeCategories?: boolean;
        tabId?: number;
    }): Promise<ResearchSession>;
    /**
     * Compare multiple articles
     */
    compareArticles(topics: string[], options?: {
        compareBy?: 'length' | 'references' | 'categories' | 'links';
        tabId?: number;
    }): Promise<{
        articles: WikipediaArticle[];
        comparison: Record<string, any>;
    }>;
    /**
     * Get the underlying WebBuddyClient for advanced usage
     */
    getWebBuddyClient(): WebBuddyClient;
}
//# sourceMappingURL=client.d.ts.map