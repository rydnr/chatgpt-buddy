"use strict";
/**
 * @fileoverview Anthropic Integration Adapter for ChatGPT-Buddy
 * @description Adapter for integrating with Anthropic Claude API services
 * @author rydnr
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicIntegrationAdapter = exports.AnthropicIntegrationPort = void 0;
const infrastructure_1 = require("@typescript-eda/infrastructure");
/**
 * Port interface for Anthropic integration operations
 */
class AnthropicIntegrationPort extends infrastructure_1.Port {
    constructor() {
        super(...arguments);
        this.name = 'AnthropicIntegrationPort';
    }
}
exports.AnthropicIntegrationPort = AnthropicIntegrationPort;
/**
 * Anthropic integration adapter using Anthropic SDK
 * Provides Claude model integrations for automation
 */
let AnthropicIntegrationAdapter = class AnthropicIntegrationAdapter extends AnthropicIntegrationPort {
    constructor() {
        super(...arguments);
        this.isInitialized = false;
    }
    async initialize() {
        console.log('🔧 Initializing Anthropic integration adapter...');
        this.isInitialized = true;
        console.log('✅ Anthropic integration adapter initialized');
    }
    async generateResponse(request) {
        console.log(`🤖 Generating Anthropic response with model: ${request.model}`);
        // Mock implementation for now
        return {
            content: `Mock Anthropic response for: ${request.prompt.substring(0, 50)}...`,
            usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
            modelUsed: request.model || 'claude-3-sonnet',
            responseTime: 1000
        };
    }
    async analyzeText(text, analysisType) {
        console.log(`🔍 Analyzing text with Anthropic: ${analysisType}`);
        return { result: `Mock analysis of type ${analysisType}` };
    }
    async getModelInfo(model) {
        return { id: model, capabilities: ['text-generation', 'analysis'] };
    }
    async isHealthy() {
        return this.isInitialized;
    }
    async shutdown() {
        console.log('🔌 Anthropic integration adapter shutting down...');
        this.isInitialized = false;
    }
};
exports.AnthropicIntegrationAdapter = AnthropicIntegrationAdapter;
exports.AnthropicIntegrationAdapter = AnthropicIntegrationAdapter = __decorate([
    (0, infrastructure_1.AdapterFor)(AnthropicIntegrationPort)
], AnthropicIntegrationAdapter);
//# sourceMappingURL=anthropic-integration-adapter.js.map