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
 * @fileoverview This file defines the @listen decorator, which is used to mark methods as event listeners.
 * @author rydnr
 * @module domain/listen.decorator
 */

import { Event } from './event';

/**
 * A method decorator that marks a method as an event listener.
 * @param {Event} event The event to listen for.
 * @returns {MethodDecorator} The method decorator.
 */
export function listen(event: Event): MethodDecorator {
  return (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    if (!Reflect.hasMetadata('listeners', target.constructor)) {
      Reflect.defineMetadata('listeners', [], target.constructor);
    }
    const listeners = Reflect.getMetadata('listeners', target.constructor);
    listeners.push({
      event,
      propertyKey,
      descriptor,
    });
  };
}
