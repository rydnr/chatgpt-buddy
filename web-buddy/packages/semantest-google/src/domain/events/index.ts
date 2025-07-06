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
 * @fileoverview Domain events index for Google domain
 * @author Semantest Team
 * @module domain/events
 */

export * from './search-requested.event';
export * from './search-completed.event';
export * from './search-failed.event';
export * from './result-clicked.event';

// Event name constants for easy reference
export const GoogleEventNames = {
  SEARCH_REQUESTED: 'google.search.requested',
  SEARCH_COMPLETED: 'google.search.completed',
  SEARCH_FAILED: 'google.search.failed',
  RESULT_CLICKED: 'google.result.clicked'
} as const;

// Type for all Google event names
export type GoogleEventName = typeof GoogleEventNames[keyof typeof GoogleEventNames];