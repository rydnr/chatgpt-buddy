/**
 * Wikipedia-Buddy - Wikipedia automation client
 *
 * Provides convenient TypeScript interfaces for automating Wikipedia research and navigation
 */
export { WikipediaBuddyClient } from './client';
export { WikipediaHandler } from './handlers';
export { WikipediaMessages, type WikipediaMessageType, type WikipediaArticle, type WikipediaSearchResult, type WikipediaSection, type WikipediaLink, type WikipediaReference, type WikipediaCategory, type WikipediaInfobox, type WikipediaResponse, type ResearchSession } from './messages';
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
export declare function createWikipediaBuddyClient(serverUrl: string, config?: {
    apiKey?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}): WikipediaBuddyClient;
/**
 * Version information
 */
export declare const VERSION = "1.0.0";
//# sourceMappingURL=index.d.ts.map