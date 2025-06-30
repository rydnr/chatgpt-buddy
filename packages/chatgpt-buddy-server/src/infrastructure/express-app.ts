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

const express = require('express');
import { Request, Response, Application } from 'express';
import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { PingEvent } from '../../../chatgpt-buddy-core/src/events/ping.event';
import { PingHandler } from '../domain/ping.handler';

// Simple in-memory storage for automations (for demo purposes)
const automationStorage = new Map<string, any>();

// Simple in-memory storage for user preferences
const userPreferences = new Map<string, any>();

// Enhanced automation storage with metadata
const automationMetadata = new Map<string, any>();

/**
 * Smart matching algorithm for automation requests
 */
function calculateAutomationMatchScore(automation: any, request: any): number {
  let score = 0;
  
  // Exact action match (40% weight) - required for meaningful match
  if (automation.action === request.payload.action) {
    score += 0.4;
  } else {
    // No action match means very low overall score
    return 0.1; // Return immediately with very low score
  }
  
  // Website match (30% weight)
  if (automation.website === request.website) {
    score += 0.3;
  } else if (automation.website && request.website) {
    // Partial domain match (e.g., google.com vs google.co.uk)
    const automationDomain = automation.website.split('.')[0];
    const requestDomain = request.website.split('.')[0];
    if (automationDomain === requestDomain) {
      score += 0.15; // Half points for partial match
    }
  }
  
  // Parameter compatibility (20% weight)
  const automationParams = automation.metadata?.elements?.map((e: any) => e.action) || [];
  const requestParams = Object.keys(request.payload.parameters || {});
  
  if (requestParams.length > 0 && automationParams.length > 0) {
    const compatibleParams = requestParams.filter(param => 
      automationParams.includes('fill') || automationParams.includes('click')
    );
    score += (compatibleParams.length / requestParams.length) * 0.2;
  } else if (requestParams.length > 0) {
    // If we have request params but no automation params metadata, assume compatibility
    score += 0.2;
  }
  
  // Context similarity (10% weight)
  if (request.payload.context) {
    if (automation.metadata?.context) {
      const contextKeys = Object.keys(request.payload.context);
      const matchingContext = contextKeys.filter(key => 
        automation.metadata.context[key] === request.payload.context[key]
      );
      score += (matchingContext.length / contextKeys.length) * 0.1;
    } else {
      // If we have request context but no automation context metadata, give full credit for exact matches
      score += 0.1;
    }
  } else {
    // If no context required, give full context score
    score += 0.1;
  }
  
  // Round to avoid floating point precision issues and cap at 1.0
  const roundedScore = Math.round(score * 100) / 100;
  return Math.min(roundedScore, 1.0);
}

/**
 * Request body interface for ping endpoint
 */
interface PingRequest {
  message: string;
  correlationId: string;
}

// Store WebSocket connections for browser extensions
const extensionConnections = new Map<string, any>();

/**
 * Creates and configures the Express application with all routes and middleware
 * 
 * @returns Configured Express application instance
 */
