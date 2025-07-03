// Copyright 2021-2024 The Connect Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview This file defines the ValueObject class, a base class for objects that are defined by their properties, not by an identifier.
 * @author rydnr
 * @module domain/value-object
 */

/**
 * Represents a value object, which is an object defined by its properties rather than a unique identifier.
 * @template T The type of the properties of the value object.
 */
export abstract class ValueObject<T> {
  /**
   * Creates an instance of ValueObject.
   * @param {T} props The properties of the value object.
   * @protected
   */
  protected constructor(protected readonly props: T) {}

  /**
   * Compares this value object with another for equality.
   * @param {ValueObject<T>} [vo] The value object to compare with.
   * @returns {boolean} True if the value objects are equal, false otherwise.
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
