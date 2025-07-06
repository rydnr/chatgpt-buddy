"use strict";
/**
 * @fileoverview OpenAI Integration Adapter for ChatGPT-Buddy
 * @description Adapter for integrating with OpenAI API services
 * @author rydnr
 */
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIIntegrationAdapter = exports.OpenAIIntegrationPort = void 0;
const infrastructure_1 = require("@typescript-eda/infrastructure");
const openai_1 = __importDefault(require("openai"));
/**
 * Port interface for OpenAI integration operations
 */
class OpenAIIntegrationPort extends infrastructure_1.Port {
    constructor() {
        super(...arguments);
        this.name = 'OpenAIIntegrationPort';
    }
}
exports.OpenAIIntegrationPort = OpenAIIntegrationPort;
/**
 * OpenAI integration adapter using official OpenAI SDK
 * Provides ChatGPT and other OpenAI model integrations for automation
 */
let OpenAIIntegrationAdapter = (() => {
    let _classDecorators = [(0, infrastructure_1.AdapterFor)(OpenAIIntegrationPort)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = OpenAIIntegrationPort;
    var OpenAIIntegrationAdapter = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.isInitialized = false;
            this.requestCount = 0;
            this.totalCost = 0;
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
                console.warn('⚠️ OpenAI API key not found in environment variables');
            }
            this.client = new openai_1.default({
                apiKey: apiKey || 'dummy-key-for-testing'
            });
        }
        /**
         * Initialize the OpenAI adapter
         */
        initialize() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.isInitialized) {
                    console.log('⚠️ OpenAI adapter already initialized');
                    return;
                }
                console.log('🔧 Initializing OpenAI integration adapter...');
                try {
                    // Test the connection by listing available models
                    const models = yield this.client.models.list();
                    console.log(`✅ OpenAI connection successful, ${models.data.length} models available`);
                    this.isInitialized = true;
                    console.log('✅ OpenAI integration adapter initialized');
                }
                catch (error) {
                    console.error('❌ Failed to initialize OpenAI adapter:', error);
                    throw error;
                }
            });
        }
        /**
         * Generate response using OpenAI models
         */
        generateResponse(request) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                if (!this.isInitialized) {
                    yield this.initialize();
                }
                console.log(`🤖 Generating OpenAI response with model: ${request.model}`);
                const startTime = Date.now();
                try {
                    const completion = yield this.client.chat.completions.create({
                        model: request.model || 'gpt-3.5-turbo',
                        messages: this.buildMessages(request.prompt, request.context),
                        max_tokens: ((_a = request.options) === null || _a === void 0 ? void 0 : _a.maxTokens) || 1000,
                        temperature: ((_b = request.options) === null || _b === void 0 ? void 0 : _b.temperature) || 0.7,
                        top_p: ((_c = request.options) === null || _c === void 0 ? void 0 : _c.topP) || 1,
                        presence_penalty: ((_d = request.options) === null || _d === void 0 ? void 0 : _d.presencePenalty) || 0,
                        frequency_penalty: ((_e = request.options) === null || _e === void 0 ? void 0 : _e.frequencyPenalty) || 0,
                        stop: (_f = request.options) === null || _f === void 0 ? void 0 : _f.stop,
                        stream: false
                    });
                    const responseTime = Date.now() - startTime;
                    this.requestCount++;
                    // Calculate cost (simplified pricing)
                    const cost = this.calculateCost(completion.usage, request.model || 'gpt-3.5-turbo');
                    this.totalCost += cost;
                    const response = {
                        content: ((_h = (_g = completion.choices[0]) === null || _g === void 0 ? void 0 : _g.message) === null || _h === void 0 ? void 0 : _h.content) || '',
                        finishReason: (_j = completion.choices[0]) === null || _j === void 0 ? void 0 : _j.finish_reason,
                        usage: {
                            promptTokens: ((_k = completion.usage) === null || _k === void 0 ? void 0 : _k.prompt_tokens) || 0,
                            completionTokens: ((_l = completion.usage) === null || _l === void 0 ? void 0 : _l.completion_tokens) || 0,
                            totalTokens: ((_m = completion.usage) === null || _m === void 0 ? void 0 : _m.total_tokens) || 0,
                            estimatedCost: cost
                        },
                        modelUsed: request.model || 'gpt-3.5-turbo',
                        responseTime,
                        confidence: this.estimateConfidence(completion.choices[0])
                    };
                    console.log(`✅ OpenAI response generated: ${response.content.length} chars, ${responseTime}ms`);
                    console.log(`💰 Request cost: $${cost.toFixed(6)}, Total cost: $${this.totalCost.toFixed(6)}`);
                    return response;
                }
                catch (error) {
                    console.error('❌ OpenAI response generation failed:', error);
                    throw new Error(`OpenAI request failed: ${error.message}`);
                }
            });
        }
        /**
         * Generate text completion
         */
        generateCompletion(prompt, options) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(`📝 Generating completion for prompt: ${prompt.substring(0, 100)}...`);
                const request = {
                    prompt,
                    model: (options === null || options === void 0 ? void 0 : options.model) || 'gpt-3.5-turbo',
                    options: {
                        maxTokens: (options === null || options === void 0 ? void 0 : options.maxTokens) || 500,
                        temperature: (options === null || options === void 0 ? void 0 : options.temperature) || 0.7,
                        stop: options === null || options === void 0 ? void 0 : options.stop
                    }
                };
                const response = yield this.generateResponse(request);
                return {
                    completion: response.content,
                    usage: response.usage,
                    responseTime: response.responseTime,
                    quality: this.assessCompletionQuality(response.content)
                };
            });
        }
        /**
         * Analyze text using OpenAI models
         */
        analyzeText(text, analysisType) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(`🔍 Analyzing text with type: ${analysisType}`);
                const analysisPrompts = {
                    sentiment: `Analyze the sentiment of the following text and provide a score from -1 (very negative) to 1 (very positive): "${text}"`,
                    summary: `Provide a concise summary of the following text: "${text}"`,
                    keywords: `Extract the main keywords and phrases from the following text: "${text}"`,
                    intent: `Analyze the intent behind the following text: "${text}"`,
                    quality: `Assess the quality and clarity of the following text: "${text}"`
                };
                const prompt = analysisPrompts[analysisType];
                if (!prompt) {
                    throw new Error(`Unsupported analysis type: ${analysisType}`);
                }
                const response = yield this.generateResponse({
                    prompt,
                    model: 'gpt-3.5-turbo',
                    options: { maxTokens: 300 }
                });
                return {
                    analysisType,
                    result: response.content,
                    confidence: response.confidence || 0.8,
                    usage: response.usage,
                    insights: this.extractInsights(response.content, analysisType)
                };
            });
        }
        /**
         * Generate code using OpenAI models
         */
        generateCode(description, language) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(`💻 Generating ${language} code for: ${description}`);
                const prompt = `Generate ${language} code for the following requirement: ${description}. 
    Please provide clean, well-commented code with proper error handling.`;
                const response = yield this.generateResponse({
                    prompt,
                    model: 'gpt-4', // Use GPT-4 for better code generation
                    options: {
                        maxTokens: 1500,
                        temperature: 0.3 // Lower temperature for more deterministic code
                    }
                });
                return {
                    code: response.content,
                    language,
                    description,
                    usage: response.usage,
                    quality: this.assessCodeQuality(response.content, language),
                    suggestions: this.generateCodeSuggestions(response.content)
                };
            });
        }
        /**
         * Get information about available models
         */
        getModelInfo(model) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const modelDetails = yield this.client.models.retrieve(model);
                    return {
                        id: modelDetails.id,
                        created: new Date(modelDetails.created * 1000),
                        ownedBy: modelDetails.owned_by,
                        capabilities: this.getModelCapabilities(model),
                        pricing: this.getModelPricing(model),
                        limits: this.getModelLimits(model)
                    };
                }
                catch (error) {
                    console.warn(`⚠️ Could not retrieve model info for ${model}:`, error);
                    return this.getDefaultModelInfo(model);
                }
            });
        }
        /**
         * Build messages array for chat completion
         */
        buildMessages(prompt, context) {
            const messages = [];
            // Add system message if context provides one
            if (context === null || context === void 0 ? void 0 : context.systemMessage) {
                messages.push({
                    role: 'system',
                    content: context.systemMessage
                });
            }
            // Add conversation history if available
            if (context === null || context === void 0 ? void 0 : context.previousMessages) {
                messages.push(...context.previousMessages);
            }
            // Add the current prompt
            messages.push({
                role: 'user',
                content: prompt
            });
            return messages;
        }
        /**
         * Calculate estimated cost for the request
         */
        calculateCost(usage, model) {
            if (!usage)
                return 0;
            // Simplified pricing (as of 2024, actual prices may vary)
            const pricing = {
                'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
                'gpt-4-turbo': { input: 0.01, output: 0.03 },
                'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
            };
            const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
            const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
            const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;
            return inputCost + outputCost;
        }
        /**
         * Estimate confidence based on response characteristics
         */
        estimateConfidence(choice) {
            var _a, _b;
            if (!choice)
                return 0.5;
            let confidence = 0.8; // Base confidence
            // Adjust based on finish reason
            if (choice.finish_reason === 'stop') {
                confidence += 0.1; // Normal completion
            }
            else if (choice.finish_reason === 'length') {
                confidence -= 0.2; // Truncated response
            }
            // Adjust based on response length
            const contentLength = ((_b = (_a = choice.message) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.length) || 0;
            if (contentLength < 10) {
                confidence -= 0.3; // Very short response
            }
            else if (contentLength > 1000) {
                confidence += 0.1; // Detailed response
            }
            return Math.max(0.1, Math.min(1.0, confidence));
        }
        /**
         * Assess completion quality
         */
        assessCompletionQuality(completion) {
            const length = completion.length;
            const hasStructure = /\n|\.|,/.test(completion);
            const hasNumbers = /\d/.test(completion);
            let score = 0.5;
            if (length > 50)
                score += 0.2;
            if (length > 200)
                score += 0.1;
            if (hasStructure)
                score += 0.1;
            if (hasNumbers)
                score += 0.1;
            return {
                score: Math.min(1.0, score),
                factors: {
                    length: length > 50 ? 'adequate' : 'short',
                    structure: hasStructure ? 'good' : 'basic',
                    detail: length > 200 ? 'detailed' : 'concise'
                }
            };
        }
        /**
         * Extract insights from analysis result
         */
        extractInsights(result, analysisType) {
            const insights = [];
            switch (analysisType) {
                case 'sentiment':
                    if (result.toLowerCase().includes('positive')) {
                        insights.push('Positive sentiment detected');
                    }
                    else if (result.toLowerCase().includes('negative')) {
                        insights.push('Negative sentiment detected');
                    }
                    break;
                case 'quality':
                    if (result.toLowerCase().includes('clear')) {
                        insights.push('Text clarity is good');
                    }
                    if (result.toLowerCase().includes('improve')) {
                        insights.push('Improvements suggested');
                    }
                    break;
            }
            return insights;
        }
        /**
         * Assess code quality
         */
        assessCodeQuality(code, language) {
            const lines = code.split('\n').length;
            const hasComments = /\/\/|\/\*|\#/.test(code);
            const hasErrorHandling = /try|catch|except|error|Error/.test(code);
            let score = 0.5;
            if (hasComments)
                score += 0.2;
            if (hasErrorHandling)
                score += 0.2;
            if (lines > 10)
                score += 0.1;
            return {
                score: Math.min(1.0, score),
                metrics: {
                    lines,
                    hasComments,
                    hasErrorHandling,
                    complexity: lines > 20 ? 'medium' : 'simple'
                }
            };
        }
        /**
         * Generate code improvement suggestions
         */
        generateCodeSuggestions(code) {
            const suggestions = [];
            if (!/\/\/|\/\*|\#/.test(code)) {
                suggestions.push('Add comments for better documentation');
            }
            if (!/try|catch|except/.test(code)) {
                suggestions.push('Consider adding error handling');
            }
            if (code.split('\n').length < 5) {
                suggestions.push('Code could be more detailed or include examples');
            }
            return suggestions;
        }
        /**
         * Get model capabilities
         */
        getModelCapabilities(model) {
            const capabilities = {
                'gpt-4': ['text-generation', 'code-generation', 'analysis', 'reasoning'],
                'gpt-4-turbo': ['text-generation', 'code-generation', 'analysis', 'reasoning', 'vision'],
                'gpt-3.5-turbo': ['text-generation', 'basic-analysis', 'conversation']
            };
            return capabilities[model] || ['text-generation'];
        }
        /**
         * Get model pricing information
         */
        getModelPricing(model) {
            const pricing = {
                'gpt-4': { inputPerKToken: 0.03, outputPerKToken: 0.06 },
                'gpt-4-turbo': { inputPerKToken: 0.01, outputPerKToken: 0.03 },
                'gpt-3.5-turbo': { inputPerKToken: 0.0015, outputPerKToken: 0.002 }
            };
            return pricing[model] || pricing['gpt-3.5-turbo'];
        }
        /**
         * Get model limits
         */
        getModelLimits(model) {
            const limits = {
                'gpt-4': { maxTokens: 8192, maxRequestsPerMinute: 200 },
                'gpt-4-turbo': { maxTokens: 128000, maxRequestsPerMinute: 500 },
                'gpt-3.5-turbo': { maxTokens: 4096, maxRequestsPerMinute: 3500 }
            };
            return limits[model] || limits['gpt-3.5-turbo'];
        }
        /**
         * Get default model info for unknown models
         */
        getDefaultModelInfo(model) {
            return {
                id: model,
                created: new Date(),
                ownedBy: 'unknown',
                capabilities: ['text-generation'],
                pricing: { inputPerKToken: 0.002, outputPerKToken: 0.002 },
                limits: { maxTokens: 4096, maxRequestsPerMinute: 100 }
            };
        }
        /**
         * Get adapter statistics
         */
        getStatistics() {
            return {
                requestCount: this.requestCount,
                totalCost: this.totalCost,
                averageCostPerRequest: this.requestCount > 0 ? this.totalCost / this.requestCount : 0,
                isInitialized: this.isInitialized
            };
        }
        /**
         * Health check for the adapter
         */
        isHealthy() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    if (!this.isInitialized) {
                        yield this.initialize();
                    }
                    return this.isInitialized;
                }
                catch (error) {
                    console.error('❌ OpenAI adapter health check failed:', error);
                    return false;
                }
            });
        }
        /**
         * Cleanup the adapter
         */
        shutdown() {
            return __awaiter(this, void 0, void 0, function* () {
                console.log('🔌 OpenAI integration adapter shutting down...');
                console.log(`📊 Final statistics: ${this.requestCount} requests, $${this.totalCost.toFixed(6)} total cost`);
                this.isInitialized = false;
            });
        }
    };
    __setFunctionName(_classThis, "OpenAIIntegrationAdapter");
    (() => {
        var _a;
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OpenAIIntegrationAdapter = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OpenAIIntegrationAdapter = _classThis;
})();
exports.OpenAIIntegrationAdapter = OpenAIIntegrationAdapter;
