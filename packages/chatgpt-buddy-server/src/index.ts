/*
                        ChatGPT-Buddy

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
/******************************************************************************
 *
 * Filename: index.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Main function: main
 *
 * Responsibilities:
 *   - Bootstrap the ChatGPT Buddy server application
 *   - Start HTTP server listening on configured port
 *   - Handle graceful shutdown
 *
 * Collaborators:
 *   - Express app: HTTP server infrastructure
 */

import { createApp } from './infrastructure/express-app';

/**
 * Server configuration
 */
const PORT = process.env.PORT || 3000;

/**
 * Main function to start the ChatGPT Buddy server
 */
async function main(): Promise<void> {
  try {
    // Create Express application
    const app = createApp();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`ChatGPT Buddy server listening on port ${PORT}`);
      console.log(`Ping endpoint available at: http://localhost:${PORT}/api/ping`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}