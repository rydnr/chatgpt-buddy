"use strict";
/**
 * Simple development server for ChatGPT-buddy
 * Temporary solution while workspace dependencies are being resolved
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment configuration
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
    var _a;
    console.log('📨 Dispatch request received:', req.body);
    res.json({
        correlationId: ((_a = req.body.message) === null || _a === void 0 ? void 0 : _a.correlationId) || 'dev-' + Date.now(),
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
