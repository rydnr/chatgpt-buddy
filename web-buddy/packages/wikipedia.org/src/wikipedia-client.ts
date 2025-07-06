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
import { WikipediaApplication } from './application/wikipedia-application';
import { WikipediaDOMAdapter } from './infrastructure/adapters/wikipedia-dom-adapter';
import { WikipediaCommunicationAdapter } from './infrastructure/adapters/wikipedia-communication-adapter';
import { ArticleRequestedEvent } from './domain/events/article-requested-event';
import { WikiArticle } from './domain/entities/wiki-article';
import { ArticleId } from './domain/value-objects/article-id';

export class WikipediaClient {
  private application: WikipediaApplication;
  private domAdapter: WikipediaDOMAdapter;
  private communicationAdapter: WikipediaCommunicationAdapter;
  
  constructor() {
    this.application = new WikipediaApplication();
    this.domAdapter = new WikipediaDOMAdapter(this.application);
    this.communicationAdapter = new WikipediaCommunicationAdapter(this.application);
  }
  
  /**
   * Initialize the Wikipedia client
   */
  public async initialize(): Promise<void> {
    console.log('Wikipedia client initialized');
    
    // Extract article if we're on a Wikipedia page
    if (this.isWikipediaPage()) {
      await this.extractCurrentArticle();
    }
  }
  
  /**
   * Navigate to a Wikipedia article by title
   */
  public async navigateToArticle(title: string): Promise<void> {
    const event = ArticleRequestedEvent.fromTitle(title);
    this.application.accept(event);
    this.domAdapter.navigateToArticle(event.articleId);
  }
  
  /**
   * Navigate to a Wikipedia article by URL
   */
  public async navigateToURL(url: string): Promise<void> {
    const event = ArticleRequestedEvent.fromURL(url);
    this.application.accept(event);
    window.location.href = url;
  }
  
  /**
   * Search Wikipedia
   */
  public async search(query: string): Promise<void> {
    this.domAdapter.search(query);
  }
  
  /**
   * Get search results from the current page
   */
  public getSearchResults(): Array<{title: string, snippet: string, url: string}> {
    return this.domAdapter.getSearchResults();
  }
  
  /**
   * Extract the current article
   */
  public async extractCurrentArticle(): Promise<WikiArticle | null> {
    return this.domAdapter.extractArticle();
  }
  
  /**
   * Get the current article
   */
  public getCurrentArticle(): WikiArticle | null {
    return this.application.getCurrentArticle();
  }
  
  /**
   * Get a specific section from the current article
   */
  public getSection(sectionId: string): string | null {
    const article = this.getCurrentArticle();
    if (!article) return null;
    
    const section = article.getSectionById(sectionId);
    return section ? section.content : null;
  }
  
  /**
   * Get all sections from the current article
   */
  public getSections(): Array<{id: string, title: string, level: number}> | null {
    const article = this.getCurrentArticle();
    if (!article) return null;
    
    return article.sections.map(section => ({
      id: section.id,
      title: section.title,
      level: section.level
    }));
  }
  
  /**
   * Check if we're on a Wikipedia page
   */
  private isWikipediaPage(): boolean {
    return window.location.hostname.includes('wikipedia.org');
  }
  
  /**
   * Clear the article cache
   */
  public clearCache(): void {
    this.application.clearCache();
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number, articles: string[] } {
    const size = this.application.getCacheSize();
    const articles: string[] = [];
    
    // We'd need to expose this from the application
    return { size, articles };
  }
}