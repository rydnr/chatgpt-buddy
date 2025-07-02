#!/usr/bin/env node

// Dispatch server with WebSocket support for automation testing
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const PORT = 3003;

console.log('🚀 Starting automation dispatch server...');
console.log(`📡 Server will be available at: http://localhost:${PORT}`);
console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws`);
console.log('');

// Create Express app
const app = express();
app.use(express.json({ limit: '10mb' }));

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
          timestamp: new Date().toISOString()
        }));
      }
      
      // Handle heartbeat
      if (message.type === 'heartbeat') {
        ws.send(JSON.stringify({
          type: 'heartbeatAck', 
          correlationId: message.correlationId,
          timestamp: new Date().toISOString()
        }));
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

// Server status endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'Automation Dispatch Server Running',
    websocket: 'ws://localhost:3003/ws',
    connectedExtensions: extensionConnections.size,
    endpoints: [
      'GET /',
      'POST /api/dispatch'
    ]
  });
});

// Automation dispatch endpoint
app.post('/api/dispatch', (req, res) => {
  console.log('🎯 Received automation dispatch request');
  
  try {
    const { target, message } = req.body;
    
    if (!target || !message) {
      return res.status(400).json({
        error: 'Missing target or message in request body',
        success: false
      });
    }
    
    const { extensionId, tabId } = target;
    
    // Check if extension is connected
    const extensionWs = extensionConnections.get(extensionId);
    if (!extensionWs) {
      console.log(`❌ Extension not connected: ${extensionId}`);
      return res.status(404).json({
        error: `Extension ${extensionId} not connected`,
        success: false,
        connectedExtensions: Array.from(extensionConnections.keys())
      });
    }
    
    // Forward message to extension
    const dispatchMessage = {
      ...message,
      tabId: tabId
    };
    
    console.log(`📤 Forwarding to extension ${extensionId}:`, message.type, message.correlationId);
    extensionWs.send(JSON.stringify(dispatchMessage));
    
    // Send immediate response (in real implementation, we'd wait for extension response)
    res.json({
      success: true,
      message: `Command ${message.type} dispatched to extension ${extensionId}`,
      correlationId: message.correlationId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error processing dispatch request:', error);
    res.status(500).json({
      error: 'Internal server error processing dispatch request',
      success: false
    });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Automation dispatch server running on port ${PORT}`);
  console.log('Ready for browser extension connections and automation commands!');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});