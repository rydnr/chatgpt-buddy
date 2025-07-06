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

import { WebBuddyClient } from '@web-buddy/core';
import { WikipediaBuddyClient } from './client';
import { WikipediaMessages } from './messages';

// Mock the WebBuddyClient
jest.mock('@web-buddy/core');

describe('WikipediaBuddyClient', () => {
  let mockWebBuddyClient: jest.Mocked<WebBuddyClient>;
  let wikipediaClient: WikipediaBuddyClient;

  beforeEach(() => {
    mockWebBuddyClient = {
      sendMessage: jest.fn(),
      sendMessages: jest.fn(),
      generateCorrelationId: jest.fn(() => 'test-correlation-id'),
      getTransportInfo: jest.fn()
    } as any;

    wikipediaClient = new WikipediaBuddyClient(mockWebBuddyClient);
  });

  describe('searchArticle', () => {
    it('should send SEARCH_ARTICLE message with query', async () => {
      const query = 'Artificial Intelligence';
      const expectedResults = [
        {
          title: 'Artificial Intelligence',
          url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
          snippet: 'AI is intelligence demonstrated by machines...',
          wordCount: 150,
          lastModified: new Date()
        }
      ];
      
      mockWebBuddyClient.sendMessage.mockResolvedValue({ 
        success: true, 
        data: expectedResults 
      });

      const result = await wikipediaClient.searchArticle(query);

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [WikipediaMessages.SEARCH_ARTICLE]: { query, limit: 10 } },
        { tabId: undefined }
      );
      expect(result).toEqual(expectedResults);
    });

    it('should respect custom limit parameter', async () => {
      const query = 'Machine Learning';
      const limit = 5;
      
      mockWebBuddyClient.sendMessage.mockResolvedValue({ 
        success: true, 
        data: [] 
      });

      await wikipediaClient.searchArticle(query, { limit });

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [WikipediaMessages.SEARCH_ARTICLE]: { query, limit } },
        { tabId: undefined }
      );
    });

    it('should pass tabId option when provided', async () => {
      const query = 'Deep Learning';
      const tabId = 123;
      
      mockWebBuddyClient.sendMessage.mockResolvedValue({ 
        success: true, 
        data: [] 
      });

      await wikipediaClient.searchArticle(query, { tabId });

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [WikipediaMessages.SEARCH_ARTICLE]: { query, limit: 10 } },
        { tabId }
      );
    });
  });

  describe('getArticleContent', () => {
    it('should send GET_ARTICLE_CONTENT message', async () => {
      const expectedArticle = {
        title: 'Artificial Intelligence',
        url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
        content: 'Full article content...',
        summary: 'AI is intelligence demonstrated by machines...',
        sections: [],
        categories: ['Computer science', 'Artificial intelligence'],
        links: [],
        references: [],
        lastModified: new Date()
      };
      
      mockWebBuddyClient.sendMessage.mockResolvedValue({ 
        success: true, 
        data: expectedArticle 
      });

      const result = await wikipediaClient.getArticleContent();

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [WikipediaMessages.GET_ARTICLE_CONTENT]: {} },
        { tabId: undefined }
      );
      expect(result).toEqual(expectedArticle);
    });
  });

  describe('getArticleSummary', () => {
    it('should send GET_ARTICLE_SUMMARY message and return summary', async () => {
      const expectedSummary = 'AI is intelligence demonstrated by machines...';
      
      mockWebBuddyClient.sendMessage.mockResolvedValue({ 
        success: true, 
        data: expectedSummary 
      });

      const result = await wikipediaClient.getArticleSummary();

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [WikipediaMessages.GET_ARTICLE_SUMMARY]: {} },
        { tabId: undefined }
      );
      expect(result).toBe(expectedSummary);
    });

    it('should return empty string when no summary available', async () => {
      mockWebBuddyClient.sendMessage.mockResolvedValue({ 
        success: true, 
        data: null 
      });

      const result = await wikipediaClient.getArticleSummary();

      expect(result).toBe('');
    });
  });

  describe('navigateToSection', () => {
    it('should send NAVIGATE_TO_SECTION message with section title', async () => {
      const sectionTitle = 'History';
      
      mockWebBuddyClient.sendMessage.mockResolvedValue({ 
        success: true 
      });

      const result = await wikipediaClient.navigateToSection(sectionTitle);

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [WikipediaMessages.NAVIGATE_TO_SECTION]: { sectionTitle } },
        { tabId: undefined }
      );
      expect(result).toBe(true);
    });
  });

  describe('getArticleLinks', () => {
    it('should send GET_ARTICLE_LINKS message with type filter', async () => {
      const expectedLinks = [
        {
          title: 'Machine Learning',
          url: 'https://en.wikipedia.org/wiki/Machine_learning',
          type: 'internal' as const
        }
      ];
      
      mockWebBuddyClient.sendMessage.mockResolvedValue({ 
        success: true, 
        data: expectedLinks 
      });

      const result = await wikipediaClient.getArticleLinks({ type: 'internal' });

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [WikipediaMessages.GET_ARTICLE_LINKS]: { type: 'internal' } },
        { tabId: undefined }
      );
      expect(result).toEqual(expectedLinks);
    });

    it('should default to all link types', async () => {
      mockWebBuddyClient.sendMessage.mockResolvedValue({ 
        success: true, 
        data: [] 
      });

      await wikipediaClient.getArticleLinks();

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [WikipediaMessages.GET_ARTICLE_LINKS]: { type: 'all' } },
        { tabId: undefined }
      );
    });
  });

  describe('searchInCategories', () => {
    it('should send SEARCH_IN_CATEGORIES message with categories and query', async () => {
      const categories = ['Computer science', 'Artificial intelligence'];
      const query = 'neural networks';
      const limit = 5;
      
      mockWebBuddyClient.sendMessage.mockResolvedValue({ 
        success: true, 
        data: [] 
      });

      await wikipediaClient.searchInCategories(categories, query, { limit });

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledWith(
        { [WikipediaMessages.SEARCH_IN_CATEGORIES]: { categories, query, limit } },
        { tabId: undefined }
      );
    });
  });

  describe('quickResearch', () => {
    it('should perform search and gather article information', async () => {
      const topic = 'Artificial Intelligence';
      
      // Mock search results
      mockWebBuddyClient.sendMessage
        .mockResolvedValueOnce({ // searchArticle
          success: true, 
          data: [{ title: topic, url: 'https://example.com', snippet: 'AI...', wordCount: 100, lastModified: new Date() }]
        })
        .mockResolvedValueOnce({ // getArticleContent
          success: true, 
          data: { 
            title: topic, 
            content: 'Full content...', 
            sections: [], 
            categories: [], 
            links: [], 
            references: [],
            summary: 'Summary...',
            url: 'https://example.com',
            lastModified: new Date()
          }
        })
        .mockResolvedValueOnce({ // getArticleSummary
          success: true, 
          data: 'AI is intelligence demonstrated by machines...'
        });

      const result = await wikipediaClient.quickResearch(topic);

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledTimes(3);
      expect(result.article.title).toBe(topic);
      expect(result.summary).toBe('AI is intelligence demonstrated by machines...');
    });

    it('should include links and references when requested', async () => {
      const topic = 'Machine Learning';
      
      mockWebBuddyClient.sendMessage
        .mockResolvedValueOnce({ success: true, data: [{ title: topic, url: 'test', snippet: '', wordCount: 0, lastModified: new Date() }] })
        .mockResolvedValueOnce({ success: true, data: { title: topic, content: '', sections: [], categories: [], links: [], references: [], summary: '', url: '', lastModified: new Date() } })
        .mockResolvedValueOnce({ success: true, data: 'Summary...' })
        .mockResolvedValueOnce({ success: true, data: [{ title: 'Link', url: 'test', type: 'internal' }] })
        .mockResolvedValueOnce({ success: true, data: [{ id: 'ref1', type: 'web' }] });

      const result = await wikipediaClient.quickResearch(topic, { 
        includeLinks: true, 
        includeReferences: true 
      });

      expect(mockWebBuddyClient.sendMessage).toHaveBeenCalledTimes(5);
      expect(result.links).toBeDefined();
      expect(result.references).toBeDefined();
    });

    it('should throw error when no articles found', async () => {
      mockWebBuddyClient.sendMessage.mockResolvedValue({ 
        success: true, 
        data: [] 
      });

      await expect(wikipediaClient.quickResearch('NonexistentTopic'))
        .rejects.toThrow('No articles found for topic: NonexistentTopic');
    });
  });

  describe('compareArticles', () => {
    it('should compare articles by word count', async () => {
      const topics = ['AI', 'ML'];
      
      // Mock the quickResearch calls - 3 calls per article (search, getContent, getSummary)
      mockWebBuddyClient.sendMessage
        .mockResolvedValueOnce({ success: true, data: [{ title: 'AI', url: 'test', snippet: '', wordCount: 0, lastModified: new Date() }] })
        .mockResolvedValueOnce({ success: true, data: { title: 'AI', content: 'AI content with multiple words here', sections: [], categories: [], links: [], references: [], summary: '', url: '', lastModified: new Date() } })
        .mockResolvedValueOnce({ success: true, data: 'AI summary' })
        .mockResolvedValueOnce({ success: true, data: [{ title: 'ML', url: 'test', snippet: '', wordCount: 0, lastModified: new Date() }] })
        .mockResolvedValueOnce({ success: true, data: { title: 'ML', content: 'ML content', sections: [], categories: [], links: [], references: [], summary: '', url: '', lastModified: new Date() } })
        .mockResolvedValueOnce({ success: true, data: 'ML summary' });

      const result = await wikipediaClient.compareArticles(topics, { compareBy: 'length' });

      expect(result.articles).toHaveLength(2);
      expect(result.comparison.wordCounts).toBeDefined();
      expect(result.comparison.wordCounts[0].title).toBe('AI');
      expect(result.comparison.wordCounts[1].title).toBe('ML');
    });
  });

  describe('getWebBuddyClient', () => {
    it('should return the underlying WebBuddyClient instance', () => {
      const result = wikipediaClient.getWebBuddyClient();
      expect(result).toBe(mockWebBuddyClient);
    });
  });
});

describe('Factory function', () => {
  it('should create WikipediaBuddyClient with correct configuration', () => {
    const { createWikipediaBuddyClient } = require('./index');
    
    const serverUrl = 'http://localhost:3000';
    const config = {
      apiKey: 'test-key',
      timeout: 5000
    };

    const client = createWikipediaBuddyClient(serverUrl, config);

    expect(client).toBeInstanceOf(WikipediaBuddyClient);
  });
});