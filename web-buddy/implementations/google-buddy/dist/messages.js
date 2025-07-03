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
import { BaseMessage } from '@web-buddy/core';
/**
 * Google-specific message types
 * These define the domain language for Google automation
 */
export const GoogleMessages = {
    ENTER_SEARCH_TERM: 'ENTER_SEARCH_TERM',
    GET_SEARCH_RESULTS: 'GET_SEARCH_RESULTS',
    GET_FIRST_RESULT: 'GET_FIRST_RESULT',
    CLICK_RESULT: 'CLICK_RESULT',
    EXTRACT_PAGE_TITLE: 'EXTRACT_PAGE_TITLE'
};
/**
 * Enter search term in Google search box
 */
export class EnterSearchTermMessage extends BaseMessage {
    type = GoogleMessages.ENTER_SEARCH_TERM;
    constructor(searchTerm, correlationId) {
        super({ searchTerm }, correlationId, 'google.com');
    }
    static fromJSON(data) {
        return new EnterSearchTermMessage(data.payload.searchTerm, data.correlationId);
    }
}
/**
 * Get search results from Google results page
 */
export class GetSearchResultsMessage extends BaseMessage {
    type = GoogleMessages.GET_SEARCH_RESULTS;
    constructor(correlationId) {
        super({}, correlationId, 'google.com');
    }
    static fromJSON(data) {
        return new GetSearchResultsMessage(data.correlationId);
    }
}
/**
 * Get the first search result
 */
export class GetFirstResultMessage extends BaseMessage {
    type = GoogleMessages.GET_FIRST_RESULT;
    constructor(correlationId) {
        super({}, correlationId, 'google.com');
    }
    static fromJSON(data) {
        return new GetFirstResultMessage(data.correlationId);
    }
}
/**
 * Click on a specific search result
 */
export class ClickResultMessage extends BaseMessage {
    type = GoogleMessages.CLICK_RESULT;
    constructor(index = 0, correlationId) {
        super({ index }, correlationId, 'google.com');
    }
    static fromJSON(data) {
        return new ClickResultMessage(data.payload.index || 0, data.correlationId);
    }
}
/**
 * Extract page title from current page
 */
export class ExtractPageTitleMessage extends BaseMessage {
    type = GoogleMessages.EXTRACT_PAGE_TITLE;
    constructor(correlationId) {
        super({}, correlationId, 'google.com');
    }
    static fromJSON(data) {
        return new ExtractPageTitleMessage(data.correlationId);
    }
}
//# sourceMappingURL=messages.js.map