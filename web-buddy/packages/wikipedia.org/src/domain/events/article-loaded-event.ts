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
import { WikiArticle } from '../entities/wiki-article';

export class ArticleLoadedEvent extends Event {
  private _article: WikiArticle;
  private _loadedAt: Date;
  private _loadTime: number;
  
  constructor(article: WikiArticle, loadTime: number) {
    super();
    this._article = article;
    this._loadTime = loadTime;
    this._loadedAt = new Date();
  }
  
  get article(): WikiArticle {
    return this._article;
  }
  
  get loadedAt(): Date {
    return this._loadedAt;
  }
  
  get loadTime(): number {
    return this._loadTime;
  }
  
  public isRecent(maxAgeMinutes: number = 30): boolean {
    const ageInMinutes = (Date.now() - this._loadedAt.getTime()) / (1000 * 60);
    return ageInMinutes <= maxAgeMinutes;
  }
}