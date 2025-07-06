/**
 * @fileoverview OpenAI Integration Adapter for ChatGPT-Buddy
 * @description Adapter for integrating with OpenAI API services
 * @author rydnr
 */
import { Port } from '@typescript-eda/infrastructure';
/**
 * Port interface for OpenAI integration operations
 */
export declare abstract class OpenAIIntegrationPort extends Port {
    readonly name = "OpenAIIntegrationPort";
    abstract generateResponse(request: OpenAIRequest): Promise<OpenAIResponse>;
    abstract generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResponse>;
    abstract analyzeText(text: string, analysisType: AnalysisType): Promise<AnalysisResponse>;
    abstract generateCode(description: string, language: string): Promise<CodeGenerationResponse>;
    abstract getModelInfo(model: string): Promise<ModelInfo>;
}
/**
 * OpenAI integration adapter using official OpenAI SDK
 * Provides ChatGPT and other OpenAI model integrations for automation
 */
export declare class OpenAIIntegrationAdapter extends OpenAIIntegrationPort {
    private client;
    private isInitialized;
    private requestCount;
    private totalCost;
    constructor();
    /**
     * Initialize the OpenAI adapter
     */
    initialize(): Promise<void>;
    /**
     * Generate response using OpenAI models
     */
    generateResponse(request: OpenAIRequest): Promise<OpenAIResponse>;
    /**
     * Generate text completion
     */
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResponse>;
    /**
     * Analyze text using OpenAI models
     */
    analyzeText(text: string, analysisType: AnalysisType): Promise<AnalysisResponse>;
    /**
     * Generate code using OpenAI models
     */
    generateCode(description: string, language: string): Promise<CodeGenerationResponse>;
    /**
     * Get information about available models
     */
    getModelInfo(model: string): Promise<ModelInfo>;
    /**
     * Build messages array for chat completion
     */
    private buildMessages;
    /**
     * Calculate estimated cost for the request
     */
    private calculateCost;
    /**
     * Estimate confidence based on response characteristics
     */
    private estimateConfidence;
    /**
     * Assess completion quality
     */
    private assessCompletionQuality;
    /**
     * Extract insights from analysis result
     */
    private extractInsights;
    /**
     * Assess code quality
     */
    private assessCodeQuality;
    /**
     * Generate code improvement suggestions
     */
    private generateCodeSuggestions;
    /**
     * Get model capabilities
     */
    private getModelCapabilities;
    /**
     * Get model pricing information
     */
    private getModelPricing;
    /**
     * Get model limits
     */
    private getModelLimits;
    /**
     * Get default model info for unknown models
     */
    private getDefaultModelInfo;
    /**
     * Get adapter statistics
     */
    getStatistics(): OpenAIStatistics;
    /**
     * Health check for the adapter
     */
    isHealthy(): Promise<boolean>;
    /**
     * Cleanup the adapter
     */
    shutdown(): Promise<void>;
}
export interface OpenAIRequest {
    prompt: string;
    model?: string;
    context?: any;
    options?: RequestOptions;
}
export interface RequestOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    stop?: string[];
}
export interface OpenAIResponse {
    content: string;
    finishReason: 'stop' | 'length' | 'content_filter' | 'function_call';
    usage: TokenUsage;
    modelUsed: string;
    responseTime: number;
    confidence?: number;
}
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
}
export interface CompletionOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    stop?: string[];
}
export interface CompletionResponse {
    completion: string;
    usage: TokenUsage;
    responseTime: number;
    quality: CompletionQuality;
}
export interface CompletionQuality {
    score: number;
    factors: {
        length: 'short' | 'adequate' | 'long';
        structure: 'basic' | 'good' | 'excellent';
        detail: 'minimal' | 'concise' | 'detailed';
    };
}
export type AnalysisType = 'sentiment' | 'summary' | 'keywords' | 'intent' | 'quality';
export interface AnalysisResponse {
    analysisType: AnalysisType;
    result: string;
    confidence: number;
    usage: TokenUsage;
    insights: string[];
}
export interface CodeGenerationResponse {
    code: string;
    language: string;
    description: string;
    usage: TokenUsage;
    quality: CodeQuality;
    suggestions: string[];
}
export interface CodeQuality {
    score: number;
    metrics: {
        lines: number;
        hasComments: boolean;
        hasErrorHandling: boolean;
        complexity: 'simple' | 'medium' | 'complex';
    };
}
export interface ModelInfo {
    id: string;
    created: Date;
    ownedBy: string;
    capabilities: string[];
    pricing: ModelPricing;
    limits: ModelLimits;
}
export interface ModelPricing {
    inputPerKToken: number;
    outputPerKToken: number;
}
export interface ModelLimits {
    maxTokens: number;
    maxRequestsPerMinute: number;
}
export interface OpenAIStatistics {
    requestCount: number;
    totalCost: number;
    averageCostPerRequest: number;
    isInitialized: boolean;
}
//# sourceMappingURL=openai-integration-adapter.d.ts.map