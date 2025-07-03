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
 * @fileoverview This file defines the Application class, the base class for all applications.
 * @author rydnr
 * @module application/application
 */

import { Event } from '../domain/event';
import { PrimaryPort } from './primary-port';
import { Ports } from '../domain/ports';

/**
 * Represents the base class for all applications.
 */
export abstract class Application {
  /**
   * A map of metadata for the application.
   * @abstract
   */
  public abstract readonly metadata: Map<string, unknown>;

  /**
   * Handles one or more events, processing them and any resulting events.
   * @param {Event | Event[]} events The event or events to handle.
   * @returns {Promise<void>} A promise that resolves when all events have been handled.
   */
  public async handle(events: Event | Event[]): Promise<void> {
    const eventQueue = Array.isArray(events) ? events : [events];
    while (eventQueue.length > 0) {
      const event = eventQueue.shift();
      if (!event) {
        continue;
      }
      const listeners = Reflect.getMetadata('listeners', this.constructor);
      for (const listener of listeners) {
        if (event.constructor.name === listener.event.constructor.name) {
          const result = await listener.descriptor.value.call(this, event);
          if (result) {
            eventQueue.push(...(Array.isArray(result) ? result : [result]));
          }
        }
      }
    }
  }

  /**
   * Starts the application, initializing all adapters and primary ports.
   * @returns {Promise<void>} A promise that resolves when the application has started.
   */
  public async start(): Promise<void> {
    const adapters = Reflect.getMetadata('adapters', this.constructor);
    for (const adapter of adapters) {
      const port = Reflect.getMetadata('port', adapter);
      if (port) {
        Ports.set(port, new adapter());
      }
    }
    const primaryPorts = adapters.filter((adapter) => {
      return new adapter() instanceof PrimaryPort;
    });
    for (const primaryPort of primaryPorts) {
      await new primaryPort().accept(this);
    }
  }
}
