/**
 * @fileoverview OpenAI Integration Adapter for ChatGPT-Buddy
 * @description Adapter for integrating with OpenAI API services
 * @author rydnr
 */

import { AdapterFor, Port } from '@typescript-eda/infrastructure';
import OpenAI from 'openai';

/**
 * Port interface for OpenAI integration operations
 */
export abstract class OpenAIIntegrationPort extends Port {
  public readonly name = 'OpenAIIntegrationPort';
  
  public abstract generateResponse(request: OpenAIRequest): Promise<OpenAIResponse>;
  public abstract generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResponse>;
  public abstract analyzeText(text: string, analysisType: AnalysisType): Promise<AnalysisResponse>;
  public abstract generateCode(description: string, language: string): Promise<CodeGenerationResponse>;
  public abstract getModelInfo(model: string): Promise<ModelInfo>;
}

/**
 * OpenAI integration adapter using official OpenAI SDK
 * Provides ChatGPT and other OpenAI model integrations for automation
 */
@AdapterFor(OpenAIIntegrationPort)
export class OpenAIIntegrationAdapter extends OpenAIIntegrationPort {
  private client: OpenAI;
  private isInitialized = false;
  private requestCount = 0;
  private totalCost = 0;

  constructor() {
    super();
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OpenAI API key not found in environment variables');
    }

    this.client = new OpenAI({
      apiKey: apiKey || 'dummy-key-for-testing'
    });
  }

  /**
   * Initialize the OpenAI adapter
   */
  public async initialize(): Promise<void> {
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
      
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI adapter:', error);
      throw error;
    }
  }

  /**
   * Generate response using OpenAI models
   */
  public async generateResponse(request: OpenAIRequest): Promise<OpenAIResponse> {
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

      const response: OpenAIResponse = {
        content: completion.choices[0]?.message?.content || '',
        finishReason: completion.choices[0]?.finish_reason as any,
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

    } catch (error) {
      console.error('❌ OpenAI response generation failed:', error);
      throw new Error(`OpenAI request failed: ${error.message}`);
    }
  }

  /**
   * Generate text completion
   */
  public async generateCompletion(
    prompt: string, 
    options?: CompletionOptions
  ): Promise<CompletionResponse> {
    console.log(`📝 Generating completion for prompt: ${prompt.substring(0, 100)}...`);

    const request: OpenAIRequest = {
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
  public async analyzeText(text: string, analysisType: AnalysisType): Promise<AnalysisResponse> {
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
  public async generateCode(description: string, language: string): Promise<CodeGenerationResponse> {
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
  public async getModelInfo(model: string): Promise<ModelInfo> {
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
    } catch (error) {
      console.warn(`⚠️ Could not retrieve model info for ${model}:`, error);
      return this.getDefaultModelInfo(model);
    }
  }

  /**
   * Build messages array for chat completion
   */
  private buildMessages(prompt: string, context?: any): any[] {
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
  private calculateCost(usage: any, model: string): number {
    if (!usage) return 0;

    // Simplified pricing (as of 2024, actual prices may vary)
    const pricing: Record<string, { input: number; output: number }> = {
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
  private estimateConfidence(choice: any): number {
    if (!choice) return 0.5;

    let confidence = 0.8; // Base confidence

    // Adjust based on finish reason
    if (choice.finish_reason === 'stop') {
      confidence += 0.1; // Normal completion
    } else if (choice.finish_reason === 'length') {
      confidence -= 0.2; // Truncated response
    }

    // Adjust based on response length
    const contentLength = choice.message?.content?.length || 0;
    if (contentLength < 10) {
      confidence -= 0.3; // Very short response
    } else if (contentLength > 1000) {
      confidence += 0.1; // Detailed response
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Assess completion quality
   */
  private assessCompletionQuality(completion: string): CompletionQuality {
    const length = completion.length;
    const hasStructure = /\n|\.|,/.test(completion);
    const hasNumbers = /\d/.test(completion);
    
    let score = 0.5;
    
    if (length > 50) score += 0.2;
    if (length > 200) score += 0.1;
    if (hasStructure) score += 0.1;
    if (hasNumbers) score += 0.1;
    
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
  private extractInsights(result: string, analysisType: AnalysisType): string[] {
    const insights = [];
    
    switch (analysisType) {
      case 'sentiment':
        if (result.toLowerCase().includes('positive')) {
          insights.push('Positive sentiment detected');
        } else if (result.toLowerCase().includes('negative')) {
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
  private assessCodeQuality(code: string, language: string): CodeQuality {
    const lines = code.split('\n').length;
    const hasComments = /\/\/|\/\*|\#/.test(code);
    const hasErrorHandling = /try|catch|except|error|Error/.test(code);
    
    let score = 0.5;
    
    if (hasComments) score += 0.2;
    if (hasErrorHandling) score += 0.2;
    if (lines > 10) score += 0.1;
    
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
  private generateCodeSuggestions(code: string): string[] {
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
  private getModelCapabilities(model: string): string[] {
    const capabilities: Record<string, string[]> = {
      'gpt-4': ['text-generation', 'code-generation', 'analysis', 'reasoning'],
      'gpt-4-turbo': ['text-generation', 'code-generation', 'analysis', 'reasoning', 'vision'],
      'gpt-3.5-turbo': ['text-generation', 'basic-analysis', 'conversation']
    };
    
    return capabilities[model] || ['text-generation'];
  }

  /**
   * Get model pricing information
   */
  private getModelPricing(model: string): ModelPricing {
    const pricing: Record<string, ModelPricing> = {
      'gpt-4': { inputPerKToken: 0.03, outputPerKToken: 0.06 },
      'gpt-4-turbo': { inputPerKToken: 0.01, outputPerKToken: 0.03 },
      'gpt-3.5-turbo': { inputPerKToken: 0.0015, outputPerKToken: 0.002 }
    };
    
    return pricing[model] || pricing['gpt-3.5-turbo'];
  }

  /**
   * Get model limits
   */
  private getModelLimits(model: string): ModelLimits {
    const limits: Record<string, ModelLimits> = {
      'gpt-4': { maxTokens: 8192, maxRequestsPerMinute: 200 },
      'gpt-4-turbo': { maxTokens: 128000, maxRequestsPerMinute: 500 },
      'gpt-3.5-turbo': { maxTokens: 4096, maxRequestsPerMinute: 3500 }
    };
    
    return limits[model] || limits['gpt-3.5-turbo'];
  }

  /**
   * Get default model info for unknown models
   */
  private getDefaultModelInfo(model: string): ModelInfo {
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
  public getStatistics(): OpenAIStatistics {
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
  public async isHealthy(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      return this.isInitialized;
    } catch (error) {
      console.error('❌ OpenAI adapter health check failed:', error);
      return false;
    }
  }

  /**
   * Cleanup the adapter
   */
  public async shutdown(): Promise<void> {
    console.log('🔌 OpenAI integration adapter shutting down...');
    console.log(`📊 Final statistics: ${this.requestCount} requests, $${this.totalCost.toFixed(6)} total cost`);
    this.isInitialized = false;
  }
}

// Supporting interfaces and types

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
  score: number; // 0-1
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
  score: number; // 0-1
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