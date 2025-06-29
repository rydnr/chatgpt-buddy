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
 * Filename: express-app.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Main function: createApp
 *
 * Responsibilities:
 *   - Create and configure Express application
 *   - Set up HTTP endpoints for event handling
 *   - Provide infrastructure layer for HTTP communication
 *
 * Collaborators:
 *   - Express: Web framework
 *   - PingHandler: Domain logic for ping processing
 */

import express, { Request, Response } from 'express';
import { PingEvent } from '@chatgpt-buddy/core';
import { PingHandler } from '../domain/ping.handler';

/**
 * Request body interface for ping endpoint
 */
interface PingRequest {
  message: string;
  correlationId: string;
}

/**
 * Creates and configures the Express application with all routes and middleware
 * 
 * @returns Configured Express application instance
 */
export function createApp(): express.Application {
  const app = express();
  const pingHandler = new PingHandler();

  // Middleware
  app.use(express.json());

  /**
   * POST /api/ping - Accept ping requests and return pong responses
   */
  app.post('/api/ping', async (req: Request, res: Response) => {
    try {
      const body = req.body as PingRequest;

      // Validate required fields
      if (!body.message && body.message !== '') {
        return res.status(400).json({ 
          error: 'Missing required field: message' 
        });
      }

      if (!body.correlationId) {
        return res.status(400).json({ 
          error: 'Missing required field: correlationId' 
        });
      }

      // Create ping event from request
      const pingEvent = new PingEvent({
        message: body.message,
        correlationId: body.correlationId
      });

      // Process ping event through domain handler
      const pongEvent = await pingHandler.handle(pingEvent);

      // Return pong event as JSON response
      res.status(200).json(pongEvent.toJSON());

    } catch (error) {
      console.error('Error processing ping request:', error);
      res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  });

  return app;
}