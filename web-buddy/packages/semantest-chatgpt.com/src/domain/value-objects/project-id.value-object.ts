/*
                       @semantest/chatgpt.com

  Copyright (C) 2025-today  Semantest Team

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * @fileoverview Project ID value object
 * @author Semantest Team
 * @module domain/value-objects/project-id
 */

import { ValueObject } from 'typescript-eda-domain';
import { v4 as uuidv4 } from 'uuid';

/**
 * Properties for ProjectId value object
 */
export interface ProjectIdProps {
  readonly value: string;
}

/**
 * ProjectId value object
 * Ensures project IDs are valid and consistent
 */
export class ProjectId extends ValueObject<ProjectIdProps> {

  /**
   * Create a new project ID
   */
  static create(id?: string): ProjectId {
    const value = id || uuidv4();
    
    if (!this.isValid(value)) {
      throw new Error(`Invalid project ID format: ${value}`);
    }

    return new ProjectId({ value });
  }

  /**
   * Create from existing project ID string
   */
  static fromString(id: string): ProjectId {
    return this.create(id);
  }

  /**
   * Create from project name (for ChatGPT projects)
   */
  static fromName(name: string): ProjectId {
    if (!name || name.trim().length === 0) {
      throw new Error('Project name cannot be empty');
    }

    // Convert name to a valid ID format
    const normalizedName = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (normalizedName.length === 0) {
      throw new Error('Project name must contain alphanumeric characters');
    }

    return new ProjectId({ value: normalizedName });
  }

  /**
   * Generate a new random project ID
   */
  static generate(): ProjectId {
    return this.create();
  }

  /**
   * Validate project ID format
   */
  private static isValid(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    // Allow UUID format, normalized names, or ChatGPT-style IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const normalizedNameRegex = /^[a-z0-9-]+$/;
    const chatgptIdRegex = /^[a-zA-Z0-9_-]+$/;
    
    return uuidRegex.test(id) || 
           (normalizedNameRegex.test(id) && id.length >= 2 && id.length <= 100) ||
           (chatgptIdRegex.test(id) && id.length >= 2 && id.length <= 100);
  }

  /**
   * Get the project ID value
   */
  getValue(): string {
    return this.props.value;
  }

  /**
   * Check if this is a UUID
   */
  isUUID(): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(this.props.value);
  }

  /**
   * Check if this is a normalized name
   */
  isNormalizedName(): boolean {
    const normalizedNameRegex = /^[a-z0-9-]+$/;
    return normalizedNameRegex.test(this.props.value);
  }

  /**
   * Get display name (convert back from normalized format)
   */
  getDisplayName(): string {
    if (this.isNormalizedName()) {
      return this.props.value
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return this.props.value;
  }

  /**
   * Get shortened display version
   */
  getShortId(): string {
    return this.props.value.length > 20 
      ? `${this.props.value.substring(0, 17)}...`
      : this.props.value;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this.props.value;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): string {
    return this.props.value;
  }
}