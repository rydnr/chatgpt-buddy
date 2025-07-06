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
import { ValueObject } from '@typescript-eda/core';
import { ArticleId } from './article-id';

export class WikiURL extends ValueObject {
  private readonly _value: string;
  private readonly _language: string;
  
  constructor(value: string) {
    super();
    const url = this.validateAndNormalize(value);
    this._value = url;
    this._language = this.extractLanguage(url);
  }
  
  private validateAndNormalize(url: string): string {
    if (!url || url.trim().length === 0) {
      throw new Error('WikiURL cannot be empty');
    }
    
    const trimmedUrl = url.trim();
    const wikiPattern = /^https?:\/\/([a-z]{2,})\.wikipedia\.org\//;
    
    if (!wikiPattern.test(trimmedUrl)) {
      throw new Error(`Invalid Wikipedia URL: ${trimmedUrl}`);
    }
    
    // Normalize to HTTPS
    return trimmedUrl.replace(/^http:/, 'https:');
  }
  
  private extractLanguage(url: string): string {
    const match = url.match(/https:\/\/([a-z]{2,})\.wikipedia\.org/);
    return match ? match[1] : 'en';
  }
  
  get value(): string {
    return this._value;
  }
  
  get language(): string {
    return this._language;
  }
  
  public equals(other: WikiURL): boolean {
    return this._value === other._value;
  }
  
  public toString(): string {
    return this._value;
  }
  
  public getArticleId(): ArticleId {
    return ArticleId.fromURL(this._value);
  }
  
  public static forArticle(articleId: ArticleId, language: string = 'en'): WikiURL {
    const encodedId = encodeURIComponent(articleId.value);
    return new WikiURL(`https://${language}.wikipedia.org/wiki/${encodedId}`);
  }
  
  public static forSearch(query: string, language: string = 'en'): WikiURL {
    const encodedQuery = encodeURIComponent(query);
    return new WikiURL(`https://${language}.wikipedia.org/w/index.php?search=${encodedQuery}`);
  }
}