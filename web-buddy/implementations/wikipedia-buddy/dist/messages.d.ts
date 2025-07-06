/**
 * Wikipedia-specific message types and interfaces
 * Following the established pattern from ChatGPT-buddy and Google-buddy
 */
export declare const WikipediaMessages: {
    readonly SEARCH_ARTICLE: "SEARCH_ARTICLE";
    readonly GET_ARTICLE_CONTENT: "GET_ARTICLE_CONTENT";
    readonly GET_ARTICLE_SUMMARY: "GET_ARTICLE_SUMMARY";
    readonly GET_ARTICLE_SECTIONS: "GET_ARTICLE_SECTIONS";
    readonly GET_ARTICLE_LINKS: "GET_ARTICLE_LINKS";
    readonly GET_ARTICLE_REFERENCES: "GET_ARTICLE_REFERENCES";
    readonly GET_ARTICLE_CATEGORIES: "GET_ARTICLE_CATEGORIES";
    readonly GET_ARTICLE_INFOBOX: "GET_ARTICLE_INFOBOX";
    readonly NAVIGATE_TO_SECTION: "NAVIGATE_TO_SECTION";
    readonly GET_RANDOM_ARTICLE: "GET_RANDOM_ARTICLE";
    readonly GET_FEATURED_ARTICLE: "GET_FEATURED_ARTICLE";
    readonly SEARCH_IN_CATEGORIES: "SEARCH_IN_CATEGORIES";
};
export type WikipediaMessageType = typeof WikipediaMessages[keyof typeof WikipediaMessages];
/**
 * Wikipedia article data structure
 */
export interface WikipediaArticle {
    title: string;
    url: string;
    content: string;
    summary: string;
    sections: WikipediaSection[];
    categories: string[];
    links: WikipediaLink[];
    references: WikipediaReference[];
    infobox?: WikipediaInfobox;
    lastModified: Date;
    viewCount?: number;
}
/**
 * Wikipedia article section
 */
export interface WikipediaSection {
    title: string;
    level: number;
    content: string;
    anchor: string;
    subsections: WikipediaSection[];
}
/**
 * Wikipedia link (internal or external)
 */
export interface WikipediaLink {
    title: string;
    url: string;
    type: 'internal' | 'external' | 'interwiki';
    description?: string;
}
/**
 * Wikipedia reference/citation
 */
export interface WikipediaReference {
    id: string;
    title?: string;
    url?: string;
    author?: string;
    publisher?: string;
    date?: string;
    accessDate?: string;
    type: 'web' | 'book' | 'journal' | 'news' | 'other';
}
/**
 * Wikipedia infobox data
 */
export interface WikipediaInfobox {
    type: string;
    fields: Record<string, string>;
    image?: {
        url: string;
        caption?: string;
        alt?: string;
    };
}
/**
 * Search result structure
 */
export interface WikipediaSearchResult {
    title: string;
    url: string;
    snippet: string;
    thumbnail?: {
        url: string;
        width: number;
        height: number;
    };
    wordCount: number;
    lastModified: Date;
}
/**
 * Category information
 */
export interface WikipediaCategory {
    name: string;
    url: string;
    description?: string;
    articleCount: number;
    subcategories: string[];
}
/**
 * Response type for Wikipedia operations
 */
export interface WikipediaResponse {
    success: boolean;
    data?: any;
    error?: string;
    timestamp: number;
    correlationId?: string;
}
/**
 * Research session for multi-article analysis
 */
export interface ResearchSession {
    id: string;
    topic: string;
    articles: WikipediaArticle[];
    notes: string[];
    startTime: Date;
    lastAccessed: Date;
    tags: string[];
}
//# sourceMappingURL=messages.d.ts.map