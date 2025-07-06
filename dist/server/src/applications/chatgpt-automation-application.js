"use strict";
/**
 * @fileoverview ChatGPT Automation Application
 * @description Specialized automation application for ChatGPT and language model integration
 * @author rydnr
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGPTAutomationApplication = void 0;
const application_1 = require("@typescript-eda/application");
const domain_1 = require("@typescript-eda/domain");
const nodejs_server_1 = require("@web-buddy/nodejs-server");
const chatgpt_events_1 = require("../events/chatgpt-events");
const openai_integration_adapter_1 = require("../adapters/openai-integration-adapter");
const anthropic_integration_adapter_1 = require("../adapters/anthropic-integration-adapter");
const chatgpt_pattern_recognition_adapter_1 = require("../adapters/chatgpt-pattern-recognition-adapter");
const ai_response_analysis_adapter_1 = require("../adapters/ai-response-analysis-adapter");
/**
 * ChatGPT-specific automation application
 * Extends Web-Buddy coordination with AI language model integration
 */
let ChatGPTAutomationApplication = class ChatGPTAutomationApplication extends application_1.Application {
    constructor() {
        super(...arguments);
        this.metadata = new Map([
            ['name', 'ChatGPT-Buddy Automation Engine'],
            ['version', '2.0.0'],
            ['capabilities', [
                    'chatgpt-integration',
                    'openai-api',
                    'anthropic-api',
                    'ai-pattern-recognition',
                    'intelligent-automation',
                    'language-model-routing'
                ]],
            ['supportedModels', [
                    'gpt-4',
                    'gpt-4-turbo',
                    'gpt-3.5-turbo',
                    'claude-3-opus',
                    'claude-3-sonnet',
                    'claude-3-haiku'
                ]]
        ]);
        this.activeAIInteractions = new Map();
        this.patternRecognitionEnabled = true;
        this.aiInsightsEnabled = true;
    }
    /**
     * Handle ChatGPT interaction requests from browser extensions
     */
    async handleChatGPTInteraction(event) {
        console.log(`🤖 ChatGPT interaction requested: ${event.requestId}`);
        console.log(`💬 Prompt: ${event.prompt.substring(0, 100)}...`);
        console.log(`🎯 Model: ${event.modelPreference || 'auto'}`);
        try {
            // Create interaction session
            const session = {
                requestId: event.requestId,
                extensionId: event.extensionId,
                startTime: new Date(),
                modelUsed: this.selectOptimalModel(event.modelPreference, event.prompt),
                context: event.context,
                status: 'processing'
            };
            this.activeAIInteractions.set(event.requestId, session);
            // Determine the best AI service for this request
            const aiService = this.selectAIService(session.modelUsed);
            // Send request to AI service
            const aiResponse = await aiService.generateResponse({
                prompt: event.prompt,
                model: session.modelUsed,
                context: event.context,
                options: event.options || {}
            });
            // Update session with response
            session.status = 'completed';
            session.response = aiResponse;
            session.endTime = new Date();
            session.duration = session.endTime.getTime() - session.startTime.getTime();
            console.log(`✅ ChatGPT response generated: ${event.requestId}`);
            console.log(`⏱️ Duration: ${session.duration}ms`);
            console.log(`🔤 Response length: ${aiResponse.content.length} characters`);
            // Emit response event
            // await this.emit(new ChatGPTResponseReceivedEvent(
            //   event.requestId,
            //   event.extensionId,
            //   aiResponse,
            //   session.duration
            // ));
            // Perform pattern recognition if enabled
            if (this.patternRecognitionEnabled) {
                await this.analyzeInteractionPatterns(session);
            }
        }
        catch (error) {
            console.error(`❌ ChatGPT interaction failed: ${event.requestId}`, error);
            const session = this.activeAIInteractions.get(event.requestId);
            if (session) {
                session.status = 'failed';
                session.error = error.message;
                session.endTime = new Date();
            }
            // Emit error event
            // await this.emit(new ChatGPTInteractionFailedEvent(event.requestId, error.message));
        }
    }
    /**
     * Handle automation requests with AI enhancement
     */
    async handleAutomationWithAI(event) {
        console.log(`🤖 AI-enhanced automation request: ${event.requestId}`);
        // Check if this automation could benefit from AI insights
        if (this.aiInsightsEnabled && this.shouldEnhanceWithAI(event.automationPayload)) {
            console.log(`🧠 Enhancing automation with AI insights: ${event.requestId}`);
            try {
                const aiInsights = await this.generateAutomationInsights(event);
                // Store insights for later use
                this.storeAutomationInsights(event.requestId, aiInsights);
                console.log(`💡 AI insights generated for automation: ${event.requestId}`);
            }
            catch (error) {
                console.warn(`⚠️ Failed to generate AI insights for ${event.requestId}:`, error);
                // Continue with normal automation even if AI insights fail
            }
        }
        // Let the base Web-Buddy framework handle the automation routing
        // The AI insights will be available for the extension to use
    }
    /**
     * Handle automation responses with AI analysis
     */
    async handleAutomationResponseWithAI(event) {
        console.log(`📊 Analyzing automation response with AI: ${event.requestId}`);
        try {
            // Analyze the automation response for improvement opportunities
            const analysisResult = await this.analyzeAutomationResponse(event);
            if (analysisResult.suggestions.length > 0) {
                console.log(`💡 AI suggestions for improvement:`, analysisResult.suggestions);
                // Store suggestions for pattern learning
                await this.storeImprovementSuggestions(event.requestId, analysisResult);
            }
            // Update pattern recognition with this execution
            if (this.patternRecognitionEnabled) {
                await this.updateAutomationPatterns(event);
            }
        }
        catch (error) {
            console.warn(`⚠️ Failed to analyze automation response with AI:`, error);
        }
    }
    /**
     * Handle extension connections with AI capability detection
     */
    async handleExtensionWithAICapabilities(event) {
        console.log(`🔌 Extension connected with AI analysis: ${event.extensionId}`);
        // Check if extension has AI-related capabilities
        const aiCapabilities = this.detectAICapabilities(event.metadata.capabilities);
        if (aiCapabilities.length > 0) {
            console.log(`🤖 AI capabilities detected:`, aiCapabilities);
            // Configure AI-enhanced features for this extension
            await this.configureAIFeatures(event.extensionId, aiCapabilities);
        }
    }
    /**
     * Select the optimal AI model for a given request
     */
    selectOptimalModel(preference, prompt) {
        if (preference) {
            return preference;
        }
        // Simple heuristics for model selection
        const promptLength = prompt?.length || 0;
        if (promptLength > 8000) {
            return 'gpt-4-turbo'; // Better for longer contexts
        }
        else if (promptLength > 2000) {
            return 'gpt-4'; // Good balance for medium contexts
        }
        else {
            return 'gpt-3.5-turbo'; // Fast for short prompts
        }
    }
    /**
     * Select the appropriate AI service based on model
     */
    selectAIService(model) {
        if (model.startsWith('gpt-')) {
            return this.getAdapter('OpenAIIntegrationAdapter');
        }
        else if (model.startsWith('claude-')) {
            return this.getAdapter('AnthropicIntegrationAdapter');
        }
        else {
            // Default to OpenAI
            return this.getAdapter('OpenAIIntegrationAdapter');
        }
    }
    /**
     * Determine if automation should be enhanced with AI
     */
    shouldEnhanceWithAI(payload) {
        // Check for complex automation patterns that could benefit from AI
        return payload.action === 'complex_workflow' ||
            payload.options?.enableAI === true ||
            payload.target?.semanticDescription !== undefined;
    }
    /**
     * Generate AI insights for automation
     */
    async generateAutomationInsights(event) {
        const aiService = this.getAdapter('OpenAIIntegrationAdapter');
        const prompt = `Analyze this web automation request and provide insights:
    Action: ${event.automationPayload.action}
    Target: ${JSON.stringify(event.automationPayload.target)}
    Parameters: ${JSON.stringify(event.automationPayload.parameters)}
    
    Provide suggestions for:
    1. Potential failure points
    2. Alternative approaches
    3. Performance optimizations
    4. Error recovery strategies`;
        const response = await aiService.generateResponse({
            prompt,
            model: 'gpt-3.5-turbo',
            options: { maxTokens: 500 }
        });
        return {
            suggestions: this.parseAISuggestions(response.content),
            confidence: response.confidence || 0.8,
            generatedAt: new Date()
        };
    }
    /**
     * Analyze automation response for improvements
     */
    async analyzeAutomationResponse(event) {
        const aiService = this.getAdapter('AIResponseAnalysisAdapter');
        return aiService.analyzeResponse({
            success: event.response.success,
            executionTime: event.executionTime,
            result: event.response.result,
            error: event.response.error,
            metadata: event.response.metadata
        });
    }
    /**
     * Analyze interaction patterns for learning
     */
    async analyzeInteractionPatterns(session) {
        const patternAdapter = this.getAdapter('ChatGPTPatternRecognitionAdapter');
        await patternAdapter.analyzePattern({
            requestId: session.requestId,
            prompt: session.context?.prompt,
            response: session.response?.content,
            duration: session.duration,
            modelUsed: session.modelUsed
        });
    }
    /**
     * Detect AI capabilities from extension metadata
     */
    detectAICapabilities(capabilities) {
        const aiCapabilities = [];
        if (capabilities.includes('chatgpt'))
            aiCapabilities.push('chatgpt-integration');
        if (capabilities.includes('ai-analysis'))
            aiCapabilities.push('ai-response-analysis');
        if (capabilities.includes('pattern-learning'))
            aiCapabilities.push('pattern-recognition');
        if (capabilities.includes('language-models'))
            aiCapabilities.push('multi-model-support');
        return aiCapabilities;
    }
    /**
     * Configure AI features for extension
     */
    async configureAIFeatures(extensionId, capabilities) {
        console.log(`⚙️ Configuring AI features for ${extensionId}:`, capabilities);
        // Implementation would configure specific AI features based on capabilities
    }
    /**
     * Helper methods for data management
     */
    storeAutomationInsights(requestId, insights) {
        // Implementation would store insights for later retrieval
        console.log(`💾 Storing automation insights for ${requestId}`);
    }
    async storeImprovementSuggestions(requestId, analysis) {
        // Implementation would store suggestions for pattern improvement
        console.log(`📝 Storing improvement suggestions for ${requestId}`);
    }
    async updateAutomationPatterns(event) {
        // Implementation would update learned patterns
        console.log(`📊 Updating automation patterns from ${event.requestId}`);
    }
    parseAISuggestions(content) {
        // Simple parsing - in real implementation would be more sophisticated
        return content.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
    }
    getAdapter(name) {
        // In real TypeScript-EDA implementation, this would resolve adapters
        return {
            generateResponse: async () => ({ content: 'Mock response', confidence: 0.9 }),
            analyzeResponse: async () => ({ suggestions: [], confidence: 0.8 }),
            analyzePattern: async () => { }
        };
    }
    /**
     * Get current AI interaction statistics
     */
    getAIStatistics() {
        const sessions = Array.from(this.activeAIInteractions.values());
        const completed = sessions.filter(s => s.status === 'completed');
        const failed = sessions.filter(s => s.status === 'failed');
        return {
            totalInteractions: sessions.length,
            completedInteractions: completed.length,
            failedInteractions: failed.length,
            averageResponseTime: completed.reduce((sum, s) => sum + (s.duration || 0), 0) / completed.length || 0,
            modelUsage: this.calculateModelUsage(sessions)
        };
    }
    calculateModelUsage(sessions) {
        const usage = {};
        sessions.forEach(session => {
            usage[session.modelUsed] = (usage[session.modelUsed] || 0) + 1;
        });
        return usage;
    }
    /**
     * Application lifecycle methods
     */
    async start() {
        console.log('🤖 ChatGPT Automation Application starting...');
        console.log(`🧠 Pattern Recognition: ${this.patternRecognitionEnabled ? 'Enabled' : 'Disabled'}`);
        console.log(`💡 AI Insights: ${this.aiInsightsEnabled ? 'Enabled' : 'Disabled'}`);
        console.log(`🎯 Supported Models: ${Array.from(this.metadata.get('supportedModels')).join(', ')}`);
    }
    async shutdown() {
        console.log('🤖 ChatGPT Automation Application shutting down...');
        // Clean up active interactions
        this.activeAIInteractions.clear();
        console.log('✅ ChatGPT Automation Application shutdown complete');
    }
};
exports.ChatGPTAutomationApplication = ChatGPTAutomationApplication;
__decorate([
    (0, domain_1.listen)(chatgpt_events_1.ChatGPTInteractionRequestedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatgpt_events_1.ChatGPTInteractionRequestedEvent]),
    __metadata("design:returntype", Promise)
], ChatGPTAutomationApplication.prototype, "handleChatGPTInteraction", null);
__decorate([
    (0, domain_1.listen)(nodejs_server_1.AutomationRequestReceivedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof nodejs_server_1.AutomationRequestReceivedEvent !== "undefined" && nodejs_server_1.AutomationRequestReceivedEvent) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], ChatGPTAutomationApplication.prototype, "handleAutomationWithAI", null);
