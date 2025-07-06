/**
 * @fileoverview ChatGPT-Buddy Client SDK
 * @description TypeScript client for ChatGPT-Buddy server with AI automation capabilities
 * @author rydnr
 */
import { Event } from '@typescript-eda/domain';
import { Application } from '@typescript-eda/application';
/**
 * ChatGPT automation events for client-server communication
 */
export declare class ChatGPTInteractionRequestedEvent extends Event {
    readonly prompt: string;
    readonly model?: string | undefined;
    readonly context?: any | undefined;
    readonly options?: ChatGPTInteractionOptions | undefined;
    readonly type = "ChatGPTInteractionRequested";
    constructor(prompt: string, model?: string | undefined, context?: any | undefined, options?: ChatGPTInteractionOptions | undefined);
}
export declare class AIAutomationRequestedEvent extends Event {
    readonly task: string;
    readonly instructions: string[];
    readonly options?: AIAutomationOptions | undefined;
    readonly type = "AIAutomationRequested";
    constructor(task: string, instructions: string[], options?: AIAutomationOptions | undefined);
}
export declare class PatternLearningRequestedEvent extends Event {
    readonly enabled: boolean;
    readonly sessionType?: string | undefined;
    readonly learningLevel?: "basic" | "intermediate" | "advanced" | undefined;
    readonly type = "PatternLearningRequested";
    constructor(enabled: boolean, sessionType?: string | undefined, learningLevel?: "basic" | "intermediate" | "advanced" | undefined);
}
/**
 * Configuration interfaces
 */
export interface ChatGPTBuddyClientConfig {
    serverUrl: string;
    apiKey?: string;
    defaultModel?: string;
    timeout?: number;
    enableWebSocket?: boolean;
    retryAttempts?: number;
}
export interface ChatGPTInteractionOptions {
    maxTokens?: number;
    temperature?: number;
    enableStreaming?: boolean;
    enableLearning?: boolean;
    contextRetention?: boolean;
}
export interface AIAutomationOptions {
    enableLearning?: boolean;
    crossSiteAdaptation?: boolean;
    aiInsights?: boolean;
    errorRecovery?: boolean;
}
export interface ChatGPTResponse {
    content: string;
    usage: TokenUsage;
    modelUsed: string;
    responseTime: number;
    confidence?: number;
    suggestions?: string[];
}
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
export interface AutomationResult {
    success: boolean;
    results: any[];
    aiInsights: AIInsight[];
    learnedPatterns: AutomationPattern[];
    performance: PerformanceMetrics;
}
export interface AIInsight {
    type: string;
    description: string;
    confidence: number;
    recommendation?: string;
}
export interface AutomationPattern {
    id: string;
    name: string;
    description: string;
    selector: string;
    actions: string[];
    confidence: number;
}
export interface PerformanceMetrics {
    executionTime: number;
    successRate: number;
    errorCount: number;
    optimizationScore: number;
}
/**
 * Main ChatGPT-Buddy client class
 * Provides high-level API for AI automation and ChatGPT integration
 */
export declare class ChatGPTBuddyClient extends Application {
    private config;
    private httpClient;
    private websocket?;
    private isConnected;
    private responseHandlers;
    readonly metadata: Map<string, string>;
    constructor(config: ChatGPTBuddyClientConfig);
    /**
     * Initialize the client and establish connections
     */
    initialize(): Promise<void>;
    /**
     * Send a ChatGPT interaction request
     */
    chat(options: {
        prompt: string;
        model?: string;
        context?: any;
        interactionOptions?: ChatGPTInteractionOptions;
    }): Promise<ChatGPTResponse>;
    /**
     * Execute AI-enhanced automation
     */
    automateWithAI(options: {
        task: string;
        instructions: string[];
        automationOptions?: AIAutomationOptions;
    }): Promise<AutomationResult>;
    /**
     * Enable or disable pattern learning mode
     */
    setPatternLearning(options: {
        enabled: boolean;
        sessionType?: string;
        learningLevel?: 'basic' | 'intermediate' | 'advanced';
    }): Promise<void>;
    /**
     * Get server health and capabilities
     */
    getServerInfo(): Promise<any>;
    /**
     * Get automation patterns and analytics
     */
    getPatterns(): Promise<AutomationPattern[]>;
    /**
     * Test connection to the server
     */
    private testConnection;
    /**
     * Initialize WebSocket connection for real-time updates
     */
    private initializeWebSocket;
    /**
     * Handle incoming WebSocket messages
     */
    private handleWebSocketMessage;
    /**
     * Set up HTTP request/response interceptors
     */
    private setupHttpInterceptors;
    /**
     * Parse ChatGPT API response
     */
    private parseChatGPTResponse;
    /**
     * Parse automation result response
     */
    private parseAutomationResult;
    /**
     * Handle and normalize API errors
     */
    private handleApiError;
    /**
     * Clean up connections
     */
    disconnect(): Promise<void>;
    /**
     * Check if client is connected to server
     */
    isClientConnected(): boolean;
}
/**
 * Factory function to create and initialize a ChatGPT-Buddy client
 */
export declare function createChatGPTBuddyClient(config: ChatGPTBuddyClientConfig): Promise<ChatGPTBuddyClient>;
export type { ChatGPTBuddyClientConfig, ChatGPTInteractionOptions, AIAutomationOptions, ChatGPTResponse, AutomationResult, AIInsight, AutomationPattern, PerformanceMetrics, TokenUsage };
//# sourceMappingURL=chatgpt-buddy-client.d.ts.map