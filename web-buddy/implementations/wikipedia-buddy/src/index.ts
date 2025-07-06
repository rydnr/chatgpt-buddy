/*
                       Wikipedia-Buddy

   Copyright (C) 2025-today  rydnr@acm-sl.org

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * Wikipedia-Buddy - Wikipedia automation client
 * 
 * Provides convenient TypeScript interfaces for automating Wikipedia research and navigation
 */

// Export main client class
export { WikipediaBuddyClient } from './client';

// Export handlers for extension development  
export { WikipediaHandler } from './handlers';

// Export message types and interfaces
export {
  WikipediaMessages,
  type WikipediaMessageType,
  type WikipediaArticle,
  type WikipediaSearchResult,
  type WikipediaSection,
  type WikipediaLink,
  type WikipediaReference,
  type WikipediaCategory,
  type WikipediaInfobox,
  type WikipediaResponse,
  type ResearchSession
} from './messages';

// Import dependencies for factory function
import { createWebBuddyClient } from '@web-buddy/core';
import { WikipediaBuddyClient } from './client';

/**
 * Factory function to create a configured WikipediaBuddyClient
 * 
 * @param serverUrl - URL of the Web-Buddy server
 * @param config - Additional configuration options
 * @returns Configured WikipediaBuddyClient instance
 * 
 * @example
 * ```typescript
 * const wikipedia = createWikipediaBuddyClient('http://localhost:3000', {
 *   apiKey: 'your-api-key',
 *   timeout: 10000
 * });
 * 
 * // Quick research
 * const research = await wikipedia.quickResearch('Artificial Intelligence');
 * console.log(research.summary);
 * 
 * // Deep research with related articles
 * const session = await wikipedia.deepResearch('Machine Learning', {
 *   maxDepth: 3,
 *   maxArticles: 10
 * });
 * 
 * // Compare multiple topics
 * const comparison = await wikipedia.compareArticles([
 *   'Artificial Intelligence',
 *   'Machine Learning', 
 *   'Deep Learning'
 * ]);
 * ```
 */
export function createWikipediaBuddyClient(
  serverUrl: string,
  config?: {
    apiKey?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  }
): WikipediaBuddyClient {
  const webBuddyClient = createWebBuddyClient({
    serverUrl,
    ...config
  });
  
  return new WikipediaBuddyClient(webBuddyClient);
}

/**
 * Version information
 */
export const VERSION = '1.0.0';