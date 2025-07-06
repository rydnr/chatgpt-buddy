/*
 * Copyright 2025-today Semantest Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Main exports for @semantest/google.com package
 * @author Semantest Team
 * @module @semantest/google.com
 */

// Re-export all layers
export * from './domain';
export * from './infrastructure';
export * from './application';

// Legacy compatibility
export { GoogleBuddyClient } from './google-buddy-client';
export type { 
  GoogleBuddyClientConfig,
  SearchResponse 
} from './google-buddy-client';

// Quick access to key classes
export { SearchQuery } from './domain/value-objects/search-query';
export { SearchResult } from './domain/entities/search-result';
export { GoogleSearch, SearchStatus } from './domain/entities/google-search';
export { GoogleApplication } from './application/google-application';
export { GoogleCommunicationAdapter } from './infrastructure/adapters/google-communication-adapter';
export { GoogleSearchAdapter } from './infrastructure/adapters/google-search-adapter';

// Event constants for convenience
export { GoogleEventNames } from './domain/events';

// Package metadata
export const PACKAGE_NAME = '@semantest/google.com';
export const PACKAGE_VERSION = '2.0.0';