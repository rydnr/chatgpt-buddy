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
 * @fileoverview This file defines the PrimaryPort interface, which is an interface for primary adapters.
 * @author rydnr
 * @module application/primary-port
 */

import { Application } from './application';

/**
 * Represents a primary port, which is an entry point to the application.
 */
export interface PrimaryPort {
  /**
   * Accepts the application instance and starts the primary adapter.
   * @param {Application} app The application instance.
   * @returns {Promise<void>} A promise that resolves when the primary adapter has started.
   */
  accept(app: Application): Promise<void>;
}
