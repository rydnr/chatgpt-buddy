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
 * @fileoverview Domain layer exports for Google domain
 * @author Semantest Team
 * @module domain
 */

// Value Objects
export * from './value-objects/search-query';

// Entities
export * from './entities/search-result';
export * from './entities/google-search';

// Events
export * from './events';

// Domain types
export type { GoogleSearchProps } from './entities/google-search';
export type { SearchResultProps } from './entities/search-result';