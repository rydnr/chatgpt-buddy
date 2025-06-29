import { BaseMessage, type WebBuddyMessage } from '@web-buddy/core';
/**
 * Google-specific message types
 * These define the domain language for Google automation
 */
export declare const GoogleMessages: {
    readonly ENTER_SEARCH_TERM: "ENTER_SEARCH_TERM";
    readonly GET_SEARCH_RESULTS: "GET_SEARCH_RESULTS";
    readonly GET_FIRST_RESULT: "GET_FIRST_RESULT";
    readonly CLICK_RESULT: "CLICK_RESULT";
    readonly EXTRACT_PAGE_TITLE: "EXTRACT_PAGE_TITLE";
};
export type GoogleMessageType = typeof GoogleMessages[keyof typeof GoogleMessages];
/**
 * Enter search term in Google search box
 */
export declare class EnterSearchTermMessage extends BaseMessage {
    readonly type: "ENTER_SEARCH_TERM";
    constructor(searchTerm: string, correlationId?: string);
    static fromJSON(data: WebBuddyMessage): EnterSearchTermMessage;
}
/**
 * Get search results from Google results page
 */
export declare class GetSearchResultsMessage extends BaseMessage {
    readonly type: "GET_SEARCH_RESULTS";
    constructor(correlationId?: string);
    static fromJSON(data: WebBuddyMessage): GetSearchResultsMessage;
}
/**
 * Get the first search result
 */
export declare class GetFirstResultMessage extends BaseMessage {
    readonly type: "GET_FIRST_RESULT";
    constructor(correlationId?: string);
    static fromJSON(data: WebBuddyMessage): GetFirstResultMessage;
}
/**
 * Click on a specific search result
 */
export declare class ClickResultMessage extends BaseMessage {
    readonly type: "CLICK_RESULT";
    constructor(index?: number, correlationId?: string);
    static fromJSON(data: WebBuddyMessage): ClickResultMessage;
}
/**
 * Extract page title from current page
 */
export declare class ExtractPageTitleMessage extends BaseMessage {
    readonly type: "EXTRACT_PAGE_TITLE";
    constructor(correlationId?: string);
    static fromJSON(data: WebBuddyMessage): ExtractPageTitleMessage;
}
/**
 * Interface for Google search results
 */
export interface SearchResult {
    title: string;
    url: string;
    description: string;
    position?: number;
}
/**
 * Success response for search operations
 */
export interface SearchResponse {
    success: boolean;
    results?: SearchResult[];
    result?: SearchResult;
    title?: string;
    url?: string;
    error?: string;
    correlationId: string;
}
//# sourceMappingURL=messages.d.ts.map