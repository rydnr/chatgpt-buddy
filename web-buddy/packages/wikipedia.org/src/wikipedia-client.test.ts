/*
 * Copyright (C) 2024-present Semantest, rydnr
 *
 * This file is part of @semantest/wikipedia.org.
 *
 * @semantest/wikipedia.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * @semantest/wikipedia.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with @semantest/wikipedia.org. If not, see <https://www.gnu.org/licenses/>.
 */
import { WikipediaClient } from './wikipedia-client';
import { ArticleId } from './domain/value-objects/article-id';
import { WikiURL } from './domain/value-objects/wiki-url';

describe('WikipediaClient', () => {
  let client: WikipediaClient;
  
  beforeEach(() => {
    client = new WikipediaClient();
  });
  
  describe('initialization', () => {
    it('should create a new client instance', () => {
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(WikipediaClient);
    });
  });
  
  describe('ArticleId value object', () => {
    it('should create ArticleId from title', () => {
      const articleId = ArticleId.fromTitle('Albert Einstein');
      expect(articleId.value).toBe('Albert_Einstein');
    });
    
    it('should create ArticleId from URL', () => {
      const articleId = ArticleId.fromURL('https://en.wikipedia.org/wiki/Albert_Einstein');
      expect(articleId.value).toBe('Albert_Einstein');
    });
    
    it('should throw error for invalid ArticleId', () => {
      expect(() => new ArticleId('')).toThrow('ArticleId cannot be empty');
    });
  });
  
  describe('WikiURL value object', () => {
    it('should create WikiURL for article', () => {
      const articleId = new ArticleId('Albert_Einstein');
      const url = WikiURL.forArticle(articleId);
      expect(url.value).toBe('https://en.wikipedia.org/wiki/Albert_Einstein');
      expect(url.language).toBe('en');
    });
    
    it('should create WikiURL for search', () => {
      const url = WikiURL.forSearch('quantum physics');
      expect(url.value).toBe('https://en.wikipedia.org/w/index.php?search=quantum%20physics');
    });
    
    it('should validate Wikipedia URLs', () => {
      expect(() => new WikiURL('https://example.com')).toThrow('Invalid Wikipedia URL');
      expect(() => new WikiURL('https://en.wikipedia.org/wiki/Test')).not.toThrow();
    });
    
    it('should extract language from URL', () => {
      const url = new WikiURL('https://de.wikipedia.org/wiki/Test');
      expect(url.language).toBe('de');
    });
  });
});