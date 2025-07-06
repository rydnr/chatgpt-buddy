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
import { Event } from '@typescript-eda/core';
import { ArticleId } from '../value-objects/article-id';
import { WikiURL } from '../value-objects/wiki-url';

export class ArticleRequestedEvent extends Event {
  private _articleId: ArticleId;
  private _url: WikiURL;
  private _requestedAt: Date;
  
  constructor(articleId: ArticleId, url: WikiURL) {
    super();
    this._articleId = articleId;
    this._url = url;
    this._requestedAt = new Date();
  }
  
  get articleId(): ArticleId {
    return this._articleId;
  }
  
  get url(): WikiURL {
    return this._url;
  }
  
  get requestedAt(): Date {
    return this._requestedAt;
  }
  
  public static fromTitle(title: string, language: string = 'en'): ArticleRequestedEvent {
    const articleId = ArticleId.fromTitle(title);
    const url = WikiURL.forArticle(articleId, language);
    return new ArticleRequestedEvent(articleId, url);
  }
  
  public static fromURL(url: string): ArticleRequestedEvent {
    const wikiUrl = new WikiURL(url);
    const articleId = wikiUrl.getArticleId();
    return new ArticleRequestedEvent(articleId, wikiUrl);
  }
}