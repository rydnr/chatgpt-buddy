"use strict";
/**
 * @fileoverview ChatGPT-Buddy Client SDK
 * @description TypeScript client for ChatGPT-Buddy server with AI automation capabilities
 * @author rydnr
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGPTBuddyClient = exports.PatternLearningRequestedEvent = exports.AIAutomationRequestedEvent = exports.ChatGPTInteractionRequestedEvent = void 0;
exports.createChatGPTBuddyClient = createChatGPTBuddyClient;
const domain_1 = require("@typescript-eda/domain");
const application_1 = require("@typescript-eda/application");
const axios_1 = __importDefault(require("axios"));
const ws_1 = __importDefault(require("ws"));
/**
 * ChatGPT automation events for client-server communication
 */
class ChatGPTInteractionRequestedEvent extends domain_1.Event {
    constructor(prompt, model, context, options) {
        super();
        this.prompt = prompt;
        this.model = model;
        this.context = context;
        this.options = options;
        this.type = 'ChatGPTInteractionRequested';
    }
}
exports.ChatGPTInteractionRequestedEvent = ChatGPTInteractionRequestedEvent;
class AIAutomationRequestedEvent extends domain_1.Event {
    constructor(task, instructions, options) {
        super();
        this.task = task;
        this.instructions = instructions;
        this.options = options;
        this.type = 'AIAutomationRequested';
    }
}
exports.AIAutomationRequestedEvent = AIAutomationRequestedEvent;
class PatternLearningRequestedEvent extends domain_1.Event {
    constructor(enabled, sessionType, learningLevel) {
        super();
        this.enabled = enabled;
        this.sessionType = sessionType;
        this.learningLevel = learningLevel;
        this.type = 'PatternLearningRequested';
    }
}
exports.PatternLearningRequestedEvent = PatternLearningRequestedEvent;
/**
 * Main ChatGPT-Buddy client class
 * Provides high-level API for AI automation and ChatGPT integration
 */
