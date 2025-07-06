"use strict";
/*
                        Web-Buddy Server

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
exports.createWebBuddyServer = createWebBuddyServer;
const server_1 = require("./server");
/**
 * Factory function to create a configured WebBuddyServer
 *
 * @param config - Server configuration options
 * @returns Configured WebBuddyServer instance
 *
 * @example
 * ```typescript
 * const server = createWebBuddyServer({
 *   port: 3000,
 *   cors: {
 *     enabled: true,
 *     origins: ['http://localhost:3000', 'https://chatgpt.com']
 *   },
 *   authentication: {
 *     enabled: true,
 *     apiKeys: ['your-api-key']
 *   }
 * });
 *
 * await server.start();
 * ```
 */
function createWebBuddyServer(config = {}) {
    return new server_1.WebBuddyServer(config);
}
//# sourceMappingURL=factory.js.map