import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import WebSocket from 'ws';
import { AgentMessage, ActionResponse } from '../../shared/types';
import logger from './logger';

// --- Configuration ---
// In a production environment, use environment variables
const PORT = process.env.PORT || 3000;
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'your-super-secret-client-key';
const EXTENSION_SECRET = process.env.EXTENSION_SECRET || 'your-super-secret-extension-key';

// --- Interfaces ---
interface DispatchPayload {
  target: {
    extensionId: string;
    tabId: number;
  };
  message: AgentMessage;
}

// --- Express App Setup ---
const app = express();
app.use(express.json());

// --- WebSocket Server Setup ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const extensionConnections = new Map<string, WebSocket>();

// --- Middleware for API Authentication ---
const clientAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication failed: Missing or invalid Authorization header');
    return res.status(401).json({ error: 'Unauthorized: Missing API key' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== CLIENT_SECRET) {
    logger.warn('Authentication failed: Invalid API key');
    return res.status(403).json({ error: 'Forbidden: Invalid API key' });
  }

  next();
};

// --- WebSocket Connection Handling ---
wss.on('connection', (ws: WebSocket, req) => {
  logger.info('A new WebSocket client is attempting to connect.');

  const timeout = setTimeout(() => {
    logger.warn('WebSocket connection timed out due to missing authentication.');
    ws.close();
  }, 10000); // 10-second timeout for authentication

  ws.on('message', (message: string) => {
    try {
      const parsedMessage = JSON.parse(message);

      // 1. Handle Registration & Authentication
      if (parsedMessage.type === 'REGISTER' && parsedMessage.extensionId && parsedMessage.secret) {
        if (parsedMessage.secret !== EXTENSION_SECRET) {
          logger.warn('WebSocket authentication failed: Invalid extension secret.', { extensionId: parsedMessage.extensionId });
          ws.close();
          return;
        }
        
        clearTimeout(timeout); // Authentication successful, clear the timeout
        extensionConnections.set(parsedMessage.extensionId, ws);
        logger.info('Extension registered successfully.', { extensionId: parsedMessage.extensionId });
        return;
      }

      // 2. Handle Responses from Authenticated Extensions
      const extensionId = Array.from(extensionConnections.keys()).find(key => extensionConnections.get(key) === ws);
      if (!extensionId) {
        logger.warn('Received message from an unauthenticated/unregistered WebSocket client.');
        ws.close(); // Close connection if message received before authentication
        return;
      }

      const response: ActionResponse = parsedMessage;
      logger.info('Received response from extension.', { extensionId, correlationId: response.correlationId });
      // In a real app, you'd correlate this back to the original client request
      // and potentially use a message queue or another mechanism to notify the client.

    } catch (error) {
      logger.error('Error processing WebSocket message.', error);
    }
  });

  ws.on('close', () => {
    // Find and remove the disconnected extension from the map
    for (const [extId, connection] of extensionConnections.entries()) {
      if (connection === ws) {
        extensionConnections.delete(extId);
        logger.info('Extension disconnected and unregistered.', { extensionId: extId });
        break;
      }
    }
  });

  ws.on('error', (error: Error) => {
    logger.error('WebSocket error.', error);
  });
});

// --- API Routes ---
app.post('/api/dispatch', clientAuthMiddleware, (req: Request, res: Response) => {
  const { target, message }: DispatchPayload = req.body;

  if (!target || !target.extensionId || !target.tabId || !message) {
    logger.warn('Invalid dispatch payload received.', { body: req.body });
    return res.status(400).json({ error: 'Invalid dispatch payload' });
  }

  const extensionWs = extensionConnections.get(target.extensionId);

  if (extensionWs && extensionWs.readyState === WebSocket.OPEN) {
    logger.info('Dispatching message to extension.', { target, correlationId: message.correlationId });
    extensionWs.send(JSON.stringify({ tabId: target.tabId, message }));
    res.status(200).json({ status: 'Message dispatched successfully' });
  } else {
    logger.warn('Dispatch failed: Target extension not connected or not found.', { target });
    res.status(404).json({ error: 'Target extension not connected or found' });
  }
});

// --- Server Startup ---
server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
  logger.info('Awaiting client requests and extension connections...');
});
