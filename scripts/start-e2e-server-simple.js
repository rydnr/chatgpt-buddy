#!/usr/bin/env node

// Simple E2E server start script that uses existing server infrastructure
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const PORT = 3003;

console.log('🚀 Starting E2E test server with WebSocket support...');
console.log(`📡 Server will be available at: http://localhost:${PORT}`);
console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws`);
console.log('');

// Create Express app
const app = express();
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.WebSocketServer({ 
  server,
  path: '/ws'
});

// Store extension connections
const extensionConnections = new Map();

// WebSocket connection handling
wss.on('connection', (ws, request) => {
  console.log('🔌 Browser extension connected to WebSocket');
  let extensionId = null;
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received from extension:', message.type, message.correlationId || '');
      
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
      
      // Handle automation responses
      else if (message.correlationId && message.status) {
        console.log('✅ Automation response from extension:', message.status);
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

// Simple HTTP endpoint for testing
app.get('/', (req, res) => {
  res.json({
    status: 'E2E Test Server Running',
    websocket: 'ws://localhost:3003/ws',
    connectedExtensions: extensionConnections.size
  });
});

// Start server
server.listen(PORT, () => {
  console.log('✅ E2E test server started successfully!');
  console.log('');
  console.log('📋 Ready for browser extension connections!');
  console.log('   Load extension from: /home/chous/github/rydnr/chatgpt-buddy/extension');
  console.log('   Extension should connect automatically to ws://localhost:3003/ws');
  console.log('');
  console.log('🛑 Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down server...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});