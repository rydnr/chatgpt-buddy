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
import { WebBuddyClient } from '@web-buddy/core';
import { WikipediaClient } from './wikipedia-client';

/**
 * Backward compatibility wrapper for WikipediaClient
 * Extends WebBuddyClient to maintain compatibility with existing code
 */
export class WikipediaBuddyClient extends WebBuddyClient {
  private wikipediaClient: WikipediaClient;
  
  constructor() {
    super('wikipedia.org');
    this.wikipediaClient = new WikipediaClient();
  }
  
  public async initialize(): Promise<void> {
    await super.initialize();
    await this.wikipediaClient.initialize();
  }
  
  /**
   * Navigate to an article
   * @deprecated Use wikipediaClient.navigateToArticle() instead
   */
  public async goToArticle(title: string): Promise<void> {
    await this.wikipediaClient.navigateToArticle(title);
  }
  
  /**
   * Search Wikipedia
   * @deprecated Use wikipediaClient.search() instead
   */
  public async searchWikipedia(query: string): Promise<void> {
    await this.wikipediaClient.search(query);
  }
  
  /**
   * Get article content
   * @deprecated Use wikipediaClient.getCurrentArticle() instead
   */
  public async getArticleContent(): Promise<string | null> {
    const article = this.wikipediaClient.getCurrentArticle();
    return article ? article.content : null;
  }
  
  /**
   * Get article sections
   * @deprecated Use wikipediaClient.getSections() instead
   */
  public async getArticleSections(): Promise<any[] | null> {
    return this.wikipediaClient.getSections();
  }
  
  /**
   * Extract current page data
   * @deprecated Use wikipediaClient.extractCurrentArticle() instead
   */
  public async extractPageData(): Promise<any> {
    const article = await this.wikipediaClient.extractCurrentArticle();
    if (!article) return null;
    
    return {
      title: article.title,
      url: article.url,
      content: article.content,
      sections: article.sections.map(s => ({
        id: s.id,
        title: s.title,
        content: s.content,
        level: s.level
      }))
    };
  }
  
  /**
   * Handle incoming messages (override from WebBuddyClient)
   */
  protected async handleMessage(message: any): Promise<any> {
    switch (message.action) {
      case 'navigate':
        await this.wikipediaClient.navigateToArticle(message.data.title);
        return { success: true };
        
      case 'search':
        await this.wikipediaClient.search(message.data.query);
        return { success: true };
        
      case 'extract':
        const data = await this.extractPageData();
        return { success: true, data };
        
      default:
        return super.handleMessage(message);
    }
  }
  
  /**
   * Get the underlying WikipediaClient for direct access
   */
  public getWikipediaClient(): WikipediaClient {
    return this.wikipediaClient;
  }
}