#!/usr/bin/env node

// E2E Test Server with WebSocket support for browser extension testing
const { createServerWithWebSocket } = require('../packages/chatgpt-buddy-server/src/infrastructure/express-app');

const PORT = 3003;

console.log('🚀 Starting E2E test server with WebSocket support...');
console.log(`📡 Server will be available at: http://localhost:${PORT}`);
console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws`);
console.log('');
console.log('Ready for browser extension connections!');
console.log('Load the extension from: /home/chous/github/rydnr/chatgpt-buddy/extension');
console.log('');

try {
  const server = createServerWithWebSocket(PORT);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  });
  
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}