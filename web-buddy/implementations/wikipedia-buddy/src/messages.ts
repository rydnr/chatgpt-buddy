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

/**
 * Wikipedia-specific message types and interfaces
 * Following the established pattern from ChatGPT-buddy and Google-buddy
 */

export const WikipediaMessages = {
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
} as const;

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