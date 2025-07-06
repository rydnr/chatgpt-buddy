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
import { PrimaryPort } from '@typescript-eda/core';
import { WikiArticle } from '../../domain/entities/wiki-article';
import { WikiSection } from '../../domain/entities/wiki-section';
import { ArticleId } from '../../domain/value-objects/article-id';
import { WikipediaApplication } from '../../application/wikipedia-application';
import { ArticleLoadedEvent } from '../../domain/events/article-loaded-event';

export class WikipediaDOMAdapter extends PrimaryPort<WikipediaApplication> {
  constructor(application: WikipediaApplication) {
    super(application);
  }
  
  public extractArticle(): WikiArticle | null {
    const startTime = Date.now();
    
    try {
      const articleElement = document.getElementById('content');
      if (!articleElement) {
        console.error('Article content not found');
        return null;
      }
      
      const title = this.extractTitle();
      const articleId = ArticleId.fromTitle(title);
      const url = window.location.href;
      const content = this.extractContent();
      const sections = this.extractSections();
      const lastModified = this.extractLastModified();
      
      const article = new WikiArticle(
        articleId,
        title,
        url,
        content,
        sections,
        lastModified
      );
      
      const loadTime = Date.now() - startTime;
      this.application.accept(new ArticleLoadedEvent(article, loadTime));
      
      return article;
    } catch (error) {
      console.error('Error extracting article:', error);
      return null;
    }
  }
  
  private extractTitle(): string {
    const titleElement = document.querySelector('.mw-page-title-main');
    if (!titleElement) {
      throw new Error('Article title not found');
    }
    return titleElement.textContent?.trim() || '';
  }
  
  private extractContent(): string {
    const contentElement = document.querySelector('.mw-parser-output');
    if (!contentElement) {
      return '';
    }
    
    // Clone to avoid modifying the DOM
    const contentClone = contentElement.cloneNode(true) as HTMLElement;
    
    // Remove navigation boxes, references, etc.
    const elementsToRemove = contentClone.querySelectorAll(
      '.navbox, .mw-editsection, .reference, .reflist, .citation'
    );
    elementsToRemove.forEach(el => el.remove());
    
    return contentClone.textContent?.trim() || '';
  }
  
  private extractSections(): WikiSection[] {
    const sections: WikiSection[] = [];
    const contentElement = document.querySelector('.mw-parser-output');
    
    if (!contentElement) {
      return sections;
    }
    
    // Extract main content before first heading
    const mainContent = this.extractMainSectionContent(contentElement);
    if (mainContent) {
      sections.push(new WikiSection('main', 'Introduction', mainContent, 0));
    }
    
    // Extract all sections with headings
    const headings = contentElement.querySelectorAll('h2, h3, h4, h5, h6');
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1)) - 1;
      const title = heading.textContent?.replace(/\[edit\]/g, '').trim() || '';
      const content = this.extractSectionContent(heading);
      const id = `section-${index}`;
      
      sections.push(new WikiSection(id, title, content, level));
    });
    
    return this.buildSectionHierarchy(sections);
  }
  
  private extractMainSectionContent(container: Element): string {
    let content = '';
    let currentElement = container.firstElementChild;
    
    while (currentElement && !currentElement.matches('h2, h3, h4, h5, h6')) {
      if (currentElement.matches('p, ul, ol, dl')) {
        content += currentElement.textContent?.trim() + '\n\n';
      }
      currentElement = currentElement.nextElementSibling;
    }
    
    return content.trim();
  }
  
  private extractSectionContent(heading: Element): string {
    let content = '';
    let currentElement = heading.nextElementSibling;
    
    while (currentElement && !currentElement.matches('h2, h3, h4, h5, h6')) {
      if (currentElement.matches('p, ul, ol, dl')) {
        content += currentElement.textContent?.trim() + '\n\n';
      }
      currentElement = currentElement.nextElementSibling;
    }
    
    return content.trim();
  }
  
  private buildSectionHierarchy(flatSections: WikiSection[]): WikiSection[] {
    const rootSections: WikiSection[] = [];
    const sectionStack: WikiSection[] = [];
    
    for (const section of flatSections) {
      while (sectionStack.length > 0 && 
             sectionStack[sectionStack.length - 1].level >= section.level) {
        sectionStack.pop();
      }
      
      if (sectionStack.length === 0) {
        rootSections.push(section);
      } else {
        const parent = sectionStack[sectionStack.length - 1];
        (parent as any)._subsections.push(section);
      }
      
      sectionStack.push(section);
    }
    
    return rootSections;
  }
  
  private extractLastModified(): Date {
    const lastModElement = document.querySelector('#footer-info-lastmod');
    if (lastModElement) {
      const dateMatch = lastModElement.textContent?.match(/(\d{1,2}\s+\w+\s+\d{4})/);
      if (dateMatch) {
        return new Date(dateMatch[1]);
      }
    }
    return new Date();
  }
  
  public navigateToArticle(articleId: ArticleId): void {
    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(articleId.value)}`;
    window.location.href = url;
  }
  
  public search(query: string): void {
    const searchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
    window.location.href = searchUrl;
  }
  
  public getSearchResults(): Array<{title: string, snippet: string, url: string}> {
    const results: Array<{title: string, snippet: string, url: string}> = [];
    const resultElements = document.querySelectorAll('.mw-search-result');
    
    resultElements.forEach(element => {
      const titleElement = element.querySelector('.mw-search-result-heading a');
      const snippetElement = element.querySelector('.searchresult');
      
      if (titleElement && snippetElement) {
        results.push({
          title: titleElement.textContent?.trim() || '',
          snippet: snippetElement.textContent?.trim() || '',
          url: (titleElement as HTMLAnchorElement).href
        });
      }
    });
    
    return results;
  }
}