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
exports.WikipediaMessages = void 0;
/**
 * Wikipedia-specific message types and interfaces
 * Following the established pattern from ChatGPT-buddy and Google-buddy
 */
exports.WikipediaMessages = {
    SEARCH_ARTICLE: 'SEARCH_ARTICLE',
    GET_ARTICLE_CONTENT: 'GET_ARTICLE_CONTENT',
    GET_ARTICLE_SUMMARY: 'GET_ARTICLE_SUMMARY',
    GET_ARTICLE_SECTIONS: 'GET_ARTICLE_SECTIONS',
    GET_ARTICLE_LINKS: 'GET_ARTICLE_LINKS',
    GET_ARTICLE_REFERENCES: 'GET_ARTICLE_REFERENCES',
    GET_ARTICLE_CATEGORIES: 'GET_ARTICLE_CATEGORIES',
    GET_ARTICLE_INFOBOX: 'GET_ARTICLE_INFOBOX',
    NAVIGATE_TO_SECTION: 'NAVIGATE_TO_SECTION',
    GET_RANDOM_ARTICLE: 'GET_RANDOM_ARTICLE',
    GET_FEATURED_ARTICLE: 'GET_FEATURED_ARTICLE',
    SEARCH_IN_CATEGORIES: 'SEARCH_IN_CATEGORIES'
};
//# sourceMappingURL=messages.js.map