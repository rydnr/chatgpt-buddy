"use strict";
/**
 * @fileoverview OpenAI Integration Adapter for ChatGPT-Buddy
 * @description Adapter for integrating with OpenAI API services
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
let OpenAIIntegrationAdapter = class OpenAIIntegrationAdapter extends OpenAIIntegrationPort {
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
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ OpenAI adapter already initialized');
            return;
        }
        console.log('🔧 Initializing OpenAI integration adapter...');
        try {
            // Test the connection by listing available models
            const models = await this.client.models.list();
            console.log(`✅ OpenAI connection successful, ${models.data.length} models available`);
            this.isInitialized = true;
            console.log('✅ OpenAI integration adapter initialized');
        }
        catch (error) {
            console.error('❌ Failed to initialize OpenAI adapter:', error);
            throw error;
        }
    }
    /**
     * Generate response using OpenAI models
     */
    async generateResponse(request) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        console.log(`🤖 Generating OpenAI response with model: ${request.model}`);
        const startTime = Date.now();
        try {
            const completion = await this.client.chat.completions.create({
                model: request.model || 'gpt-3.5-turbo',
                messages: this.buildMessages(request.prompt, request.context),
                max_tokens: request.options?.maxTokens || 1000,
                temperature: request.options?.temperature || 0.7,
                top_p: request.options?.topP || 1,
                presence_penalty: request.options?.presencePenalty || 0,
                frequency_penalty: request.options?.frequencyPenalty || 0,
                stop: request.options?.stop,
                stream: false
            });
            const responseTime = Date.now() - startTime;
            this.requestCount++;
            // Calculate cost (simplified pricing)
            const cost = this.calculateCost(completion.usage, request.model || 'gpt-3.5-turbo');
            this.totalCost += cost;
            const response = {
                content: completion.choices[0]?.message?.content || '',
                finishReason: completion.choices[0]?.finish_reason,
                usage: {
                    promptTokens: completion.usage?.prompt_tokens || 0,
                    completionTokens: completion.usage?.completion_tokens || 0,
                    totalTokens: completion.usage?.total_tokens || 0,
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
    }
    /**
     * Generate text completion
     */
    async generateCompletion(prompt, options) {
        console.log(`📝 Generating completion for prompt: ${prompt.substring(0, 100)}...`);
        const request = {
            prompt,
            model: options?.model || 'gpt-3.5-turbo',
            options: {
                maxTokens: options?.maxTokens || 500,
                temperature: options?.temperature || 0.7,
                stop: options?.stop
            }
        };
        const response = await this.generateResponse(request);
        return {
            completion: response.content,
            usage: response.usage,
            responseTime: response.responseTime,
            quality: this.assessCompletionQuality(response.content)
        };
    }
    /**
     * Analyze text using OpenAI models
     */
    async analyzeText(text, analysisType) {
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
        const response = await this.generateResponse({
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
    }
    /**
     * Generate code using OpenAI models
     */
    async generateCode(description, language) {
        console.log(`💻 Generating ${language} code for: ${description}`);
        const prompt = `Generate ${language} code for the following requirement: ${description}. 
    Please provide clean, well-commented code with proper error handling.`;
        const response = await this.generateResponse({
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
    }
    /**
     * Get information about available models
     */
    async getModelInfo(model) {
        try {
            const modelDetails = await this.client.models.retrieve(model);
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
    }
    /**
     * Build messages array for chat completion
     */
    buildMessages(prompt, context) {
        const messages = [];
        // Add system message if context provides one
        if (context?.systemMessage) {
            messages.push({
                role: 'system',
                content: context.systemMessage
            });
        }
        // Add conversation history if available
        if (context?.previousMessages) {
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
        const contentLength = choice.message?.content?.length || 0;
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
    async isHealthy() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            return this.isInitialized;
        }
        catch (error) {
            console.error('❌ OpenAI adapter health check failed:', error);
            return false;
        }
    }
    /**
     * Cleanup the adapter
     */
    async shutdown() {
        console.log('🔌 OpenAI integration adapter shutting down...');
        console.log(`📊 Final statistics: ${this.requestCount} requests, $${this.totalCost.toFixed(6)} total cost`);
        this.isInitialized = false;
    }
};
exports.OpenAIIntegrationAdapter = OpenAIIntegrationAdapter;
exports.OpenAIIntegrationAdapter = OpenAIIntegrationAdapter = __decorate([
    (0, infrastructure_1.AdapterFor)(OpenAIIntegrationPort),
    __metadata("design:paramtypes", [])
], OpenAIIntegrationAdapter);
//# sourceMappingURL=openai-integration-adapter.js.map