export function createApp(): Application {
  const app = express();
  const pingHandler = new PingHandler();

  // Middleware
  app.use(express.json());

  /**
   * POST /api/event - Accept Web-Buddy events and process them
   */
  app.post('/api/event', async (req: Request, res: Response) => {
    try {
      const event = req.body;

      // Validate basic event structure
      if (!event.type || !event.correlationId || !event.eventId) {
        return res.status(400).json({ 
          error: 'Invalid event: missing type, correlationId, or eventId' 
        });
      }

      // Handle user preference events
      if (event.type === 'userPreferenceSet') {
        const preference = {
          action: event.payload.action,
          website: event.payload.website,
          preference: event.payload.preference,
          doNotAskFor: event.payload.doNotAskFor,
          setAt: new Date(),
          expiresAt: event.payload.doNotAskFor 
            ? new Date(Date.now() + event.payload.doNotAskFor.value * 60 * 1000)
            : null
        };

        const prefKey = `${preference.action}:${preference.website}`;
        userPreferences.set(prefKey, preference);

        return res.status(200).json({
          success: true,
          data: {
            preferenceSet: true,
            preferenceId: prefKey,
            expiresAt: preference.expiresAt,
            message: `User preference for ${preference.action} on ${preference.website} saved`
          },
          correlationId: event.correlationId,
          eventId: event.eventId
        });
      }

      // Handle automation implementation events (save learned automations)
      if (event.type === 'automationImplemented') {
        const automationId = `auto-${Date.now()}`;
        const automation = {
          id: automationId,
          action: event.payload.action,
          website: event.website || 'unknown',
          playwrightScript: event.payload.playwrightScript,
          templatedScript: event.payload.templatedScript,
          metadata: {
            ...event.payload.metadata,
            confidence: 0.8,
            usageCount: 0,
            successCount: 0,
            totalExecutionTime: 0,
            lastUsed: null
          },
          savedAt: new Date()
        };

        const storageKey = `${automation.action}:${automation.website}`;
        automationStorage.set(storageKey, automation);
        automationMetadata.set(automationId, automation);

        return res.status(200).json({
          success: true,
          data: {
            stored: true,
            automationId: automation.id,
            message: `Automation for ${automation.action} on ${automation.website} saved`
          },
          correlationId: event.correlationId,
          eventId: event.eventId
        });
      }

      // Handle automation events by converting to ping for demo (special case first)
      if (event.type === 'automationRequested' && event.payload?.action === 'ping') {
        const pingEvent = new PingEvent({
          message: event.payload.parameters?.message || 'Web-Buddy ping',
          correlationId: event.correlationId
        });

        const pongEvent = await pingHandler.handle(pingEvent);
        
        return res.status(200).json({
          success: true,
          data: pongEvent.toJSON(),
          correlationId: event.correlationId,
          eventId: event.eventId
        });
      }

      // Handle automation request events (check for existing automations)
      if (event.type === 'automationRequested') {
        const action = event.payload.action;
        const website = event.website || 'unknown';
        
        // Smart matching: find all automations and calculate match scores
        const allAutomations = Array.from(automationStorage.values());
        const matches = allAutomations
          .map(automation => ({
            automation,
            score: calculateAutomationMatchScore(automation, event)
          }))
          .filter(match => match.score > 0.3) // Minimum 30% match
          .sort((a, b) => b.score - a.score); // Sort by score descending
        
        if (matches.length > 0) {
          const bestMatch = matches[0];
          const automation = bestMatch.automation;
          
          // Check user preferences first
          const prefKey = `${action}:${website}`;
          const userPref = userPreferences.get(prefKey);
          
          // Check if preference is still valid (not expired)
          const isValidPreference = userPref && 
            (!userPref.expiresAt || new Date() < userPref.expiresAt);
          
          if (isValidPreference && userPref.preference === 'alwaysReuse') {
            // Execute immediately based on user preference
            return res.status(200).json({
              success: true,
              data: {
                automationFound: true,
                executedImmediately: true,
                userPreferenceApplied: true,
                matchScore: bestMatch.score,
                automation: {
                  id: automation.id,
                  action: automation.action,
                  website: automation.website,
                  savedAt: automation.savedAt
                },
                executionResult: {
                  status: 'simulated-success',
                  message: 'Automation executed based on user preference'
                },
                message: `Auto-executed ${action} on ${website} based on user preference`
              },
              correlationId: event.correlationId,
              eventId: event.eventId
            });
          } else {
            // Found automation - offer to reuse or adapt
            const responseData: any = {
              automationFound: true,
              matchScore: bestMatch.score,
              automation: {
                id: automation.id,
                action: automation.action,
                website: automation.website,
                savedAt: automation.savedAt
              }
            };

            if (bestMatch.score >= 1.0) {
              // Perfect match - offer direct reuse
              responseData.reuseOffered = true;
              responseData.message = `Found perfect automation match for ${action} on ${website}`;
            } else if (bestMatch.score >= 0.8) {
              // Good match - offer to reuse
              responseData.reuseOffered = true;
              responseData.message = `Found good automation match (${Math.round(bestMatch.score * 100)}%) for ${action} on ${website}`;
            } else if (bestMatch.score >= 0.3) {
              // Partial match - suggest adaptation
              responseData.reuseOffered = true;
              responseData.adaptationSuggested = true;
              responseData.message = `Found similar automation (${Math.round(bestMatch.score * 100)}% match) that could be adapted`;
            } else {
              // Very low match - don't offer reuse
              responseData.reuseOffered = false;
              responseData.message = `Found weak automation match (${Math.round(bestMatch.score * 100)}% match) - recording new one recommended`;
            }

            return res.status(200).json({
              success: true,
              data: responseData,
              correlationId: event.correlationId,
              eventId: event.eventId
            });
          }
        } else {
          // No automation found - suggest recording
          return res.status(200).json({
            success: true,
            data: {
              automationFound: false,
              reuseOffered: false,
              recordingSuggested: true,
              message: `No automation found for ${action} on ${website}. Consider recording one.`
            },
            correlationId: event.correlationId,
            eventId: event.eventId
          });
        }
      }

      // Handle browser extension recording events
      if (event.type === 'recordingStarted') {
        const recordingId = event.payload.recordingId || `rec-${Date.now()}`;
        
        return res.status(200).json({
          success: true,
          data: {
            recordingAcknowledged: true,
            recordingId: recordingId,
            message: `Recording started for ${event.payload.actionType} on ${event.payload.targetUrl}`
          },
          correlationId: event.correlationId,
          eventId: event.eventId
        });
      }

      if (event.type === 'recordingCompleted') {
        const automationId = `auto-rec-${Date.now()}`;
        
        // Store the recorded automation
        let website = 'example.com';
        try {
          website = new URL(event.payload.targetUrl || 'https://example.com').hostname;
        } catch (e) {
          website = 'example.com';
        }
        
        const automation = {
          id: automationId,
          action: 'recorded-action',
          website: website,
          playwrightScript: event.payload.playwrightScript,
          templatedScript: event.payload.playwrightScript, // Would be templated in real implementation
          metadata: {
            recordedAt: new Date(),
            source: 'browser-extension',
            recordingId: event.payload.recordingId,
            actionsCount: event.payload.actions?.length || 0
          },
          savedAt: new Date()
        };

        const storageKey = `${automation.action}:${automation.website}`;
        automationStorage.set(storageKey, automation);

        return res.status(200).json({
          success: true,
          data: {
            automationCreated: true,
            automationId: automationId,
            actionsRecorded: event.payload.actions?.length || 0,
            message: `Automation created from recording ${event.payload.recordingId}`
          },
          correlationId: event.correlationId,
          eventId: event.eventId
        });
      }

      // Handle automation execution tracking
      if (event.type === 'automationExecuted') {
        const automationId = event.payload.automationId;
        const automation = automationMetadata.get(automationId);
        
        if (automation) {
          // Update usage statistics
          automation.metadata.usageCount++;
          automation.metadata.lastUsed = new Date();
          automation.metadata.totalExecutionTime += event.payload.executionTime || 0;
          
          if (event.payload.executionResult === 'success') {
            automation.metadata.successCount++;
          }
          
          // Recalculate confidence based on success rate
          const successRate = automation.metadata.successCount / automation.metadata.usageCount;
          automation.metadata.confidence = Math.min(0.95, 0.5 + (successRate * 0.45));
          
          // Update both storage maps
          const storageKey = `${automation.action}:${automation.website}`;
          automationStorage.set(storageKey, automation);
          automationMetadata.set(automationId, automation);
          
          return res.status(200).json({
            success: true,
            data: {
              usageRecorded: true,
              newUsageCount: automation.metadata.usageCount,
              newConfidence: automation.metadata.confidence,
              successRate: successRate
            },
            correlationId: event.correlationId,
            eventId: event.eventId
          });
        } else {
          return res.status(404).json({
            success: false,
            error: `Automation ${automationId} not found`,
            correlationId: event.correlationId,
            eventId: event.eventId
          });
        }
      }

      // Handle automation statistics requests
      if (event.type === 'automationStatsRequested') {
        const action = event.payload.action;
        const website = event.payload.website;
        const storageKey = `${action}:${website}`;
        
        const automation = automationStorage.get(storageKey);
        
        if (automation) {
          const stats = {
            automation: {
              id: automation.id,
              action: automation.action,
              website: automation.website,
              usageCount: automation.metadata.usageCount,
              confidence: automation.metadata.confidence,
              successRate: automation.metadata.usageCount > 0 
                ? automation.metadata.successCount / automation.metadata.usageCount 
                : 0,
              averageExecutionTime: automation.metadata.usageCount > 0
                ? automation.metadata.totalExecutionTime / automation.metadata.usageCount
                : 0,
              lastUsed: automation.metadata.lastUsed,
              savedAt: automation.savedAt
            }
          };
          
          return res.status(200).json({
            success: true,
            data: stats,
            correlationId: event.correlationId,
            eventId: event.eventId
          });
        } else {
          return res.status(404).json({
            success: false,
            error: `No automation found for ${action} on ${website}`,
            correlationId: event.correlationId,
            eventId: event.eventId
          });
        }
      }

      // Handle clear all automations (for testing)
      if (event.type === 'clearAllAutomations') {
        automationStorage.clear();
        automationMetadata.clear();
        userPreferences.clear();
        
        return res.status(200).json({
          success: true,
          data: {
            cleared: true,
            message: 'All automations and preferences cleared'
          },
          correlationId: event.correlationId,
          eventId: event.eventId
        });
      }

      // Handle ping events directly
      if (event.type === 'pingRequested') {
        const pingEvent = new PingEvent({
          message: event.payload?.message || 'Event ping',
          correlationId: event.correlationId
        });

        const pongEvent = await pingHandler.handle(pingEvent);
        
        return res.status(200).json({
          success: true,
          data: pongEvent.toJSON(),
          correlationId: event.correlationId,
          eventId: event.eventId
        });
      }

      // Default response for other event types
      res.status(200).json({
        success: true,
        data: {
          message: `Event ${event.type} received and processed`,
          eventId: event.eventId
        },
        correlationId: event.correlationId,
        eventId: event.eventId
      });

    } catch (error) {
      console.error('Error processing event:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        success: false
      });
    }
  });

  /**
   * POST /api/message - Legacy message endpoint (for backward compatibility)
   */
  app.post('/api/message', async (req: Request, res: Response) => {
    try {
      const message = req.body;

      // Convert legacy message to ping for processing
      const pingEvent = new PingEvent({
        message: message.message || 'Legacy message',
        correlationId: message.correlationId || 'legacy-unknown'
      });

      const pongEvent = await pingHandler.handle(pingEvent);

      res.status(200).json({
        success: true,
        data: pongEvent.toJSON()
      });

    } catch (error) {
      console.error('Error processing legacy message:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        success: false
      });
    }
  });

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

