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
import { Application, Listen } from '@typescript-eda/core';
import { ArticleRequestedEvent } from '../domain/events/article-requested-event';
import { ArticleLoadedEvent } from '../domain/events/article-loaded-event';
import { WikiArticle } from '../domain/entities/wiki-article';

export class WikipediaApplication extends Application {
  private currentArticle: WikiArticle | null = null;
  private articleCache: Map<string, WikiArticle> = new Map();
  
  @Listen(ArticleRequestedEvent)
  public async onArticleRequested(event: ArticleRequestedEvent): Promise<void> {
    console.log(`Article requested: ${event.articleId.value}`);
    
    // Check cache first
    const cachedArticle = this.articleCache.get(event.articleId.value);
    if (cachedArticle) {
      console.log(`Returning cached article: ${event.articleId.value}`);
      this.currentArticle = cachedArticle;
      this.accept(new ArticleLoadedEvent(cachedArticle, 0));
      return;
    }
    
    // Navigate to the article
    console.log(`Navigating to: ${event.url.value}`);
    // Navigation will be handled by the DOM adapter
  }
  
  @Listen(ArticleLoadedEvent)
  public async onArticleLoaded(event: ArticleLoadedEvent): Promise<void> {
    console.log(`Article loaded: ${event.article.title} in ${event.loadTime}ms`);
    
    this.currentArticle = event.article;
    this.articleCache.set(event.article.id.value, event.article);
    
    // Limit cache size
    if (this.articleCache.size > 50) {
      const firstKey = this.articleCache.keys().next().value;
      if (firstKey) {
        this.articleCache.delete(firstKey);
      }
    }
    
    console.log(`Article sections: ${event.article.sections.length}`);
    event.article.sections.forEach(section => {
      console.log(`- ${section.title} (level ${section.level})`);
    });
  }
  
  public getCurrentArticle(): WikiArticle | null {
    return this.currentArticle;
  }
  
  public getCachedArticle(articleId: string): WikiArticle | undefined {
    return this.articleCache.get(articleId);
  }
  
  public clearCache(): void {
    this.articleCache.clear();
    this.currentArticle = null;
  }
  
  public getCacheSize(): number {
    return this.articleCache.size;
  }
}