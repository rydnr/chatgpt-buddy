/**
 * Minimal development server for ChatGPT-buddy
 */

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS for CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${method} ${path}`);

  // Health check
  if (method === 'GET' && path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'chatgpt-buddy-server',
      version: '2.0.0'
    }));
    return;
  }

  // API dispatch
  if (method === 'POST' && path === '/api/dispatch') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('📨 Dispatch request:', data);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          correlationId: data.message?.correlationId || 'dev-' + Date.now(),
          status: 'success',
          data: 'Development server response',
          timestamp: Date.now()
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Training enable
  if (method === 'POST' && path === '/api/training/enable') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('🎓 Training enable:', data);
        
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, hostname: data.hostname }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Training patterns
  if (method === 'GET' && path === '/api/training/patterns') {
    console.log('📋 Training patterns request:', parsedUrl.query);
    res.writeHead(200);
    res.end(JSON.stringify([]));
    return;
  }

  // 404 for everything else
  res.writeHead(404);
  res.end(JSON.stringify({
    error: 'Not found',
    path: path,
    message: 'This is a development server for ChatGPT-buddy'
  }));
});

server.listen(PORT, () => {
  console.log('🚀 ChatGPT-buddy Development Server Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`💊 Health check: http://localhost:${PORT}/health`);
  console.log('⚠️  This is a minimal development server');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});