class ChatGPTBuddyClient extends application_1.Application {
    constructor(config) {
        super();
        this.config = config;
        this.isConnected = false;
        this.responseHandlers = new Map();
        this.metadata = new Map([
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
        // Initialize HTTP client
        this.httpClient = axios_1.default.create({
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
    async initialize() {
        console.log('🚀 Initializing ChatGPT-Buddy client...');
        try {
            // Test server connection
            await this.testConnection();
            // Initialize WebSocket if enabled
            if (this.config.enableWebSocket !== false) {
                await this.initializeWebSocket();
            }
            console.log('✅ ChatGPT-Buddy client initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize ChatGPT-Buddy client:', error);
            throw error;
        }
    }
    /**
     * Send a ChatGPT interaction request
     */
    async chat(options) {
        console.log(`🤖 Sending ChatGPT request with model: ${options.model || this.config.defaultModel}`);
        const event = new ChatGPTInteractionRequestedEvent(options.prompt, options.model || this.config.defaultModel, options.context, options.interactionOptions);
        try {
            const response = await this.httpClient.post('/api/chatgpt/interact', {
                prompt: options.prompt,
                model: options.model || this.config.defaultModel,
                context: options.context,
                options: options.interactionOptions,
                correlationId: event.correlationId
            });
            return this.parseChatGPTResponse(response.data);
        }
        catch (error) {
            console.error('❌ ChatGPT interaction failed:', error);
            throw this.handleApiError(error);
        }
    }
    /**
     * Execute AI-enhanced automation
     */
    async automateWithAI(options) {
        console.log(`🤖 Starting AI automation task: ${options.task}`);
        const event = new AIAutomationRequestedEvent(options.task, options.instructions, options.automationOptions);
        try {
            const response = await this.httpClient.post('/api/automation/ai-enhanced', {
                task: options.task,
                instructions: options.instructions,
                options: options.automationOptions,
                correlationId: event.correlationId
            });
            return this.parseAutomationResult(response.data);
        }
        catch (error) {
            console.error('❌ AI automation failed:', error);
            throw this.handleApiError(error);
        }
    }
    /**
     * Enable or disable pattern learning mode
     */
    async setPatternLearning(options) {
        console.log(`🎓 ${options.enabled ? 'Enabling' : 'Disabling'} pattern learning`);
        const event = new PatternLearningRequestedEvent(options.enabled, options.sessionType, options.learningLevel);
        try {
            await this.httpClient.post('/api/training/pattern-learning', {
                enabled: options.enabled,
                sessionType: options.sessionType,
                learningLevel: options.learningLevel,
                correlationId: event.correlationId
            });
            console.log('✅ Pattern learning mode updated successfully');
        }
        catch (error) {
            console.error('❌ Failed to update pattern learning mode:', error);
            throw this.handleApiError(error);
        }
    }
    /**
     * Get server health and capabilities
     */
    async getServerInfo() {
        try {
            const response = await this.httpClient.get('/api/health');
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to get server info:', error);
            throw this.handleApiError(error);
        }
    }
    /**
     * Get automation patterns and analytics
     */
    async getPatterns() {
        try {
            const response = await this.httpClient.get('/api/patterns');
            return response.data.patterns || [];
        }
        catch (error) {
            console.error('❌ Failed to get patterns:', error);
            throw this.handleApiError(error);
        }
    }
    /**
     * Test connection to the server
     */
    async testConnection() {
        try {
            await this.httpClient.get('/api/health');
            console.log('✅ Server connection test successful');
        }
        catch (error) {
            console.error('❌ Server connection test failed');
            throw new Error(`Cannot connect to ChatGPT-Buddy server at ${this.config.serverUrl}`);
        }
    }
    /**
     * Initialize WebSocket connection for real-time updates
     */
    async initializeWebSocket() {
        const wsUrl = this.config.serverUrl.replace(/^http/, 'ws') + '/ws';
        try {
            this.websocket = new ws_1.default(wsUrl);
            this.websocket.on('open', () => {
                console.log('🔌 WebSocket connection established');
                this.isConnected = true;
            });
            this.websocket.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleWebSocketMessage(message);
                }
                catch (error) {
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
        }
        catch (error) {
            console.warn('⚠️ WebSocket initialization failed, continuing with HTTP only:', error);
        }
    }
    /**
     * Handle incoming WebSocket messages
     */
    handleWebSocketMessage(message) {
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
    setupHttpInterceptors() {
        // Request interceptor
        this.httpClient.interceptors.request.use((config) => {
            console.log(`📤 HTTP ${config.method?.toUpperCase()}: ${config.url}`);
            return config;
        });
        // Response interceptor
        this.httpClient.interceptors.response.use((response) => {
            console.log(`📥 HTTP ${response.status}: ${response.config.url}`);
            return response;
        }, (error) => {
            console.error(`❌ HTTP Error: ${error.response?.status} ${error.config?.url}`);
            return Promise.reject(error);
        });
    }
    /**
     * Parse ChatGPT API response
     */
    parseChatGPTResponse(data) {
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
    parseAutomationResult(data) {
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
    handleApiError(error) {
        if (error.response) {
            const message = error.response.data?.message || error.response.statusText || 'API Error';
            return new Error(`API Error (${error.response.status}): ${message}`);
        }
        else if (error.request) {
            return new Error('Network Error: Unable to reach ChatGPT-Buddy server');
        }
        else {
            return new Error(`Client Error: ${error.message}`);
        }
    }
    /**
     * Clean up connections
     */
    async disconnect() {
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
    isClientConnected() {
        return this.isConnected;
    }
}
exports.ChatGPTBuddyClient = ChatGPTBuddyClient;
/**
 * Factory function to create and initialize a ChatGPT-Buddy client
 */
async function createChatGPTBuddyClient(config) {
    const client = new ChatGPTBuddyClient(config);
    await client.initialize();
    return client;
}
//# sourceMappingURL=chatgpt-buddy-client.js.map