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
 * @fileoverview This file defines the Event class, a base class for domain events.
 * @author rydnr
 * @module domain/event
 */

/**
 * Represents a domain event, which is something that has happened in the past.
 */
export class Event {
  /**
   * Creates an instance of Event.
   * @param {unknown} payload The payload of the event.
   */
  constructor(public readonly payload: unknown) {}
}
