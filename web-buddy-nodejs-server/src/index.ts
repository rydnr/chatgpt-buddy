/**
 * @fileoverview Main entry point for Web-Buddy Node.js Server Framework
 * @description Event-driven server for coordinating browser extension automation
 * @author Web-Buddy Team
 */

export { ServerApplication } from './server/server-application';
export { CoordinationApplication } from './coordination/coordination-application';

// Core events
export * from './core/events/server-events';
export * from './core/events/coordination-events';
export * from './core/events/client-events';

// API layer
export * from './api/routes/automation-routes';
export * from './api/routes/extension-routes';
export * from './api/middleware/authentication';
export * from './api/middleware/validation';

// Coordination layer
export * from './coordination/adapters/websocket-server-adapter';
export * from './coordination/adapters/extension-manager-adapter';
export * from './coordination/adapters/session-manager-adapter';

// Server infrastructure
export * from './server/adapters/http-server-adapter';
export * from './server/adapters/logging-adapter';
export * from './server/adapters/cache-adapter';

// Utilities and types
export * from './core/types/server-types';
export * from './core/types/coordination-types';
export * from './core/utils/validation-utils';
export * from './core/utils/response-utils';