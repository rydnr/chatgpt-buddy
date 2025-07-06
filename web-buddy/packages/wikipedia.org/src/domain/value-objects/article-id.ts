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

export class ArticleId extends ValueObject {
  private readonly _value: string;
  
  constructor(value: string) {
    super();
    if (!value || value.trim().length === 0) {
      throw new Error('ArticleId cannot be empty');
    }
    this._value = value.trim();
  }
  
  get value(): string {
    return this._value;
  }
  
  public equals(other: ArticleId): boolean {
    return this._value === other._value;
  }
  
  public toString(): string {
    return this._value;
  }
  
  public static fromURL(url: string): ArticleId {
    const match = url.match(/\/wiki\/([^#?]+)/);
    if (!match || !match[1]) {
      throw new Error(`Invalid Wikipedia URL: ${url}`);
    }
    return new ArticleId(decodeURIComponent(match[1]));
  }
  
  public static fromTitle(title: string): ArticleId {
    return new ArticleId(title.replace(/\s+/g, '_'));
  }
}