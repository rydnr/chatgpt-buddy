/**
 * @fileoverview Anthropic Integration Adapter for ChatGPT-Buddy
 * @description Adapter for integrating with Anthropic Claude API services
 * @author rydnr
 */
import { Port } from '@typescript-eda/infrastructure';
/**
 * Port interface for Anthropic integration operations
 */
export declare abstract class AnthropicIntegrationPort extends Port {
    readonly name = "AnthropicIntegrationPort";
    abstract generateResponse(request: AnthropicRequest): Promise<AnthropicResponse>;
    abstract analyzeText(text: string, analysisType: string): Promise<any>;
    abstract getModelInfo(model: string): Promise<any>;
}
/**
 * Anthropic integration adapter using Anthropic SDK
 * Provides Claude model integrations for automation
 */
export declare class AnthropicIntegrationAdapter extends AnthropicIntegrationPort {
    private isInitialized;
    initialize(): Promise<void>;
    generateResponse(request: AnthropicRequest): Promise<AnthropicResponse>;
    analyzeText(text: string, analysisType: string): Promise<any>;
    getModelInfo(model: string): Promise<any>;
    isHealthy(): Promise<boolean>;
    shutdown(): Promise<void>;
}
export interface AnthropicRequest {
    prompt: string;
    model?: string;
    options?: any;
}
export interface AnthropicResponse {
    content: string;
    usage: any;
    modelUsed: string;
    responseTime: number;
}
//# sourceMappingURL=anthropic-integration-adapter.d.ts.map