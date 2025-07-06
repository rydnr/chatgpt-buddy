/**
 * @fileoverview ChatGPT-Buddy Server - AI automation server built on Web-Buddy framework
 * @description Specialized server for ChatGPT and language model integration automation
 * @author rydnr
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
// import { ServerApplication, ServerStartRequestedEvent, ServerStopRequestedEvent } from '@web-buddy/nodejs-server';
// Temporary direct import while workspace builds
import { ServerApplication } from '../../web-buddy-nodejs-server/src/server/server-application';
import { ServerStartRequestedEvent, ServerStopRequestedEvent } from '../../web-buddy-nodejs-server/src/core/events/server-events';
import { ChatGPTAutomationApplication } from './applications/chatgpt-automation-application';
import { logger } from './utils/logger';

// Load environment configuration
dotenv.config();

/**
 * ChatGPT-Buddy Server entry point
 * Combines Web-Buddy coordination with AI language model integration
 */
async function startChatGPTBuddyServer() {
  const port = parseInt(process.env.PORT || '3003');
  const environment = process.env.NODE_ENV || 'development';

  console.log('🤖 Starting ChatGPT-Buddy Server...');
  console.log(`📋 Environment: ${environment}`);
  console.log(`🔌 Port: ${port}`);

  try {
    // Initialize the Web-Buddy server foundation
    const serverApp = new ServerApplication();
    
    // Initialize ChatGPT-specific automation application
    const chatGPTApp = new ChatGPTAutomationApplication();

    // Configure server with ChatGPT-specific settings
    const serverConfig = {
      port,
      host: process.env.HOST || '0.0.0.0',
      environment: environment as 'development' | 'staging' | 'production',
      
      logging: {
        level: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
        format: 'json' as const,
        destinations: ['console'],
        enableRequestLogging: true,
        enableErrorTracking: true
      },
      
      security: {
        enableHTTPS: process.env.ENABLE_HTTPS === 'true',
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        rateLimiting: {
          enabled: true,
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 100,
          skipSuccessfulRequests: false
        },
        authentication: {
          enabled: process.env.ENABLE_AUTH === 'true',
          method: 'apikey' as const,
          tokenExpiration: 3600
        },
        headers: {
          enableHelmet: true,
          contentSecurityPolicy: true,
          xssProtection: true,
          frameOptions: true
        }
      },
      
      performance: {
        enableCompression: true,
        enableCaching: true,
        maxRequestSize: '10mb',
        requestTimeout: 30000,
        keepAliveTimeout: 5000
      },
      
      features: {
        enableWebSocket: true,
        enableFileUploads: false,
        enableExtensionManagement: true,
        enablePatternSharing: true,
        enableAnalytics: true
      }
    };

    // Start the server applications
    const startEvent = new ServerStartRequestedEvent(port, serverConfig);
    
    // Start Web-Buddy server foundation using accept method
    await serverApp.accept(startEvent);
    
    // Start ChatGPT automation application
    await chatGPTApp.start();

    console.log('✅ ChatGPT-Buddy Server started successfully!');
    console.log(`🌐 HTTP API: http://localhost:${port}`);
    console.log(`🔌 WebSocket: ws://localhost:${port + 1}/ws`);
    console.log(`🤖 ChatGPT automation: Enabled`);
    console.log(`📊 Analytics: ${serverConfig.features.enableAnalytics ? 'Enabled' : 'Disabled'}`);
    console.log(`🔐 Authentication: ${serverConfig.security.authentication.enabled ? 'Enabled' : 'Disabled'}`);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      
      try {
        await chatGPTApp.shutdown();
        const stopEvent = new ServerStopRequestedEvent('SIGINT', true);
        await serverApp.accept(stopEvent);
        console.log('✅ ChatGPT-Buddy Server stopped successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      
      try {
        await chatGPTApp.shutdown();
        const stopEvent = new ServerStopRequestedEvent('SIGTERM', true);
        await serverApp.accept(stopEvent);
        console.log('✅ ChatGPT-Buddy Server stopped successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start ChatGPT-Buddy Server:', error);
    logger.error('Server startup failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Start the server if this file is executed directly
if (require.main === module) {
  startChatGPTBuddyServer().catch((error) => {
    console.error('❌ Unhandled error during server startup:', error);
    process.exit(1);
  });
}

export { startChatGPTBuddyServer };
