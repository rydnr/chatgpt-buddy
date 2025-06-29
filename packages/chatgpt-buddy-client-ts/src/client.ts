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
 * Filename: client.ts
 *
 * Author: Claude Code (Anthropic)
 *
 * Class name: ChatGPTBuddyClient
 *
 * Responsibilities:
 *   - Provide TypeScript SDK for ChatGPT Buddy server communication
 *   - Handle HTTP requests to server endpoints
 *   - Generate correlation IDs and manage request-response flow
 *   - Expose simple API for ping-pong operations
 *
 * Collaborators:
 *   - axios: HTTP client library
 *   - PongEvent: Response event type
 */

import axios, { AxiosInstance } from 'axios';
import { PongEvent } from '@chatgpt-buddy/core';

/**
 * Configuration interface for the ChatGPT Buddy client
 */
export interface ClientConfig {
  readonly serverUrl: string;
  readonly timeout?: number;
}

/**
 * Response interface that matches the server's JSON response
 */
interface PongResponse {
  type: string;
  correlationId: string;
  payload: {
    originalMessage: string;
    responseMessage: string;
  };
  timestamp: string;
}

/**
 * TypeScript client SDK for communicating with the ChatGPT Buddy server.
 * Provides a simple interface for sending ping requests and receiving pong responses.
 */
export class ChatGPTBuddyClient {
  private readonly httpClient: AxiosInstance;

  /**
   * Creates a new ChatGPT Buddy client instance
   * 
   * @param config - Client configuration including server URL
   */
  constructor(private readonly config: ClientConfig) {
    this.httpClient = axios.create({
      baseURL: config.serverUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Sends a ping message to the server and receives a pong response
   * 
   * @param message - The message to send in the ping
   * @returns Promise resolving to the pong response
   */
  public async ping(message: string): Promise<PongResponse> {
    // Generate unique correlation ID
    const correlationId = this.generateCorrelationId();

    // Send ping request
    const response = await this.httpClient.post<PongResponse>('/api/ping', {
      message,
      correlationId
    });

    return response.data;
  }

  /**
   * Generates a unique correlation ID for request tracking
   * 
   * @returns Unique correlation ID string
   */
  private generateCorrelationId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}