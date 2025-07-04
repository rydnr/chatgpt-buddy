/**
 * @fileoverview ChatGPT-Buddy Client SDK
 * @description TypeScript client for ChatGPT-Buddy server with AI automation capabilities
 * @author rydnr
 */

import { Event } from '@typescript-eda/domain';
import { Application } from '@typescript-eda/application';
import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';

/**
 * ChatGPT automation events for client-server communication
 */
export class ChatGPTInteractionRequestedEvent extends Event {
  public readonly type = 'ChatGPTInteractionRequested';
  
  constructor(
    public readonly prompt: string,
    public readonly model?: string,
    public readonly context?: any,
    public readonly options?: ChatGPTInteractionOptions
  ) {
    super();
  }
}

export class AIAutomationRequestedEvent extends Event {
  public readonly type = 'AIAutomationRequested';
  
  constructor(
    public readonly task: string,
    public readonly instructions: string[],
    public readonly options?: AIAutomationOptions
  ) {
    super();
  }
}

export class PatternLearningRequestedEvent extends Event {
  public readonly type = 'PatternLearningRequested';
  
  constructor(
    public readonly enabled: boolean,
    public readonly sessionType?: string,
    public readonly learningLevel?: 'basic' | 'intermediate' | 'advanced'
  ) {
    super();
  }
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
export class ChatGPTBuddyClient extends Application {
  private httpClient: AxiosInstance;
  private websocket?: WebSocket;
  private isConnected = false;
  private responseHandlers = new Map<string, Function>();

  public readonly metadata = new Map([
    ['name', 'ChatGPT-Buddy Client SDK'],
    ['version', '2.0.0'],
    ['capabilities', [
      'chatgpt-integration',
      'ai-automation', 
      'pattern-learning',
      'multi-model-support',
      'intelligent-routing'
    ]]
  ]);

  constructor(private config: ChatGPTBuddyClientConfig) {
    super();
    
    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: config.serverUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });

