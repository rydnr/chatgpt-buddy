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
 * @fileoverview This file defines the decorators for the application layer.
 * @author rydnr
 * @module application/decorators
 */

/**
 * A class decorator that enables an adapter for the application.
 * @param {unknown} adapter The adapter to enable.
 * @returns {ClassDecorator} The class decorator.
 */
export function Enable(adapter: unknown): ClassDecorator {
  return (target: unknown) => {
    if (!Reflect.hasMetadata('adapters', target)) {
      Reflect.defineMetadata('adapters', [], target);
    }
    const adapters = Reflect.getMetadata('adapters', target);
    adapters.push(adapter);
  };
}
