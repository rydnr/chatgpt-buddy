"use strict";
/**
 * @fileoverview Main entry point for Web-Buddy Node.js Server Framework
 * @description Event-driven server for coordinating browser extension automation
 * @author Web-Buddy Team
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManagerAdapter = exports.ExtensionManagerAdapter = exports.WebSocketServerAdapter = exports.ServerApplication = void 0;
var server_application_1 = require("./server/server-application");
Object.defineProperty(exports, "ServerApplication", { enumerable: true, get: function () { return server_application_1.ServerApplication; } });
// Core events
__exportStar(require("./core/events/server-events"), exports);
__exportStar(require("./core/events/coordination-events"), exports);
// Coordination layer
var websocket_server_adapter_1 = require("./coordination/adapters/websocket-server-adapter");
Object.defineProperty(exports, "WebSocketServerAdapter", { enumerable: true, get: function () { return websocket_server_adapter_1.WebSocketServerAdapter; } });
var extension_manager_adapter_1 = require("./coordination/adapters/extension-manager-adapter");
Object.defineProperty(exports, "ExtensionManagerAdapter", { enumerable: true, get: function () { return extension_manager_adapter_1.ExtensionManagerAdapter; } });
var session_manager_adapter_1 = require("./coordination/adapters/session-manager-adapter");
Object.defineProperty(exports, "SessionManagerAdapter", { enumerable: true, get: function () { return session_manager_adapter_1.SessionManagerAdapter; } });
// Server infrastructure
__exportStar(require("./server/adapters/http-server-adapter"), exports);
__exportStar(require("./server/adapters/logging-adapter"), exports);
__exportStar(require("./server/adapters/cache-adapter"), exports);
//# sourceMappingURL=index.js.map