    // Set up response interceptors
    this.setupHttpInterceptors();
  }

  /**
   * Initialize the client and establish connections
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing ChatGPT-Buddy client...');
    
    try {
      // Test server connection
      await this.testConnection();
      
      // Initialize WebSocket if enabled
      if (this.config.enableWebSocket !== false) {
        await this.initializeWebSocket();
      }
      
      console.log('✅ ChatGPT-Buddy client initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize ChatGPT-Buddy client:', error);
      throw error;
    }
  }

  /**
   * Send a ChatGPT interaction request
   */
  public async chat(options: {
    prompt: string;
    model?: string;
    context?: any;
    interactionOptions?: ChatGPTInteractionOptions;
  }): Promise<ChatGPTResponse> {
    console.log(`🤖 Sending ChatGPT request with model: ${options.model || this.config.defaultModel}`);
    
    const event = new ChatGPTInteractionRequestedEvent(
      options.prompt,
      options.model || this.config.defaultModel,
      options.context,
      options.interactionOptions
    );

    try {
      const response = await this.httpClient.post('/api/chatgpt/interact', {
        prompt: options.prompt,
        model: options.model || this.config.defaultModel,
        context: options.context,
        options: options.interactionOptions,
        correlationId: event.correlationId
      });

      return this.parseChatGPTResponse(response.data);
      
    } catch (error) {
      console.error('❌ ChatGPT interaction failed:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Execute AI-enhanced automation
   */
  public async automateWithAI(options: {
    task: string;
    instructions: string[];
    automationOptions?: AIAutomationOptions;
  }): Promise<AutomationResult> {
    console.log(`🤖 Starting AI automation task: ${options.task}`);
    
    const event = new AIAutomationRequestedEvent(
      options.task,
      options.instructions,
      options.automationOptions
    );

    try {
      const response = await this.httpClient.post('/api/automation/ai-enhanced', {
        task: options.task,
        instructions: options.instructions,
        options: options.automationOptions,
        correlationId: event.correlationId
      });

      return this.parseAutomationResult(response.data);
      
    } catch (error) {
      console.error('❌ AI automation failed:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Enable or disable pattern learning mode
   */
  public async setPatternLearning(options: {
    enabled: boolean;
    sessionType?: string;
    learningLevel?: 'basic' | 'intermediate' | 'advanced';
  }): Promise<void> {
    console.log(`🎓 ${options.enabled ? 'Enabling' : 'Disabling'} pattern learning`);
    
    const event = new PatternLearningRequestedEvent(
      options.enabled,
      options.sessionType,
      options.learningLevel
    );

    try {
      await this.httpClient.post('/api/training/pattern-learning', {
        enabled: options.enabled,
        sessionType: options.sessionType,
        learningLevel: options.learningLevel,
        correlationId: event.correlationId
      });
      
      console.log('✅ Pattern learning mode updated successfully');
      
    } catch (error) {
      console.error('❌ Failed to update pattern learning mode:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get server health and capabilities
   */
  public async getServerInfo(): Promise<any> {
    try {
      const response = await this.httpClient.get('/api/health');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get server info:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get automation patterns and analytics
   */
  public async getPatterns(): Promise<AutomationPattern[]> {
    try {
      const response = await this.httpClient.get('/api/patterns');
      return response.data.patterns || [];
    } catch (error) {
      console.error('❌ Failed to get patterns:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Test connection to the server
   */
  private async testConnection(): Promise<void> {
    try {
      await this.httpClient.get('/api/health');
      console.log('✅ Server connection test successful');
    } catch (error) {
      console.error('❌ Server connection test failed');
      throw new Error(`Cannot connect to ChatGPT-Buddy server at ${this.config.serverUrl}`);
    }
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  private async initializeWebSocket(): Promise<void> {
    const wsUrl = this.config.serverUrl.replace(/^http/, 'ws') + '/ws';
    
    try {
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.on('open', () => {
        console.log('🔌 WebSocket connection established');
        this.isConnected = true;
      });
      
      this.websocket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      });
      
      this.websocket.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.isConnected = false;
      });
      
      this.websocket.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnected = false;
      });
      
    } catch (error) {
      console.warn('⚠️ WebSocket initialization failed, continuing with HTTP only:', error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(message: any): void {
    console.log('📨 Received WebSocket message:', message.type);
    
    // Handle response correlation
    if (message.correlationId && this.responseHandlers.has(message.correlationId)) {
      const handler = this.responseHandlers.get(message.correlationId);
      handler?.(message);
      this.responseHandlers.delete(message.correlationId);
    }
  }

  /**
   * Set up HTTP request/response interceptors
   */
  private setupHttpInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use((config) => {
      console.log(`📤 HTTP ${config.method?.toUpperCase()}: ${config.url}`);
      return config;
    });

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(`📥 HTTP ${response.status}: ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ HTTP Error: ${error.response?.status} ${error.config?.url}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Parse ChatGPT API response
   */
  private parseChatGPTResponse(data: any): ChatGPTResponse {
    return {
      content: data.content || '',
      usage: data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      modelUsed: data.modelUsed || 'unknown',
      responseTime: data.responseTime || 0,
      confidence: data.confidence,
      suggestions: data.suggestions || []
    };
  }

  /**
   * Parse automation result response
   */
  private parseAutomationResult(data: any): AutomationResult {
    return {
      success: data.success || false,
      results: data.results || [],
      aiInsights: data.aiInsights || [],
      learnedPatterns: data.learnedPatterns || [],
      performance: data.performance || {
        executionTime: 0,
        successRate: 0,
        errorCount: 0,
        optimizationScore: 0
      }
    };
  }

  /**
   * Handle and normalize API errors
   */
  private handleApiError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || error.response.statusText || 'API Error';
      return new Error(`API Error (${error.response.status}): ${message}`);
    } else if (error.request) {
      return new Error('Network Error: Unable to reach ChatGPT-Buddy server');
    } else {
      return new Error(`Client Error: ${error.message}`);
    }
  }

  /**
   * Clean up connections
   */
  public async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting ChatGPT-Buddy client...');
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }
    
    this.isConnected = false;
    console.log('✅ ChatGPT-Buddy client disconnected');
  }

  /**
   * Check if client is connected to server
   */
  public isClientConnected(): boolean {
    return this.isConnected;
  }
}

/**
 * Factory function to create and initialize a ChatGPT-Buddy client
 */
export async function createChatGPTBuddyClient(config: ChatGPTBuddyClientConfig): Promise<ChatGPTBuddyClient> {
  const client = new ChatGPTBuddyClient(config);
  await client.initialize();
  return client;
}

// Export types for external use
export type {
  ChatGPTBuddyClientConfig,
  ChatGPTInteractionOptions,
  AIAutomationOptions,
  ChatGPTResponse,
  AutomationResult,
  AIInsight,
  AutomationPattern,
  PerformanceMetrics,
  TokenUsage
};