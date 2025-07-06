import { type WikipediaArticle, type WikipediaSearchResult, type WikipediaSection, type WikipediaLink, type WikipediaReference, type WikipediaInfobox } from './messages';
/**
 * Wikipedia-specific DOM handlers
 * Contains the actual logic for interacting with Wikipedia's interface
 *
 * This represents the domain logic layer - specific to Wikipedia's UI structure
 */
export declare class WikipediaHandler {
    /**
     * Search for articles on Wikipedia
     */
    searchArticle(query: string, limit?: number): Promise<WikipediaSearchResult[]>;
    /**
     * Get the content of the current article
     */
    getArticleContent(): Promise<WikipediaArticle>;
    /**
     * Get article summary (first paragraph)
     */
    getArticleSummary(): Promise<string>;
    /**
     * Get article sections structure
     */
    getArticleSections(): Promise<WikipediaSection[]>;
    /**
     * Navigate to a specific section
     */
    navigateToSection(sectionTitle: string): Promise<boolean>;
    /**
     * Get article links (internal and external)
     */
    getArticleLinks(): Promise<WikipediaLink[]>;
    /**
     * Get article references
     */
    getArticleReferences(): Promise<WikipediaReference[]>;
    /**
     * Get article categories
     */
    getArticleCategories(): Promise<string[]>;
    /**
     * Get article infobox data
     */
    getArticleInfobox(): Promise<WikipediaInfobox | undefined>;
    /**
     * Get a random article
     */
    getRandomArticle(): Promise<void>;
    /**
     * Get today's featured article
     */
    getFeaturedArticle(): Promise<void>;
    /**
     * Search within specific categories
     */
    searchInCategories(categories: string[], query: string): Promise<WikipediaSearchResult[]>;
    private waitForSearchResults;
    private extractSearchResults;
    private extractTextContent;
    private extractSummary;
    private extractSections;
    private extractSectionContent;
    private extractCategories;
    private extractLinks;
    private extractReferences;
    private extractInfobox;
    private detectInfoboxType;
    private getLastModifiedDate;
    private getViewCount;
    private createAnchor;
    private estimateWordCount;
}
//# sourceMappingURL=handlers.d.ts.map