__decorate([
    (0, domain_1.listen)(nodejs_server_1.AutomationResponseReceivedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof nodejs_server_1.AutomationResponseReceivedEvent !== "undefined" && nodejs_server_1.AutomationResponseReceivedEvent) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], ChatGPTAutomationApplication.prototype, "handleAutomationResponseWithAI", null);
__decorate([
    (0, domain_1.listen)(nodejs_server_1.ExtensionConnectedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof nodejs_server_1.ExtensionConnectedEvent !== "undefined" && nodejs_server_1.ExtensionConnectedEvent) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], ChatGPTAutomationApplication.prototype, "handleExtensionWithAICapabilities", null);
exports.ChatGPTAutomationApplication = ChatGPTAutomationApplication = __decorate([
    (0, application_1.Enable)(openai_integration_adapter_1.OpenAIIntegrationAdapter),
    (0, application_1.Enable)(anthropic_integration_adapter_1.AnthropicIntegrationAdapter),
    (0, application_1.Enable)(chatgpt_pattern_recognition_adapter_1.ChatGPTPatternRecognitionAdapter),
    (0, application_1.Enable)(ai_response_analysis_adapter_1.AIResponseAnalysisAdapter)
], ChatGPTAutomationApplication);
//# sourceMappingURL=chatgpt-automation-application.js.map