/**
 * Creates server with WebSocket support for browser extension communication
 * 
 * @param port Port to listen on
 * @returns HTTP server with WebSocket support
 */
export function createServerWithWebSocket(port: number): Server {
  const app = createApp();
  const server = new Server(app);
  
  // Create WebSocket server
  const wsServer = new WebSocketServer({ 
    server,
    path: '/ws'
  });
  
  wsServer.on('connection', (ws, request) => {
    console.log('🔌 Browser extension connected to WebSocket');
    let extensionId: string | null = null;
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received from extension:', message);
        
        // Handle extension registration
        if (message.type === 'extensionRegistered') {
          extensionId = message.payload.extensionId;
          extensionConnections.set(extensionId, ws);
          console.log(`✅ Extension registered: ${extensionId}`);
          
          // Send acknowledgment
          ws.send(JSON.stringify({
            type: 'registrationAck',
            correlationId: message.correlationId,
            payload: {
              status: 'registered',
              extensionId: extensionId
            }
          }));
        }
        
        // Handle heartbeat
        else if (message.type === 'heartbeat') {
          ws.send(JSON.stringify({
            type: 'heartbeatAck',
            correlationId: message.correlationId,
            timestamp: new Date().toISOString()
          }));
        }
        
        // Handle automation responses from extension
        else if (message.correlationId && message.status) {
          console.log('✅ Automation response from extension:', message);
          // In a real implementation, this would be forwarded back to the waiting client
        }
        
        // Handle other message types
        else {
          console.log('⚠️ Unknown message type from extension:', message.type);
        }
        
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      if (extensionId) {
        extensionConnections.delete(extensionId);
        console.log(`🔌 Extension disconnected: ${extensionId}`);
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  });
  
  // Start server
  server.listen(port, () => {
    console.log(`🚀 Server running on port ${port} with WebSocket support`);
  });
  
  return server;
}

/**
 * Send automation command to browser extension
 * 
 * @param extensionId Target extension ID
 * @param message Automation message to send
 */
export function sendToExtension(extensionId: string, message: any): boolean {
  const ws = extensionConnections.get(extensionId);
  
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
    console.log(`📤 Sent message to extension ${extensionId}:`, message);
    return true;
  } else {
    console.error(`❌ Extension ${extensionId} not connected or not ready`);
    return false;
  }
}