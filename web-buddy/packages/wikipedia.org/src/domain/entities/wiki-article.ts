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
import { Entity } from '@typescript-eda/core';
import { ArticleId } from '../value-objects/article-id';
import { WikiSection } from './wiki-section';

export class WikiArticle extends Entity {
  private _id: ArticleId;
  private _title: string;
  private _url: string;
  private _content: string;
  private _sections: WikiSection[];
  private _lastModified: Date;
  
  constructor(
    id: ArticleId,
    title: string,
    url: string,
    content: string,
    sections: WikiSection[],
    lastModified: Date
  ) {
    super();
    this._id = id;
    this._title = title;
    this._url = url;
    this._content = content;
    this._sections = sections;
    this._lastModified = lastModified;
  }
  
  get id(): ArticleId {
    return this._id;
  }
  
  get title(): string {
    return this._title;
  }
  
  get url(): string {
    return this._url;
  }
  
  get content(): string {
    return this._content;
  }
  
  get sections(): WikiSection[] {
    return [...this._sections];
  }
  
  get lastModified(): Date {
    return this._lastModified;
  }
  
  public getSectionById(id: string): WikiSection | undefined {
    return this._sections.find(section => section.id === id);
  }
  
  public getMainContent(): string {
    const mainSection = this._sections.find(section => section.level === 0);
    return mainSection?.content || '';
  }
}