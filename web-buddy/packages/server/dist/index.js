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
exports.createWebBuddyServer = exports.WebBuddyServer = void 0;
var server_1 = require("./server");
Object.defineProperty(exports, "WebBuddyServer", { enumerable: true, get: function () { return server_1.WebBuddyServer; } });
var factory_1 = require("./factory");
Object.defineProperty(exports, "createWebBuddyServer", { enumerable: true, get: function () { return factory_1.createWebBuddyServer; } });
// CLI entry point
if (require.main === module) {
    const { WebBuddyServer } = require('./server');
    const server = new WebBuddyServer({
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || 'localhost',
        logging: {
            level: process.env.LOG_LEVEL || 'info'
        }
    });
    // Graceful shutdown
    const shutdown = async () => {
        console.log('\n🛑 Shutting down Web-Buddy Server...');
        await server.stop();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    // Start server
    server.start().then(() => {
        const status = server.getStatus();
        console.log(`🚀 Web-Buddy Server running on port ${status.port}`);
        console.log(`📡 HTTP API: http://localhost:${status.port}/health`);
        console.log(`🔌 WebSocket: ws://localhost:${status.port}/ws`);
        console.log('📖 Press Ctrl+C to stop');
    }).catch((error) => {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map