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
 * @fileoverview This file defines the Ports class, a singleton for managing port implementations.
 * @author rydnr
 * @module domain/ports
 */

import { Port } from './port';

/**
 * A singleton class for managing port implementations.
 */
export class Ports {
  private static readonly ports = new Map<string, Port>();

  /**
   * Retrieves the implementation of a port.
   * @template T The type of the port.
   * @param {new (...args: unknown[]) => T} port The port to retrieve.
   * @returns {T} The implementation of the port.
   * @throws {Error} If the port is not found.
   */
  public static get<T extends Port>(port: new (...args: unknown[]) => T): T {
    const implementation = this.ports.get(port.name);
    if (!implementation) {
      throw new Error(`Port ${port.name} not found`);
    }
    return implementation as T;
  }

  /**
   * Sets the implementation of a port.
   * @template T The type of the port.
   * @param {new (...args: unknown[]) => T} port The port to set.
   * @param {T} implementation The implementation of the port.
   */
  public static set<T extends Port>(port: new (...args: unknown[]) => T, implementation: T): void {
    this.ports.set(port.name, implementation);
  }

  /**
   * Clears all port implementations.
   */
  public static clear(): void {
    this.ports.clear();
  }
}
