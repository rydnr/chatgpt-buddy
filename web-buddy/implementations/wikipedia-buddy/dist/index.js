"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.WikipediaMessages = exports.WikipediaHandler = exports.WikipediaBuddyClient = void 0;
exports.createWikipediaBuddyClient = createWikipediaBuddyClient;
/**
 * Wikipedia-Buddy - Wikipedia automation client
 *
 * Provides convenient TypeScript interfaces for automating Wikipedia research and navigation
 */
// Export main client class
var client_1 = require("./client");
Object.defineProperty(exports, "WikipediaBuddyClient", { enumerable: true, get: function () { return client_1.WikipediaBuddyClient; } });
// Export handlers for extension development  
var handlers_1 = require("./handlers");
Object.defineProperty(exports, "WikipediaHandler", { enumerable: true, get: function () { return handlers_1.WikipediaHandler; } });
// Export message types and interfaces
var messages_1 = require("./messages");
Object.defineProperty(exports, "WikipediaMessages", { enumerable: true, get: function () { return messages_1.WikipediaMessages; } });
// Import dependencies for factory function
const core_1 = require("@web-buddy/core");
const client_2 = require("./client");
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
function createWikipediaBuddyClient(serverUrl, config) {
    const webBuddyClient = (0, core_1.createWebBuddyClient)({
        serverUrl,
        ...config
    });
    return new client_2.WikipediaBuddyClient(webBuddyClient);
}
/**
 * Version information
 */
exports.VERSION = '1.0.0';
//# sourceMappingURL=index.js.map