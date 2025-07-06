/**
 * Simple development server for ChatGPT-buddy
 * Temporary solution while workspace dependencies are being resolved
 */

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'chatgpt-buddy-server',
    version: '2.0.0'
  });
});

// API dispatch endpoint
app.post('/api/dispatch', (req, res) => {
  console.log('📨 Dispatch request received:', req.body);
  
  res.json({
    correlationId: req.body.message?.correlationId || 'dev-' + Date.now(),
    status: 'success',
    data: 'Development server response',
    timestamp: Date.now()
  });
});

// Training endpoints
app.post('/api/training/enable', (req, res) => {
  console.log('🎓 Training enable request:', req.body);
  res.json({ success: true, hostname: req.body.hostname });
});

app.get('/api/training/patterns', (req, res) => {
  console.log('📋 Training patterns request:', req.query);
  res.json([]);
});

// Catch all
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    message: 'This is a development server for ChatGPT-buddy'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 ChatGPT-buddy Development Server Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`💊 Health check: http://localhost:${PORT}/health`);
  console.log('⚠️  This is a simplified development server');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});