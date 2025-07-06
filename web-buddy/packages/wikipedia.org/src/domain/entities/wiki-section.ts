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

export class WikiSection extends Entity {
  private _id: string;
  private _title: string;
  private _content: string;
  private _level: number;
  private _subsections: WikiSection[];
  
  constructor(
    id: string,
    title: string,
    content: string,
    level: number,
    subsections: WikiSection[] = []
  ) {
    super();
    this._id = id;
    this._title = title;
    this._content = content;
    this._level = level;
    this._subsections = subsections;
  }
  
  get id(): string {
    return this._id;
  }
  
  get title(): string {
    return this._title;
  }
  
  get content(): string {
    return this._content;
  }
  
  get level(): number {
    return this._level;
  }
  
  get subsections(): WikiSection[] {
    return [...this._subsections];
  }
  
  public hasSubsections(): boolean {
    return this._subsections.length > 0;
  }
  
  public getFullContent(): string {
    let fullContent = this._content;
    for (const subsection of this._subsections) {
      fullContent += '\n' + subsection.getFullContent();
    }
    return fullContent;
  }
}