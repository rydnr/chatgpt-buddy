"use strict";
/**
 * @fileoverview ChatGPT Automation Application
 * @description Specialized automation application for ChatGPT and language model integration
 * @author rydnr
 */
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
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
let ChatGPTAutomationApplication = (() => {
    let _classDecorators = [(0, application_1.Enable)(openai_integration_adapter_1.OpenAIIntegrationAdapter), (0, application_1.Enable)(anthropic_integration_adapter_1.AnthropicIntegrationAdapter), (0, application_1.Enable)(chatgpt_pattern_recognition_adapter_1.ChatGPTPatternRecognitionAdapter), (0, application_1.Enable)(ai_response_analysis_adapter_1.AIResponseAnalysisAdapter)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = application_1.Application;
    let _instanceExtraInitializers = [];
    let _handleChatGPTInteraction_decorators;
    let _handleAutomationWithAI_decorators;
    let _handleAutomationResponseWithAI_decorators;
    let _handleExtensionWithAICapabilities_decorators;
    var ChatGPTAutomationApplication = _classThis = class extends _classSuper {
        constructor() {
            super(...arguments);
            this.metadata = (__runInitializers(this, _instanceExtraInitializers), new Map([
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
            ]));
            this.activeAIInteractions = new Map();
            this.patternRecognitionEnabled = true;
            this.aiInsightsEnabled = true;
        }
        /**
         * Handle ChatGPT interaction requests from browser extensions
         */
        handleChatGPTInteraction(event) {
            return __awaiter(this, void 0, void 0, function* () {
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
                    const aiResponse = yield aiService.generateResponse({
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
                        yield this.analyzeInteractionPatterns(session);
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
            });
        }
        /**
         * Handle automation requests with AI enhancement
         */
        handleAutomationWithAI(event) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(`🤖 AI-enhanced automation request: ${event.requestId}`);
                // Check if this automation could benefit from AI insights
                if (this.aiInsightsEnabled && this.shouldEnhanceWithAI(event.automationPayload)) {
                    console.log(`🧠 Enhancing automation with AI insights: ${event.requestId}`);
                    try {
                        const aiInsights = yield this.generateAutomationInsights(event);
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
            });
        }
        /**
         * Handle automation responses with AI analysis
         */
        handleAutomationResponseWithAI(event) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(`📊 Analyzing automation response with AI: ${event.requestId}`);
                try {
                    // Analyze the automation response for improvement opportunities
                    const analysisResult = yield this.analyzeAutomationResponse(event);
                    if (analysisResult.suggestions.length > 0) {
                        console.log(`💡 AI suggestions for improvement:`, analysisResult.suggestions);
                        // Store suggestions for pattern learning
                        yield this.storeImprovementSuggestions(event.requestId, analysisResult);
                    }
                    // Update pattern recognition with this execution
                    if (this.patternRecognitionEnabled) {
                        yield this.updateAutomationPatterns(event);
                    }
                }
                catch (error) {
                    console.warn(`⚠️ Failed to analyze automation response with AI:`, error);
                }
            });
        }
        /**
         * Handle extension connections with AI capability detection
         */
        handleExtensionWithAICapabilities(event) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(`🔌 Extension connected with AI analysis: ${event.extensionId}`);
                // Check if extension has AI-related capabilities
                const aiCapabilities = this.detectAICapabilities(event.metadata.capabilities);
                if (aiCapabilities.length > 0) {
                    console.log(`🤖 AI capabilities detected:`, aiCapabilities);
                    // Configure AI-enhanced features for this extension
                    yield this.configureAIFeatures(event.extensionId, aiCapabilities);
                }
            });
        }
        /**
         * Select the optimal AI model for a given request
         */
        selectOptimalModel(preference, prompt) {
            if (preference) {
                return preference;
            }
            // Simple heuristics for model selection
            const promptLength = (prompt === null || prompt === void 0 ? void 0 : prompt.length) || 0;
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
            var _a, _b;
            // Check for complex automation patterns that could benefit from AI
            return payload.action === 'complex_workflow' ||
                ((_a = payload.options) === null || _a === void 0 ? void 0 : _a.enableAI) === true ||
                ((_b = payload.target) === null || _b === void 0 ? void 0 : _b.semanticDescription) !== undefined;
        }
        /**
         * Generate AI insights for automation
         */
        generateAutomationInsights(event) {
            return __awaiter(this, void 0, void 0, function* () {
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
                const response = yield aiService.generateResponse({
                    prompt,
                    model: 'gpt-3.5-turbo',
                    options: { maxTokens: 500 }
                });
                return {
                    suggestions: this.parseAISuggestions(response.content),
                    confidence: response.confidence || 0.8,
                    generatedAt: new Date()
                };
            });
        }
        /**
         * Analyze automation response for improvements
         */
        analyzeAutomationResponse(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const aiService = this.getAdapter('AIResponseAnalysisAdapter');
                return aiService.analyzeResponse({
                    success: event.response.success,
                    executionTime: event.executionTime,
                    result: event.response.result,
                    error: event.response.error,
                    metadata: event.response.metadata
                });
            });
        }
        /**
         * Analyze interaction patterns for learning
         */
        analyzeInteractionPatterns(session) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const patternAdapter = this.getAdapter('ChatGPTPatternRecognitionAdapter');
                yield patternAdapter.analyzePattern({
                    requestId: session.requestId,
                    prompt: (_a = session.context) === null || _a === void 0 ? void 0 : _a.prompt,
                    response: (_b = session.response) === null || _b === void 0 ? void 0 : _b.content,
                    duration: session.duration,
                    modelUsed: session.modelUsed
                });
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
        configureAIFeatures(extensionId, capabilities) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(`⚙️ Configuring AI features for ${extensionId}:`, capabilities);
                // Implementation would configure specific AI features based on capabilities
            });
        }
        /**
         * Helper methods for data management
         */
        storeAutomationInsights(requestId, insights) {
            // Implementation would store insights for later retrieval
            console.log(`💾 Storing automation insights for ${requestId}`);
        }
        storeImprovementSuggestions(requestId, analysis) {
            return __awaiter(this, void 0, void 0, function* () {
                // Implementation would store suggestions for pattern improvement
                console.log(`📝 Storing improvement suggestions for ${requestId}`);
            });
        }
        updateAutomationPatterns(event) {
            return __awaiter(this, void 0, void 0, function* () {
                // Implementation would update learned patterns
                console.log(`📊 Updating automation patterns from ${event.requestId}`);
            });
        }
        parseAISuggestions(content) {
            // Simple parsing - in real implementation would be more sophisticated
            return content.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
        }
        getAdapter(name) {
            // In real TypeScript-EDA implementation, this would resolve adapters
            return {
                generateResponse: () => __awaiter(this, void 0, void 0, function* () { return ({ content: 'Mock response', confidence: 0.9 }); }),
                analyzeResponse: () => __awaiter(this, void 0, void 0, function* () { return ({ suggestions: [], confidence: 0.8 }); }),
                analyzePattern: () => __awaiter(this, void 0, void 0, function* () { })
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
        start() {
            return __awaiter(this, void 0, void 0, function* () {
                console.log('🤖 ChatGPT Automation Application starting...');
                console.log(`🧠 Pattern Recognition: ${this.patternRecognitionEnabled ? 'Enabled' : 'Disabled'}`);
                console.log(`💡 AI Insights: ${this.aiInsightsEnabled ? 'Enabled' : 'Disabled'}`);
                console.log(`🎯 Supported Models: ${Array.from(this.metadata.get('supportedModels')).join(', ')}`);
            });
        }
        shutdown() {
            return __awaiter(this, void 0, void 0, function* () {
                console.log('🤖 ChatGPT Automation Application shutting down...');
                // Clean up active interactions
                this.activeAIInteractions.clear();
                console.log('✅ ChatGPT Automation Application shutdown complete');
            });
        }
    };
    __setFunctionName(_classThis, "ChatGPTAutomationApplication");
    (() => {
        var _a;
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        _handleChatGPTInteraction_decorators = [(0, domain_1.listen)(chatgpt_events_1.ChatGPTInteractionRequestedEvent)];
        _handleAutomationWithAI_decorators = [(0, domain_1.listen)(nodejs_server_1.AutomationRequestReceivedEvent)];
        _handleAutomationResponseWithAI_decorators = [(0, domain_1.listen)(nodejs_server_1.AutomationResponseReceivedEvent)];
        _handleExtensionWithAICapabilities_decorators = [(0, domain_1.listen)(nodejs_server_1.ExtensionConnectedEvent)];
        __esDecorate(_classThis, null, _handleChatGPTInteraction_decorators, { kind: "method", name: "handleChatGPTInteraction", static: false, private: false, access: { has: obj => "handleChatGPTInteraction" in obj, get: obj => obj.handleChatGPTInteraction }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleAutomationWithAI_decorators, { kind: "method", name: "handleAutomationWithAI", static: false, private: false, access: { has: obj => "handleAutomationWithAI" in obj, get: obj => obj.handleAutomationWithAI }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleAutomationResponseWithAI_decorators, { kind: "method", name: "handleAutomationResponseWithAI", static: false, private: false, access: { has: obj => "handleAutomationResponseWithAI" in obj, get: obj => obj.handleAutomationResponseWithAI }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleExtensionWithAICapabilities_decorators, { kind: "method", name: "handleExtensionWithAICapabilities", static: false, private: false, access: { has: obj => "handleExtensionWithAICapabilities" in obj, get: obj => obj.handleExtensionWithAICapabilities }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatGPTAutomationApplication = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatGPTAutomationApplication = _classThis;
})();
exports.ChatGPTAutomationApplication = ChatGPTAutomationApplication;
