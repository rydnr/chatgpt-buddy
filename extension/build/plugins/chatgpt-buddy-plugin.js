/**
 * @fileoverview ChatGPT Buddy Plugin Implementation
 * @description AI-powered automation plugin for ChatGPT and language models
 */
/**
 * ChatGPT Plugin Events
 */
export const ChatGPTPluginEvents = {
    // AI Interaction Events
    AI_INTERACTION_REQUESTED: 'chatgpt:interaction:requested',
    AI_RESPONSE_RECEIVED: 'chatgpt:response:received',
    AI_MODEL_SWITCHED: 'chatgpt:model:switched',
    // Training Events
    TRAINING_MODE_ENABLED: 'chatgpt:training:enabled',
    TRAINING_PATTERN_LEARNED: 'chatgpt:training:pattern:learned',
    TRAINING_SESSION_COMPLETED: 'chatgpt:training:session:completed',
    // Automation Events
    CHATGPT_MESSAGE_SENT: 'chatgpt:message:sent',
    CHATGPT_RESPONSE_EXTRACTED: 'chatgpt:response:extracted',
    CONVERSATION_STARTED: 'chatgpt:conversation:started',
    // Performance Events
    AI_PERFORMANCE_UPDATED: 'chatgpt:performance:updated',
    OPTIMIZATION_SUGGESTED: 'chatgpt:optimization:suggested'
};
/**
 * ChatGPT Web Application Contracts
 */
const chatGPTContracts = [
    {
        version: "1.0.0",
        domain: "chat.openai.com",
        title: "ChatGPT Interface Contract",
        description: "Automation contract for ChatGPT web interface",
        capabilities: {
            sendMessage: {
                type: "action",
                description: "Send a message to ChatGPT",
                selector: "textarea[data-id='root']",
                parameters: [
                    {
                        name: "message",
                        type: "string",
                        description: "Message to send to ChatGPT",
                        required: true
                    }
                ],
                returnType: {
                    type: "object",
                    description: "Send operation result"
                }
            },
            getResponse: {
                type: "query",
                description: "Extract ChatGPT's latest response",
                selector: "[data-message-author-role='assistant']:last-child",
                returnType: {
                    type: "string",
                    description: "ChatGPT's response text"
                }
            },
            startNewConversation: {
                type: "action",
                description: "Start a new conversation",
                selector: "[data-testid='new-chat-button'], .text-token-text-primary",
                returnType: {
                    type: "void",
                    description: "New conversation started"
                }
            },
            selectModel: {
                type: "action",
                description: "Select GPT model",
                selector: "[data-testid='model-selector']",
                parameters: [
                    {
                        name: "model",
                        type: "string",
                        description: "Model to select (gpt-4, gpt-3.5-turbo, etc.)",
                        required: true,
                        enum: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]
                    }
                ]
            },
            getConversationHistory: {
                type: "query",
                description: "Get the full conversation history",
                selector: "[data-testid='conversation-turn']",
                returnType: {
                    type: "array",
                    description: "Array of conversation messages"
                }
            },
            enableBrowsing: {
                type: "action",
                description: "Enable web browsing capability",
                selector: "[data-testid='browsing-toggle']"
            },
            enablePlugins: {
                type: "action",
                description: "Enable ChatGPT plugins",
                selector: "[data-testid='plugins-toggle']"
            }
        },
        context: {
            urlPatterns: [
                "https://chat.openai.com/*",
                "https://chatgpt.com/*"
            ],
            accessibility: {
                ariaCompliant: true,
                keyboardNavigation: true
            },
            performance: {
                maxExecutionTime: 30000,
                cacheResults: true
            }
        }
    },
    {
        version: "1.0.0",
        domain: "claude.ai",
        title: "Claude AI Interface Contract",
        description: "Automation contract for Claude AI web interface",
        capabilities: {
            sendMessage: {
                type: "action",
                description: "Send a message to Claude",
                selector: "[data-testid='chat-input']",
                parameters: [
                    {
                        name: "message",
                        type: "string",
                        description: "Message to send to Claude",
                        required: true
                    }
                ]
            },
            getResponse: {
                type: "query",
                description: "Extract Claude's latest response",
                selector: "[data-testid='message']:last-child",
                returnType: {
                    type: "string",
                    description: "Claude's response text"
                }
            },
            startNewConversation: {
                type: "action",
                description: "Start a new conversation with Claude",
                selector: "[data-testid='new-chat']"
            }
        },
        context: {
            urlPatterns: [
                "https://claude.ai/*"
            ]
        }
    }
];
/**
 * ChatGPT Buddy Plugin - Main plugin implementation
 */
export class ChatGPTBuddyPlugin {
    constructor() {
        this.id = 'chatgpt-buddy';
        this.name = 'ChatGPT Buddy';
        this.version = '2.0.0';
        this.description = 'AI-powered automation for ChatGPT and language models';
        this.author = 'rydnr';
        this.metadata = {
            id: this.id,
            name: this.name,
            version: this.version,
            description: this.description,
            author: this.author,
            license: 'MIT',
            repository: 'https://github.com/rydnr/chatgpt-buddy'
        };
        this.capabilities = {
            supportedDomains: [
                'chat.openai.com',
                'chatgpt.com',
                'claude.ai',
                'beta.character.ai'
            ],
            contractDefinitions: chatGPTContracts,
            permissions: [
                'activeTab',
                'storage',
                'background',
                'webRequest'
            ],
            requiredAPIs: [
                'chrome.tabs',
                'chrome.storage',
                'chrome.runtime',
                'chrome.webRequest'
            ]
        };
        this.state = 'uninitialized';
    }
    /**
     * Initialize the plugin
     */
    async initialize(context) {
        try {
            this.context = context;
            this.state = 'initialized';
            // Initialize core services
            this.aiModelManager = new AIModelManager(context);
            this.trainingManager = new TrainingManager(context);
            this.automationEngine = new AutomationEngine(context);
            this.performanceTracker = new PerformanceTracker(context);
            // Set up event listeners
            this.setupEventListeners();
            // Load plugin configuration
            const config = await this.loadConfiguration();
            await this.applyConfiguration(config);
            context.logger.info('ChatGPT Buddy Plugin initialized successfully');
        }
        catch (error) {
            this.state = 'error';
            throw error;
        }
    }
    /**
     * Activate the plugin
     */
    async activate() {
        if (!this.context) {
            throw new Error('Plugin not initialized');
        }
        try {
            this.state = 'active';
            // Start core services
            await this.aiModelManager?.start();
            await this.trainingManager?.start();
            await this.automationEngine?.start();
            await this.performanceTracker?.start();
            // Register contracts
            for (const contract of chatGPTContracts) {
                await this.context.contractRegistry.register(contract);
            }
            // Emit activation event
            await this.context.eventBus.emit({
                type: ChatGPTPluginEvents.AI_INTERACTION_REQUESTED,
                source: this.id,
                data: { activated: true },
                timestamp: new Date().toISOString()
            });
            this.context.logger.info('ChatGPT Buddy Plugin activated successfully');
        }
        catch (error) {
            this.state = 'error';
            throw error;
        }
    }
    /**
     * Deactivate the plugin
     */
    async deactivate() {
        if (!this.context) {
            return;
        }
        try {
            this.state = 'inactive';
            // Stop core services
            await this.aiModelManager?.stop();
            await this.trainingManager?.stop();
            await this.automationEngine?.stop();
            await this.performanceTracker?.stop();
            // Unregister contracts
            for (const contract of chatGPTContracts) {
                await this.context.contractRegistry.unregister(contract.domain + ':' + contract.title);
            }
            this.context.logger.info('ChatGPT Buddy Plugin deactivated');
        }
        catch (error) {
            this.context.logger.error('Error deactivating ChatGPT Buddy Plugin', error);
            throw error;
        }
    }
    /**
     * Destroy the plugin
     */
    async destroy() {
        if (!this.context) {
            return;
        }
        try {
            this.state = 'destroyed';
            // Cleanup all services
            await this.aiModelManager?.destroy();
            await this.trainingManager?.destroy();
            await this.automationEngine?.destroy();
            await this.performanceTracker?.destroy();
            // Clear references
            this.aiModelManager = undefined;
            this.trainingManager = undefined;
            this.automationEngine = undefined;
            this.performanceTracker = undefined;
            this.context = undefined;
        }
        catch (error) {
            console.error('Error destroying ChatGPT Buddy Plugin:', error);
            throw error;
        }
    }
    /**
     * Get plugin contracts
     */
    getContracts() {
        return [...chatGPTContracts];
    }
    /**
     * Execute a plugin capability
     */
    async executeCapability(capability, params) {
        if (!this.context || this.state !== 'active') {
            throw new Error('Plugin not active');
        }
        try {
            switch (capability) {
                case 'sendMessage':
                    return await this.sendMessage(params.message, params.options);
                case 'getResponse':
                    return await this.getLatestResponse(params.options);
                case 'startNewConversation':
                    return await this.startNewConversation();
                case 'selectModel':
                    return await this.selectAIModel(params.model);
                case 'enableTraining':
                    return await this.enableTrainingMode(params.options);
                case 'learnPattern':
                    return await this.learnAutomationPattern(params.pattern);
                case 'getInsights':
                    return await this.getAIInsights(params.options);
                default:
                    throw new Error(`Unknown capability: ${capability}`);
            }
        }
        catch (error) {
            this.context.logger.error(`Failed to execute capability: ${capability}`, error);
            throw error;
        }
    }
    /**
     * Validate capability parameters
     */
    async validateCapability(capability, params) {
        const errors = [];
        switch (capability) {
            case 'sendMessage':
                if (!params.message || typeof params.message !== 'string') {
                    errors.push('Message parameter is required and must be a string');
                }
                break;
            case 'selectModel':
                const validModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'];
                if (!params.model || !validModels.includes(params.model)) {
                    errors.push(`Model must be one of: ${validModels.join(', ')}`);
                }
                break;
            default:
                errors.push(`Unknown capability: ${capability}`);
        }
        return { valid: errors.length === 0, errors };
    }
    /**
     * Get UI components
     */
    getUIComponents() {
        if (!this.context)
            return [];
        return [
            this.context.createUIComponent({
                type: 'overlay',
                name: 'ChatGPT Training Interface',
                description: 'Interactive training overlay for ChatGPT automation',
                render: () => this.renderTrainingOverlay()
            }),
            this.context.createUIComponent({
                type: 'popup',
                name: 'AI Model Selector',
                description: 'Select and configure AI models',
                render: () => this.renderModelSelector()
            }),
            this.context.createUIComponent({
                type: 'sidebar',
                name: 'Automation Pattern Library',
                description: 'Manage learned automation patterns',
                render: () => this.renderPatternLibrary()
            }),
            this.context.createUIComponent({
                type: 'panel',
                name: 'AI Insights Dashboard',
                description: 'View AI performance metrics and suggestions',
                render: () => this.renderInsightsDashboard()
            })
        ];
    }
    /**
     * Get menu items
     */
    getMenuItems() {
        if (!this.context)
            return [];
        return [
            this.context.createMenuItem({
                label: 'Enable Training Mode',
                description: 'Start training ChatGPT automation patterns',
                icon: '🎓',
                shortcut: 'Ctrl+Shift+T',
                action: () => this.enableTrainingMode()
            }),
            this.context.createMenuItem({
                label: 'Select AI Model',
                description: 'Choose preferred AI model',
                icon: '🤖',
                action: () => this.showModelSelector()
            }),
            this.context.createMenuItem({
                label: 'View Pattern Library',
                description: 'Manage automation patterns',
                icon: '📚',
                action: () => this.showPatternLibrary()
            }),
            this.context.createMenuItem({
                label: 'AI Insights',
                description: 'View performance metrics',
                icon: '📊',
                action: () => this.showInsightsDashboard()
            }),
            this.context.createMenuItem({
                label: 'Plugin Settings',
                description: 'Configure ChatGPT Buddy settings',
                icon: '⚙️',
                action: () => this.showSettings()
            })
        ];
    }
    /**
     * Handle plugin events
     */
    async onEvent(event) {
        if (!this.context)
            return;
        try {
            switch (event.type) {
                case 'tab:activated':
                    await this.handleTabActivated(event.data);
                    break;
                case 'automation:pattern:detected':
                    await this.handlePatternDetected(event.data);
                    break;
                case 'training:session:started':
                    await this.handleTrainingSessionStarted(event.data);
                    break;
                case ChatGPTPluginEvents.AI_MODEL_SWITCHED:
                    await this.handleModelSwitched(event.data);
                    break;
                default:
                    this.context.logger.debug(`Unhandled event: ${event.type}`);
            }
        }
        catch (error) {
            this.context.logger.error(`Error handling event: ${event.type}`, error);
        }
    }
    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            enabled: true,
            settings: {
                // AI Model Preferences
                preferredModel: 'gpt-4',
                fallbackModel: 'gpt-3.5-turbo',
                // Training Settings
                enableTrainingMode: true,
                autoLearnPatterns: true,
                trainingConfidenceThreshold: 0.8,
                // Performance Settings
                enablePatternRecognition: true,
                enableAIInsights: true,
                cacheResponses: true,
                maxResponseTime: 30000,
                // UI Preferences
                showTrainingOverlay: true,
                enableKeyboardShortcuts: true,
                notificationLevel: 'normal',
                // API Configuration
                apiKeys: {},
                rateLimits: {
                    requestsPerMinute: 60,
                    maxDailyCost: 10.0
                }
            },
            domains: this.capabilities.supportedDomains,
            permissions: this.capabilities.permissions,
            uiPreferences: {
                theme: 'auto',
                language: 'en',
                notifications: true
            }
        };
    }
    /**
     * Handle configuration changes
     */
    async onConfigChange(config) {
        if (!this.context)
            return;
        try {
            await this.applyConfiguration(config);
            this.context.logger.info('ChatGPT Buddy Plugin configuration updated');
        }
        catch (error) {
            this.context.logger.error('Failed to apply configuration changes', error);
            throw error;
        }
    }
    /**
     * Health check
     */
    async healthCheck() {
        const issues = [];
        try {
            // Check plugin state
            if (this.state !== 'active') {
                issues.push(`Plugin is in ${this.state} state`);
            }
            // Check services
            if (!this.aiModelManager) {
                issues.push('AI Model Manager not initialized');
            }
            if (!this.trainingManager) {
                issues.push('Training Manager not initialized');
            }
            if (!this.automationEngine) {
                issues.push('Automation Engine not initialized');
            }
            // Check context
            if (!this.context) {
                issues.push('Plugin context not available');
            }
            return { healthy: issues.length === 0, issues };
        }
        catch (error) {
            issues.push(`Health check failed: ${error.message}`);
            return { healthy: false, issues };
        }
    }
    /**
     * Get plugin metrics
     */
    async getMetrics() {
        const metrics = {
            pluginId: this.id,
            version: this.version,
            state: this.state,
            uptime: Date.now() - this.metadata.initTime || 0
        };
        try {
            if (this.performanceTracker) {
                const perfMetrics = await this.performanceTracker.getMetrics();
                metrics.performance = perfMetrics;
            }
            if (this.trainingManager) {
                const trainingMetrics = await this.trainingManager.getMetrics();
                metrics.training = trainingMetrics;
            }
            if (this.automationEngine) {
                const automationMetrics = await this.automationEngine.getMetrics();
                metrics.automation = automationMetrics;
            }
        }
        catch (error) {
            metrics.error = error.message;
        }
        return metrics;
    }
    // Private helper methods
    setupEventListeners() {
        if (!this.context)
            return;
        // Listen for domain-specific events
        this.context.eventBus.on('chatgpt:*', (event) => this.onEvent(event));
        this.context.eventBus.on('automation:*', (event) => this.onEvent(event));
        this.context.eventBus.on('training:*', (event) => this.onEvent(event));
    }
    async loadConfiguration() {
        if (!this.context)
            return this.getDefaultConfig();
        try {
            const storedConfig = await this.context.storageService.getConfig();
            return { ...this.getDefaultConfig(), ...storedConfig };
        }
        catch (error) {
            this.context.logger.warn('Failed to load configuration, using defaults', error);
            return this.getDefaultConfig();
        }
    }
    async applyConfiguration(config) {
        if (!this.context)
            return;
        // Apply configuration to services
        await this.aiModelManager?.configure(config.settings);
        await this.trainingManager?.configure(config.settings);
        await this.automationEngine?.configure(config.settings);
        await this.performanceTracker?.configure(config.settings);
        // Save configuration
        await this.context.storageService.setConfig(config);
    }
    // Core functionality methods implementation
    async sendMessage(message, options) {
        if (!this.automationEngine) {
            throw new Error('Automation engine not initialized');
        }
        try {
            const startTime = Date.now();
            // Use automation engine to send message
            const result = await this.automationEngine.sendMessage(message, options);
            const responseTime = Date.now() - startTime;
            // Record performance data
            if (this.performanceTracker) {
                await this.performanceTracker.recordPerformanceData({
                    responseTime,
                    accuracy: 0.9, // Default, should be measured
                    userSatisfaction: 0.8, // Default
                    cost: this.calculateMessageCost(message, options?.model),
                    errorOccurred: false,
                    requestId: this.generateRequestId(),
                    modelUsed: options?.model || this.aiModelManager?.getCurrentModel() || 'default',
                    operationType: 'sendMessage'
                });
            }
            // Emit event
            await this.context.eventBus.emit({
                type: ChatGPTPluginEvents.CHATGPT_MESSAGE_SENT,
                source: this.id,
                data: {
                    message,
                    options,
                    responseTime,
                    success: true
                },
                timestamp: new Date().toISOString()
            });
            return {
                success: true,
                messageId: this.generateRequestId(),
                timestamp: new Date()
            };
        }
        catch (error) {
            this.context.logger.error('Failed to send message', error);
            // Record error
            if (this.performanceTracker) {
                await this.performanceTracker.recordPerformanceData({
                    responseTime: 0,
                    accuracy: 0,
                    userSatisfaction: 0,
                    errorOccurred: true,
                    requestId: this.generateRequestId(),
                    modelUsed: options?.model || 'unknown',
                    operationType: 'sendMessage'
                });
            }
            throw error;
        }
    }
    async getLatestResponse(options) {
        if (!this.automationEngine) {
            throw new Error('Automation engine not initialized');
        }
        try {
            const startTime = Date.now();
            // Use automation engine to extract response
            const response = await this.automationEngine.extractResponse(options);
            const responseTime = Date.now() - startTime;
            // Emit event
            await this.context.eventBus.emit({
                type: ChatGPTPluginEvents.CHATGPT_RESPONSE_EXTRACTED,
                source: this.id,
                data: {
                    response,
                    responseTime,
                    length: response.length
                },
                timestamp: new Date().toISOString()
            });
            return response;
        }
        catch (error) {
            this.context.logger.error('Failed to get latest response', error);
            throw error;
        }
    }
    async startNewConversation() {
        if (!this.automationEngine) {
            throw new Error('Automation engine not initialized');
        }
        try {
            await this.automationEngine.startNewConversation();
            // Emit event
            await this.context.eventBus.emit({
                type: ChatGPTPluginEvents.CONVERSATION_STARTED,
                source: this.id,
                data: {
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
            });
            this.context.logger.info('New conversation started successfully');
        }
        catch (error) {
            this.context.logger.error('Failed to start new conversation', error);
            throw error;
        }
    }
    async selectAIModel(model) {
        if (!this.aiModelManager) {
            throw new Error('AI Model Manager not initialized');
        }
        try {
            // Switch model using AI Model Manager
            await this.aiModelManager.switchToModel(model, 'user_preference');
            // Use automation engine to select model in UI if available
            if (this.automationEngine) {
                try {
                    await this.automationEngine.selectModel(model);
                }
                catch (uiError) {
                    this.context.logger.warn('Failed to select model in UI, but model manager updated', uiError);
                }
            }
            this.context.logger.info(`AI model selected: ${model}`);
        }
        catch (error) {
            this.context.logger.error('Failed to select AI model', error);
            throw error;
        }
    }
    async enableTrainingMode(options) {
        if (!this.trainingManager) {
            throw new Error('Training Manager not initialized');
        }
        try {
            await this.trainingManager.enableTrainingMode();
            this.context.logger.info('Training mode enabled');
        }
        catch (error) {
            this.context.logger.error('Failed to enable training mode', error);
            throw error;
        }
    }
    async learnAutomationPattern(pattern) {
        if (!this.trainingManager) {
            throw new Error('Training Manager not initialized');
        }
        try {
            // Start a training session for the pattern
            const sessionId = await this.trainingManager.startTrainingSession({
                type: 'automation_pattern',
                description: pattern.description || 'User-defined automation pattern',
                expectedOutcome: pattern.expectedOutcome || 'Execute automation successfully',
                context: pattern.context || {}
            });
            // Add the pattern as a training step
            await this.trainingManager.addTrainingStep(sessionId, {
                action: pattern.action,
                selector: pattern.selector,
                parameters: pattern.parameters,
                timestamp: new Date(),
                success: true
            });
            // Complete the session
            const result = await this.trainingManager.endTrainingSession(sessionId, 'pattern_learned');
            this.context.logger.info(`Automation pattern learned: ${result.patternsLearned.length} patterns created`);
        }
        catch (error) {
            this.context.logger.error('Failed to learn automation pattern', error);
            throw error;
        }
    }
    async getAIInsights(options) {
        const insights = {
            performance: {},
            recommendations: [],
            trends: [],
            models: {},
            training: {}
        };
        try {
            // Gather performance insights
            if (this.performanceTracker) {
                const performanceMetrics = await this.performanceTracker.getMetrics();
                insights.performance = performanceMetrics.current;
                insights.recommendations.push(...performanceMetrics.recommendations);
                insights.trends = performanceMetrics.trends;
                // Get optimization suggestions
                const optimizations = await this.performanceTracker.getOptimizationSuggestions();
                insights.recommendations.push(...optimizations.map(opt => opt.recommendation));
            }
            // Gather AI model insights
            if (this.aiModelManager) {
                const modelMetrics = await this.aiModelManager.getMetrics();
                insights.models = {
                    current: modelMetrics.currentModel,
                    available: modelMetrics.availableModels,
                    performance: modelMetrics.modelPerformance,
                    switchHistory: modelMetrics.switchHistory
                };
                // Get model recommendations
                if (options?.context) {
                    const recommendation = await this.aiModelManager.recommendOptimalModel(options.context);
                    insights.recommendations.push(`Consider switching to ${recommendation.modelId}: ${recommendation.reasoning}`);
                }
            }
            // Gather training insights
            if (this.trainingManager) {
                const trainingMetrics = await this.trainingManager.getMetrics();
                insights.training = {
                    mode: trainingMetrics.trainingMode,
                    patterns: trainingMetrics.learnedPatterns,
                    sessions: trainingMetrics.activeSessions,
                    recentActivity: trainingMetrics.recentActivity
                };
                // Get pattern recommendations
                const patterns = await this.trainingManager.getLearnedPatterns();
                const validPatterns = patterns.filter(p => p.confidence > 0.8);
                if (validPatterns.length > 0) {
                    insights.recommendations.push(`${validPatterns.length} high-confidence automation patterns available`);
                }
            }
            // Gather automation insights
            if (this.automationEngine) {
                const automationMetrics = await this.automationEngine.getMetrics();
                insights.automation = {
                    activeExecutions: automationMetrics.activeExecutions,
                    successRate: automationMetrics.successRate,
                    averageExecutionTime: automationMetrics.averageExecutionTime,
                    recentErrors: automationMetrics.recentErrors
                };
            }
            // Generate overall recommendations
            this.generateOverallRecommendations(insights);
            return insights;
        }
        catch (error) {
            this.context.logger.error('Failed to get AI insights', error);
            return {
                error: 'Failed to gather insights',
                message: error.message
            };
        }
    }
    // UI rendering methods (to be implemented)
    async renderTrainingOverlay() {
        const overlay = document.createElement('div');
        overlay.innerHTML = '<div>Training Overlay - Coming Soon</div>';
        return overlay;
    }
    async renderModelSelector() {
        const selector = document.createElement('div');
        selector.innerHTML = '<div>Model Selector - Coming Soon</div>';
        return selector;
    }
    async renderPatternLibrary() {
        const library = document.createElement('div');
        library.innerHTML = '<div>Pattern Library - Coming Soon</div>';
        return library;
    }
    async renderInsightsDashboard() {
        const dashboard = document.createElement('div');
        dashboard.innerHTML = '<div>AI Insights Dashboard - Coming Soon</div>';
        return dashboard;
    }
    // Menu action methods (to be implemented)
    async showModelSelector() {
        // Implementation will be added in next step
    }
    async showPatternLibrary() {
        // Implementation will be added in next step
    }
    async showInsightsDashboard() {
        // Implementation will be added in next step
    }
    async showSettings() {
        // Implementation will be added in next step
    }
    // Event handlers (to be implemented)
    async handleTabActivated(data) {
        // Implementation will be added in next step
    }
    async handlePatternDetected(data) {
        // Implementation will be added in next step
    }
    async handleTrainingSessionStarted(data) {
        // Implementation will be added in next step
    }
    async handleModelSwitched(data) {
        this.context.logger.info('AI model switched', data);
        // Record model switch for performance tracking
        if (this.performanceTracker) {
            await this.performanceTracker.recordPerformanceData({
                responseTime: 0,
                accuracy: 1,
                userSatisfaction: 0.8,
                cost: 0,
                errorOccurred: false,
                requestId: this.generateRequestId(),
                modelUsed: data.currentModel,
                operationType: 'model_switch'
            });
        }
    }
    // Helper methods
    calculateMessageCost(message, model) {
        // Simplified cost calculation based on message length and model
        const baseCostPerToken = 0.002; // Default cost
        const estimatedTokens = Math.ceil(message.length / 4); // Rough estimation
        const modelMultiplier = this.getModelCostMultiplier(model || 'gpt-3.5-turbo');
        return estimatedTokens * baseCostPerToken * modelMultiplier;
    }
    getModelCostMultiplier(model) {
        const multipliers = {
            'gpt-4': 15,
            'gpt-4-turbo': 7.5,
            'gpt-3.5-turbo': 1,
            'claude-3-opus': 18,
            'claude-3-sonnet': 4
        };
        return multipliers[model] || 1;
    }
    generateRequestId() {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    generateOverallRecommendations(insights) {
        // Add overall system recommendations based on all insights
        if (insights.performance?.responseTime?.current > 10000) {
            insights.recommendations.unshift('PRIORITY: Response time is critically high - consider model optimization');
        }
        if (insights.performance?.errorRate?.current > 0.1) {
            insights.recommendations.unshift('PRIORITY: High error rate detected - review automation patterns');
        }
        if (insights.training?.patterns > 10 && insights.performance?.successRate < 0.8) {
            insights.recommendations.push('Consider reviewing learned patterns for quality');
        }
        if (insights.models?.switchHistory?.length > 5) {
            insights.recommendations.push('Frequent model switching detected - consider setting a preferred model');
        }
    }
}
// Service classes implementation
/**
 * AI Model Manager - Handles AI model selection, switching, and optimization
 */
class AIModelManager {
    constructor(context) {
        this.context = context;
        this.isStarted = false;
        this.availableModels = [];
        this.modelPerformance = new Map();
        this.modelSwitchHistory = [];
        this.currentModel = 'gpt-3.5-turbo'; // Default model
        this.initializeAvailableModels();
    }
    async start() {
        if (this.isStarted)
            return;
        this.context.logger.info('Starting AI Model Manager');
        // Load saved model preferences
        const savedModel = await this.context.storageService.get('currentModel');
        if (savedModel) {
            this.currentModel = savedModel;
        }
        // Load performance data
        const performanceData = await this.context.storageService.get('modelPerformance');
        if (performanceData) {
            this.modelPerformance = new Map(performanceData);
        }
        // Set up event listeners
        this.context.eventBus.on(ChatGPTPluginEvents.AI_MODEL_SWITCHED, (event) => {
            this.handleModelSwitched(event);
        });
        this.isStarted = true;
        this.context.logger.info('AI Model Manager started successfully');
    }
    async stop() {
        if (!this.isStarted)
            return;
        // Save current state
        await this.context.storageService.set('currentModel', this.currentModel);
        await this.context.storageService.set('modelPerformance', Array.from(this.modelPerformance.entries()));
        this.isStarted = false;
        this.context.logger.info('AI Model Manager stopped');
    }
    async destroy() {
        await this.stop();
        this.modelPerformance.clear();
        this.modelSwitchHistory = [];
        this.context.logger.info('AI Model Manager destroyed');
    }
    async configure(settings) {
        if (settings.preferredModel && this.isModelAvailable(settings.preferredModel)) {
            await this.switchToModel(settings.preferredModel);
        }
        if (settings.fallbackModel) {
            await this.context.storageService.set('fallbackModel', settings.fallbackModel);
        }
    }
    async getMetrics() {
        return {
            currentModel: this.currentModel,
            availableModels: this.availableModels.length,
            modelPerformance: Object.fromEntries(this.modelPerformance),
            switchHistory: this.modelSwitchHistory.slice(-10), // Last 10 switches
            uptime: this.isStarted ? Date.now() - this.context.startTime : 0
        };
    }
    // Public API methods
    getCurrentModel() {
        return this.currentModel;
    }
    getAvailableModels() {
        return [...this.availableModels];
    }
    async switchToModel(modelId, reason) {
        if (!this.isModelAvailable(modelId)) {
            throw new Error(`Model ${modelId} is not available`);
        }
        const previousModel = this.currentModel;
        this.currentModel = modelId;
        // Record the switch
        const switchEvent = {
            timestamp: new Date(),
            fromModel: previousModel,
            toModel: modelId,
            reason: reason || 'user_preference',
            success: true
        };
        this.modelSwitchHistory.push(switchEvent);
        // Emit event
        await this.context.eventBus.emit({
            type: ChatGPTPluginEvents.AI_MODEL_SWITCHED,
            source: 'ai-model-manager',
            data: {
                previousModel,
                currentModel: modelId,
                reason
            },
            timestamp: new Date().toISOString()
        });
        await this.context.storageService.set('currentModel', modelId);
        this.context.logger.info(`Switched from ${previousModel} to ${modelId}`);
    }
    async recommendOptimalModel(context) {
        const recommendations = [];
        for (const model of this.availableModels) {
            const performance = this.modelPerformance.get(model.id);
            let score = model.baseScore || 0.7;
            // Adjust score based on context
            if (context.taskType === 'code_generation' && model.capabilities.includes('code_generation')) {
                score += 0.2;
            }
            if (context.taskType === 'analysis' && model.capabilities.includes('analysis')) {
                score += 0.15;
            }
            if (context.complexityLevel === 'high' && model.tier === 'premium') {
                score += 0.1;
            }
            // Adjust based on performance history
            if (performance) {
                score += (performance.averageResponseTime < 5000 ? 0.1 : -0.1);
                score += (performance.successRate > 0.9 ? 0.1 : -0.05);
                score += (performance.userSatisfaction > 0.8 ? 0.05 : -0.05);
            }
            // Consider cost if specified
            if (context.costPreference === 'low' && model.costTier === 'low') {
                score += 0.1;
            }
            else if (context.costPreference === 'high' && model.costTier === 'high') {
                score += 0.05;
            }
            recommendations.push({
                modelId: model.id,
                confidence: Math.min(1.0, Math.max(0.1, score)),
                reasoning: this.generateRecommendationReasoning(model, context, score),
                estimatedPerformance: this.estimateModelPerformance(model, context)
            });
        }
        // Sort by confidence and return the best
        recommendations.sort((a, b) => b.confidence - a.confidence);
        return recommendations[0];
    }
    async recordModelPerformance(data) {
        const existing = this.modelPerformance.get(data.modelId) || {
            modelId: data.modelId,
            totalRequests: 0,
            successfulRequests: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            successRate: 0,
            totalCost: 0,
            averageCost: 0,
            userSatisfaction: 0,
            lastUpdated: new Date()
        };
        // Update metrics
        existing.totalRequests++;
        if (data.success)
            existing.successfulRequests++;
        existing.totalResponseTime += data.responseTime;
        existing.averageResponseTime = existing.totalResponseTime / existing.totalRequests;
        existing.successRate = existing.successfulRequests / existing.totalRequests;
        existing.totalCost += data.cost || 0;
        existing.averageCost = existing.totalCost / existing.totalRequests;
        // Update user satisfaction (weighted average)
        if (data.userSatisfaction !== undefined) {
            existing.userSatisfaction = (existing.userSatisfaction * 0.8) + (data.userSatisfaction * 0.2);
        }
        existing.lastUpdated = new Date();
        this.modelPerformance.set(data.modelId, existing);
        // Persist to storage periodically
        if (existing.totalRequests % 10 === 0) {
            await this.context.storageService.set('modelPerformance', Array.from(this.modelPerformance.entries()));
        }
    }
    // Private helper methods
    initializeAvailableModels() {
        this.availableModels = [
            {
                id: 'gpt-4',
                name: 'GPT-4',
                provider: 'openai',
                tier: 'premium',
                costTier: 'high',
                capabilities: ['text_generation', 'code_generation', 'analysis', 'reasoning'],
                maxTokens: 8192,
                baseScore: 0.9,
                description: 'Most capable model for complex tasks'
            },
            {
                id: 'gpt-4-turbo',
                name: 'GPT-4 Turbo',
                provider: 'openai',
                tier: 'premium',
                costTier: 'medium',
                capabilities: ['text_generation', 'code_generation', 'analysis', 'reasoning', 'vision'],
                maxTokens: 128000,
                baseScore: 0.85,
                description: 'Fast and efficient GPT-4 variant'
            },
            {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                provider: 'openai',
                tier: 'standard',
                costTier: 'low',
                capabilities: ['text_generation', 'basic_analysis', 'conversation'],
                maxTokens: 4096,
                baseScore: 0.7,
                description: 'Balanced performance and cost'
            },
            {
                id: 'claude-3-opus',
                name: 'Claude 3 Opus',
                provider: 'anthropic',
                tier: 'premium',
                costTier: 'high',
                capabilities: ['text_generation', 'analysis', 'reasoning', 'safety'],
                maxTokens: 200000,
                baseScore: 0.88,
                description: 'Excellent for complex analysis and safety'
            },
            {
                id: 'claude-3-sonnet',
                name: 'Claude 3 Sonnet',
                provider: 'anthropic',
                tier: 'standard',
                costTier: 'medium',
                capabilities: ['text_generation', 'analysis', 'reasoning'],
                maxTokens: 200000,
                baseScore: 0.75,
                description: 'Balanced Claude model for most tasks'
            }
        ];
    }
    isModelAvailable(modelId) {
        return this.availableModels.some(model => model.id === modelId);
    }
    async handleModelSwitched(event) {
        // Handle model switch events for analytics and optimization
        this.context.logger.debug('Model switch event received', event.data);
    }
    generateRecommendationReasoning(model, context, score) {
        const reasons = [];
        if (model.capabilities.includes(context.taskType)) {
            reasons.push(`Optimized for ${context.taskType}`);
        }
        if (context.complexityLevel === 'high' && model.tier === 'premium') {
            reasons.push('Premium model suitable for complex tasks');
        }
        if (context.costPreference === 'low' && model.costTier === 'low') {
            reasons.push('Cost-effective option');
        }
        const performance = this.modelPerformance.get(model.id);
        if (performance?.successRate > 0.9) {
            reasons.push('High success rate in previous tasks');
        }
        return reasons.join('; ');
    }
    estimateModelPerformance(model, context) {
        const historical = this.modelPerformance.get(model.id);
        return {
            responseTime: historical?.averageResponseTime || this.getBaselineResponseTime(model),
            successRate: historical?.successRate || 0.85,
            cost: historical?.averageCost || this.getBaselineCost(model),
            quality: this.estimateQuality(model, context)
        };
    }
    getBaselineResponseTime(model) {
        const baselines = {
            'gpt-4': 8000,
            'gpt-4-turbo': 4000,
            'gpt-3.5-turbo': 2000,
            'claude-3-opus': 6000,
            'claude-3-sonnet': 3000
        };
        return baselines[model.id] || 5000;
    }
    getBaselineCost(model) {
        const baselines = {
            'gpt-4': 0.06,
            'gpt-4-turbo': 0.03,
            'gpt-3.5-turbo': 0.002,
            'claude-3-opus': 0.075,
            'claude-3-sonnet': 0.015
        };
        return baselines[model.id] || 0.01;
    }
    estimateQuality(model, context) {
        let quality = model.baseScore || 0.7;
        if (model.capabilities.includes(context.taskType)) {
            quality += 0.1;
        }
        if (context.complexityLevel === 'high' && model.tier === 'premium') {
            quality += 0.05;
        }
        return Math.min(1.0, quality);
    }
}
/**
 * Training Manager - Handles automation pattern training and learning
 */
class TrainingManager {
    constructor(context) {
        this.context = context;
        this.isStarted = false;
        this.trainingMode = false;
        this.activeSessions = new Map();
        this.learnedPatterns = new Map();
        this.trainingHistory = [];
        this.confidence = 0.8;
    }
    async start() {
        if (this.isStarted)
            return;
        this.context.logger.info('Starting Training Manager');
        // Load existing patterns
        const patterns = await this.context.storageService.get('learnedPatterns');
        if (patterns) {
            this.learnedPatterns = new Map(patterns);
        }
        // Load training history
        const history = await this.context.storageService.get('trainingHistory');
        if (history) {
            this.trainingHistory = history;
        }
        // Set up event listeners
        this.context.eventBus.on(ChatGPTPluginEvents.TRAINING_MODE_ENABLED, (event) => {
            this.handleTrainingModeEnabled(event);
        });
        this.context.eventBus.on(ChatGPTPluginEvents.TRAINING_PATTERN_LEARNED, (event) => {
            this.handlePatternLearned(event);
        });
        this.isStarted = true;
        this.context.logger.info('Training Manager started successfully');
    }
    async stop() {
        if (!this.isStarted)
            return;
        // Save current state
        await this.context.storageService.set('learnedPatterns', Array.from(this.learnedPatterns.entries()));
        await this.context.storageService.set('trainingHistory', this.trainingHistory);
        // End all active sessions
        for (const session of this.activeSessions.values()) {
            await this.endTrainingSession(session.id, 'manager_stopped');
        }
        this.isStarted = false;
        this.context.logger.info('Training Manager stopped');
    }
    async destroy() {
        await this.stop();
        this.activeSessions.clear();
        this.learnedPatterns.clear();
        this.trainingHistory = [];
        this.context.logger.info('Training Manager destroyed');
    }
    async configure(settings) {
        if (settings.enableTrainingMode !== undefined) {
            this.trainingMode = settings.enableTrainingMode;
        }
        if (settings.trainingConfidenceThreshold !== undefined) {
            this.confidence = settings.trainingConfidenceThreshold;
        }
        if (settings.autoLearnPatterns !== undefined) {
            await this.context.storageService.set('autoLearnPatterns', settings.autoLearnPatterns);
        }
    }
    async getMetrics() {
        return {
            trainingMode: this.trainingMode,
            activeSessions: this.activeSessions.size,
            learnedPatterns: this.learnedPatterns.size,
            trainingHistory: this.trainingHistory.length,
            confidenceThreshold: this.confidence,
            recentActivity: this.trainingHistory.slice(-10)
        };
    }
    // Public API methods
    async enableTrainingMode() {
        this.trainingMode = true;
        await this.context.eventBus.emit({
            type: ChatGPTPluginEvents.TRAINING_MODE_ENABLED,
            source: 'training-manager',
            data: { enabled: true },
            timestamp: new Date().toISOString()
        });
        this.context.logger.info('Training mode enabled');
    }
    async disableTrainingMode() {
        this.trainingMode = false;
        // End all active sessions
        for (const session of this.activeSessions.values()) {
            await this.endTrainingSession(session.id, 'training_disabled');
        }
        this.context.logger.info('Training mode disabled');
    }
    async startTrainingSession(request) {
        if (!this.trainingMode) {
            throw new Error('Training mode is not enabled');
        }
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            startTime: new Date(),
            request,
            status: 'active',
            steps: [],
            patterns: [],
            confidence: 0
        };
        this.activeSessions.set(sessionId, session);
        this.context.logger.info(`Started training session: ${sessionId}`);
        return sessionId;
    }
    async addTrainingStep(sessionId, step) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Training session ${sessionId} not found`);
        }
        session.steps.push(step);
        // Analyze patterns after each step
        await this.analyzeStepForPatterns(session, step);
        this.context.logger.debug(`Added training step to session ${sessionId}`, step);
    }
    async endTrainingSession(sessionId, reason) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Training session ${sessionId} not found`);
        }
        session.endTime = new Date();
        session.status = 'completed';
        // Generate final patterns
        const finalPatterns = await this.generatePatternsFromSession(session);
        // Store learned patterns
        for (const pattern of finalPatterns) {
            if (pattern.confidence >= this.confidence) {
                await this.storeLearnedPattern(pattern);
            }
        }
        // Create training record
        const record = {
            sessionId,
            startTime: session.startTime,
            endTime: session.endTime,
            request: session.request,
            stepsCount: session.steps.length,
            patternsLearned: finalPatterns.length,
            success: finalPatterns.length > 0,
            reason
        };
        this.trainingHistory.push(record);
        this.activeSessions.delete(sessionId);
        // Emit completion event
        await this.context.eventBus.emit({
            type: ChatGPTPluginEvents.TRAINING_SESSION_COMPLETED,
            source: 'training-manager',
            data: {
                sessionId,
                patternsLearned: finalPatterns.length,
                success: record.success
            },
            timestamp: new Date().toISOString()
        });
        const result = {
            sessionId,
            success: record.success,
            patternsLearned: finalPatterns,
            executionTime: session.endTime.getTime() - session.startTime.getTime(),
            reason
        };
        this.context.logger.info(`Training session ${sessionId} completed: ${finalPatterns.length} patterns learned`);
        return result;
    }
    async getLearnedPatterns() {
        return Array.from(this.learnedPatterns.values());
    }
    async findMatchingPattern(request) {
        for (const pattern of this.learnedPatterns.values()) {
            const similarity = await this.calculatePatternSimilarity(request, pattern);
            if (similarity >= this.confidence) {
                pattern.usageCount++;
                pattern.lastUsed = new Date();
                return pattern;
            }
        }
        return null;
    }
    async validatePattern(patternId) {
        const pattern = this.learnedPatterns.get(patternId);
        if (!pattern) {
            return { valid: false, issues: ['Pattern not found'] };
        }
        const issues = [];
        // Check age
        const ageInDays = (Date.now() - pattern.learnedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays > 30) {
            issues.push('Pattern is older than 30 days');
        }
        // Check success rate
        const successRate = pattern.successCount / Math.max(pattern.usageCount, 1);
        if (successRate < 0.8) {
            issues.push('Pattern has low success rate');
        }
        // Check context relevance
        if (pattern.context.domain !== window.location.hostname) {
            issues.push('Pattern learned on different domain');
        }
        return {
            valid: issues.length === 0,
            issues,
            confidence: pattern.confidence,
            recommendations: this.generatePatternRecommendations(pattern, issues)
        };
    }
    async improvePattern(patternId, feedback) {
        const pattern = this.learnedPatterns.get(patternId);
        if (!pattern) {
            throw new Error(`Pattern ${patternId} not found`);
        }
        // Update pattern based on feedback
        if (feedback.success) {
            pattern.successCount++;
            pattern.confidence = Math.min(1.0, pattern.confidence + 0.05);
        }
        else {
            pattern.confidence = Math.max(0.1, pattern.confidence - 0.1);
            pattern.failures.push({
                timestamp: new Date(),
                reason: feedback.reason || 'Unknown failure',
                context: feedback.context
            });
        }
        pattern.lastUsed = new Date();
        // Emit pattern learned event if significant improvement
        if (feedback.success && pattern.confidence > 0.9) {
            await this.context.eventBus.emit({
                type: ChatGPTPluginEvents.TRAINING_PATTERN_LEARNED,
                source: 'training-manager',
                data: {
                    patternId,
                    confidence: pattern.confidence,
                    improvement: true
                },
                timestamp: new Date().toISOString()
            });
        }
        this.context.logger.debug(`Pattern ${patternId} updated with feedback`, feedback);
    }
    // Private helper methods
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    async analyzeStepForPatterns(session, step) {
        // Basic pattern analysis - look for repeated actions
        const similarSteps = session.steps.filter(s => s.action === step.action && s.selector === step.selector);
        if (similarSteps.length >= 2) {
            // Potential pattern detected
            const pattern = {
                id: this.generatePatternId(),
                type: 'automation',
                action: step.action,
                selector: step.selector,
                parameters: step.parameters,
                context: {
                    domain: window.location.hostname,
                    url: window.location.href,
                    timestamp: new Date()
                },
                confidence: 0.6 + (similarSteps.length * 0.1),
                learnedAt: new Date(),
                usageCount: 0,
                successCount: 0,
                lastUsed: new Date(),
                failures: []
            };
            session.patterns.push(pattern);
        }
    }
    async generatePatternsFromSession(session) {
        const patterns = [];
        // Group steps by action type
        const actionGroups = new Map();
        for (const step of session.steps) {
            const key = `${step.action}-${step.selector}`;
            if (!actionGroups.has(key)) {
                actionGroups.set(key, []);
            }
            actionGroups.get(key).push(step);
        }
        // Generate patterns from groups with multiple occurrences
        for (const [key, steps] of actionGroups) {
            if (steps.length >= 2) {
                const pattern = {
                    id: this.generatePatternId(),
                    type: 'automation',
                    action: steps[0].action,
                    selector: steps[0].selector,
                    parameters: this.mergeParameters(steps.map(s => s.parameters)),
                    context: {
                        domain: window.location.hostname,
                        url: window.location.href,
                        timestamp: new Date()
                    },
                    confidence: Math.min(0.9, 0.5 + (steps.length * 0.1)),
                    learnedAt: new Date(),
                    usageCount: 0,
                    successCount: 0,
                    lastUsed: new Date(),
                    failures: []
                };
                patterns.push(pattern);
            }
        }
        return patterns;
    }
    async storeLearnedPattern(pattern) {
        this.learnedPatterns.set(pattern.id, pattern);
        await this.context.eventBus.emit({
            type: ChatGPTPluginEvents.TRAINING_PATTERN_LEARNED,
            source: 'training-manager',
            data: {
                patternId: pattern.id,
                confidence: pattern.confidence,
                action: pattern.action
            },
            timestamp: new Date().toISOString()
        });
    }
    async calculatePatternSimilarity(request, pattern) {
        let similarity = 0;
        // Action similarity
        if (request.action === pattern.action) {
            similarity += 0.4;
        }
        // Selector similarity (basic string matching)
        if (request.selector === pattern.selector) {
            similarity += 0.3;
        }
        else if (request.selector && pattern.selector) {
            const selectorSimilarity = this.calculateStringSimilarity(request.selector, pattern.selector);
            similarity += selectorSimilarity * 0.3;
        }
        // Context similarity
        if (request.domain === pattern.context.domain) {
            similarity += 0.2;
        }
        // Parameter similarity
        const paramSimilarity = this.calculateParameterSimilarity(request.parameters, pattern.parameters);
        similarity += paramSimilarity * 0.1;
        return similarity;
    }
    calculateStringSimilarity(str1, str2) {
        if (str1 === str2)
            return 1.0;
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1.0;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++)
            matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++)
            matrix[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + cost);
            }
        }
        return matrix[str2.length][str1.length];
    }
    calculateParameterSimilarity(params1, params2) {
        if (!params1 && !params2)
            return 1.0;
        if (!params1 || !params2)
            return 0.0;
        const keys1 = Object.keys(params1);
        const keys2 = Object.keys(params2);
        const allKeys = new Set([...keys1, ...keys2]);
        let matches = 0;
        for (const key of allKeys) {
            if (params1[key] === params2[key]) {
                matches++;
            }
        }
        return matches / allKeys.size;
    }
    mergeParameters(paramsList) {
        const merged = {};
        for (const params of paramsList) {
            if (params) {
                Object.assign(merged, params);
            }
        }
        return merged;
    }
    generatePatternId() {
        return `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    generatePatternRecommendations(pattern, issues) {
        const recommendations = [];
        if (issues.includes('Pattern is older than 30 days')) {
            recommendations.push('Consider retraining this pattern with current page structure');
        }
        if (issues.includes('Pattern has low success rate')) {
            recommendations.push('Review and update pattern selectors');
        }
        if (issues.includes('Pattern learned on different domain')) {
            recommendations.push('Verify pattern compatibility with current domain');
        }
        return recommendations;
    }
    async handleTrainingModeEnabled(event) {
        this.context.logger.debug('Training mode enabled event received', event.data);
    }
    async handlePatternLearned(event) {
        this.context.logger.debug('Pattern learned event received', event.data);
    }
}
/**
 * Automation Engine - Executes web automation tasks and manages contracts
 */
class AutomationEngine {
    constructor(context) {
        this.context = context;
        this.isStarted = false;
        this.activeExecutions = new Map();
        this.executionHistory = [];
        this.contractCache = new Map();
        this.settings = {
            maxConcurrentExecutions: 5,
            defaultTimeout: 30000,
            retryAttempts: 3,
            enableSafetyChecks: true
        };
    }
    async start() {
        if (this.isStarted)
            return;
        this.context.logger.info('Starting Automation Engine');
        // Load execution history
        const history = await this.context.storageService.get('executionHistory');
        if (history) {
            this.executionHistory = history;
        }
        // Cache available contracts
        await this.cacheContracts();
        // Set up event listeners
        this.context.eventBus.on(ChatGPTPluginEvents.CHATGPT_MESSAGE_SENT, (event) => {
            this.handleMessageSent(event);
        });
        this.context.eventBus.on(ChatGPTPluginEvents.CHATGPT_RESPONSE_EXTRACTED, (event) => {
            this.handleResponseExtracted(event);
        });
        this.isStarted = true;
        this.context.logger.info('Automation Engine started successfully');
    }
    async stop() {
        if (!this.isStarted)
            return;
        // Cancel all active executions
        for (const execution of this.activeExecutions.values()) {
            await this.cancelExecution(execution.id, 'engine_stopped');
        }
        // Save execution history
        await this.context.storageService.set('executionHistory', this.executionHistory);
        this.isStarted = false;
        this.context.logger.info('Automation Engine stopped');
    }
    async destroy() {
        await this.stop();
        this.activeExecutions.clear();
        this.executionHistory = [];
        this.contractCache.clear();
        this.context.logger.info('Automation Engine destroyed');
    }
    async configure(settings) {
        if (settings.maxConcurrentExecutions !== undefined) {
            this.settings.maxConcurrentExecutions = settings.maxConcurrentExecutions;
        }
        if (settings.defaultTimeout !== undefined) {
            this.settings.defaultTimeout = settings.defaultTimeout;
        }
        if (settings.retryAttempts !== undefined) {
            this.settings.retryAttempts = settings.retryAttempts;
        }
        if (settings.enableSafetyChecks !== undefined) {
            this.settings.enableSafetyChecks = settings.enableSafetyChecks;
        }
    }
    async getMetrics() {
        const recentExecutions = this.executionHistory.slice(-100);
        const successfulExecutions = recentExecutions.filter(e => e.success);
        return {
            activeExecutions: this.activeExecutions.size,
            totalExecutions: this.executionHistory.length,
            successRate: recentExecutions.length > 0 ? successfulExecutions.length / recentExecutions.length : 0,
            averageExecutionTime: this.calculateAverageExecutionTime(recentExecutions),
            cachedContracts: this.contractCache.size,
            settings: this.settings,
            recentErrors: recentExecutions.filter(e => !e.success).slice(-5)
        };
    }
    // Public API methods
    async executeAutomation(request) {
        if (this.activeExecutions.size >= this.settings.maxConcurrentExecutions) {
            throw new Error('Maximum concurrent executions reached');
        }
        const executionId = this.generateExecutionId();
        const execution = {
            id: executionId,
            request,
            startTime: new Date(),
            status: 'running',
            steps: [],
            retryCount: 0
        };
        this.activeExecutions.set(executionId, execution);
        this.context.logger.info(`Starting automation execution: ${executionId}`);
        try {
            const result = await this.runAutomation(execution);
            execution.endTime = new Date();
            execution.status = 'completed';
            execution.result = result;
            this.recordExecution(execution, true);
            this.activeExecutions.delete(executionId);
            return result;
        }
        catch (error) {
            execution.endTime = new Date();
            execution.status = 'failed';
            execution.error = error;
            this.recordExecution(execution, false);
            this.activeExecutions.delete(executionId);
            throw error;
        }
    }
    async executeContract(contractId, capability, parameters) {
        const contract = this.contractCache.get(contractId);
        if (!contract) {
            throw new Error(`Contract ${contractId} not found`);
        }
        const contractCapability = contract.capabilities[capability];
        if (!contractCapability) {
            throw new Error(`Capability ${capability} not found in contract ${contractId}`);
        }
        // Validate parameters
        const validation = await this.validateParameters(contractCapability, parameters);
        if (!validation.valid) {
            throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
        }
        // Execute the capability
        return await this.executeCapability(contract, contractCapability, parameters);
    }
    async sendMessage(message, options) {
        const contract = await this.findBestContract('sendMessage');
        if (!contract) {
            throw new Error('No suitable contract found for sending messages');
        }
        const capability = contract.capabilities.sendMessage;
        const parameters = { message, ...options };
        return await this.executeCapability(contract, capability, parameters);
    }
    async extractResponse(options) {
        const contract = await this.findBestContract('getResponse');
        if (!contract) {
            throw new Error('No suitable contract found for extracting responses');
        }
        const capability = contract.capabilities.getResponse;
        const result = await this.executeCapability(contract, capability, options || {});
        return typeof result === 'string' ? result : result.content || '';
    }
    async startNewConversation() {
        const contract = await this.findBestContract('startNewConversation');
        if (!contract) {
            throw new Error('No suitable contract found for starting conversations');
        }
        const capability = contract.capabilities.startNewConversation;
        await this.executeCapability(contract, capability, {});
        // Emit event
        await this.context.eventBus.emit({
            type: ChatGPTPluginEvents.CONVERSATION_STARTED,
            source: 'automation-engine',
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString()
        });
    }
    async selectModel(modelId) {
        const contract = await this.findBestContract('selectModel');
        if (!contract) {
            throw new Error('No suitable contract found for model selection');
        }
        const capability = contract.capabilities.selectModel;
        await this.executeCapability(contract, capability, { model: modelId });
    }
    async getExecutionHistory() {
        return [...this.executionHistory];
    }
    async cancelExecution(executionId, reason) {
        const execution = this.activeExecutions.get(executionId);
        if (!execution) {
            throw new Error(`Execution ${executionId} not found`);
        }
        execution.status = 'cancelled';
        execution.endTime = new Date();
        execution.error = new Error(`Cancelled: ${reason}`);
        this.recordExecution(execution, false);
        this.activeExecutions.delete(executionId);
        this.context.logger.info(`Cancelled execution ${executionId}: ${reason}`);
    }
    // Private implementation methods
    async runAutomation(execution) {
        const { request } = execution;
        // Safety checks
        if (this.settings.enableSafetyChecks) {
            await this.performSafetyChecks(request);
        }
        // Execute steps
        const results = [];
        for (const step of request.steps) {
            try {
                const stepResult = await this.executeStep(step, execution);
                results.push(stepResult);
                execution.steps.push({
                    step,
                    result: stepResult,
                    timestamp: new Date()
                });
                // Check for timeout
                const elapsed = Date.now() - execution.startTime.getTime();
                if (elapsed > (request.timeout || this.settings.defaultTimeout)) {
                    throw new Error('Execution timeout');
                }
            }
            catch (error) {
                if (execution.retryCount < this.settings.retryAttempts) {
                    execution.retryCount++;
                    this.context.logger.warn(`Step failed, retrying (${execution.retryCount}/${this.settings.retryAttempts})`, error);
                    // Retry the step
                    continue;
                }
                throw error;
            }
        }
        return {
            executionId: execution.id,
            success: true,
            results,
            executionTime: Date.now() - execution.startTime.getTime(),
            stepsCompleted: results.length
        };
    }
    async executeStep(step, execution) {
        switch (step.type) {
            case 'click':
                return await this.executeClick(step);
            case 'type':
                return await this.executeType(step);
            case 'wait':
                return await this.executeWait(step);
            case 'extract':
                return await this.executeExtract(step);
            case 'navigate':
                return await this.executeNavigate(step);
            default:
                throw new Error(`Unknown step type: ${step.type}`);
        }
    }
    async executeClick(step) {
        const element = document.querySelector(step.selector);
        if (!element) {
            throw new Error(`Element not found: ${step.selector}`);
        }
        // Simulate click
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(clickEvent);
        return {
            type: 'click',
            success: true,
            selector: step.selector,
            timestamp: new Date()
        };
    }
    async executeType(step) {
        const element = document.querySelector(step.selector);
        if (!element) {
            throw new Error(`Element not found: ${step.selector}`);
        }
        if (step.parameters?.text) {
            element.value = step.parameters.text;
            // Trigger input events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return {
            type: 'type',
            success: true,
            selector: step.selector,
            value: step.parameters?.text,
            timestamp: new Date()
        };
    }
    async executeWait(step) {
        const waitTime = step.parameters?.duration || 1000;
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    type: 'wait',
                    success: true,
                    duration: waitTime,
                    timestamp: new Date()
                });
            }, waitTime);
        });
    }
    async executeExtract(step) {
        const element = document.querySelector(step.selector);
        if (!element) {
            throw new Error(`Element not found: ${step.selector}`);
        }
        const extractedText = element.textContent || element.getAttribute('value') || '';
        return {
            type: 'extract',
            success: true,
            selector: step.selector,
            extractedData: extractedText,
            timestamp: new Date()
        };
    }
    async executeNavigate(step) {
        if (step.parameters?.url) {
            window.location.href = step.parameters.url;
        }
        return {
            type: 'navigate',
            success: true,
            url: step.parameters?.url,
            timestamp: new Date()
        };
    }
    async executeCapability(contract, capability, parameters) {
        switch (capability.type) {
            case 'action':
                return await this.executeAction(capability, parameters);
            case 'query':
                return await this.executeQuery(capability, parameters);
            case 'form':
                return await this.executeForm(capability, parameters);
            case 'navigation':
                return await this.executeNavigation(capability, parameters);
            default:
                throw new Error(`Unknown capability type: ${capability.type}`);
        }
    }
    async executeAction(capability, parameters) {
        const element = document.querySelector(capability.selector);
        if (!element) {
            throw new Error(`Element not found: ${capability.selector}`);
        }
        // Perform action based on element type
        if (element.tagName.toLowerCase() === 'button' || element.tagName.toLowerCase() === 'a') {
            element.click();
        }
        else if (element.tagName.toLowerCase() === 'input') {
            const input = element;
            if (parameters.value !== undefined) {
                input.value = parameters.value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            else {
                input.click();
            }
        }
        return { success: true, action: 'executed' };
    }
    async executeQuery(capability, parameters) {
        const element = document.querySelector(capability.selector);
        if (!element) {
            throw new Error(`Element not found: ${capability.selector}`);
        }
        return {
            content: element.textContent,
            html: element.innerHTML,
            attributes: this.getElementAttributes(element)
        };
    }
    async executeForm(capability, parameters) {
        const form = document.querySelector(capability.selector);
        if (!form) {
            throw new Error(`Form not found: ${capability.selector}`);
        }
        // Fill form fields
        for (const [fieldName, value] of Object.entries(parameters)) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.value = value;
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        return { success: true, action: 'form_filled' };
    }
    async executeNavigation(capability, parameters) {
        if (parameters.url) {
            window.location.href = parameters.url;
        }
        else {
            const element = document.querySelector(capability.selector);
            if (element) {
                element.click();
            }
        }
        return { success: true, action: 'navigation' };
    }
    async validateParameters(capability, parameters) {
        const errors = [];
        if (capability.parameters) {
            for (const param of capability.parameters) {
                if (param.required && parameters[param.name] === undefined) {
                    errors.push(`Required parameter '${param.name}' is missing`);
                }
                if (parameters[param.name] !== undefined) {
                    // Type validation
                    const value = parameters[param.name];
                    if (param.type === 'string' && typeof value !== 'string') {
                        errors.push(`Parameter '${param.name}' must be a string`);
                    }
                    else if (param.type === 'number' && typeof value !== 'number') {
                        errors.push(`Parameter '${param.name}' must be a number`);
                    }
                    else if (param.type === 'boolean' && typeof value !== 'boolean') {
                        errors.push(`Parameter '${param.name}' must be a boolean`);
                    }
                    // Validation rules
                    if (param.validation) {
                        if (param.validation.pattern && typeof value === 'string') {
                            const regex = new RegExp(param.validation.pattern);
                            if (!regex.test(value)) {
                                errors.push(`Parameter '${param.name}' does not match required pattern`);
                            }
                        }
                        if (param.validation.enum && !param.validation.enum.includes(value)) {
                            errors.push(`Parameter '${param.name}' must be one of: ${param.validation.enum.join(', ')}`);
                        }
                    }
                }
            }
        }
        return { valid: errors.length === 0, errors };
    }
    async findBestContract(capability) {
        const currentDomain = window.location.hostname;
        for (const contract of this.contractCache.values()) {
            if (contract.domain === currentDomain && contract.capabilities[capability]) {
                return contract;
            }
        }
        // Fallback to any contract with the capability
        for (const contract of this.contractCache.values()) {
            if (contract.capabilities[capability]) {
                return contract;
            }
        }
        return null;
    }
    async cacheContracts() {
        const contracts = await this.context.contractRegistry.getAll();
        for (const contract of contracts) {
            this.contractCache.set(contract.domain + ':' + contract.title, contract);
        }
    }
    async performSafetyChecks(request) {
        // Check for dangerous actions
        for (const step of request.steps) {
            if (step.type === 'navigate' && step.parameters?.url) {
                const url = step.parameters.url;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    throw new Error(`Unsafe URL: ${url}`);
                }
            }
            if (step.selector && step.selector.includes('script')) {
                throw new Error('Potentially unsafe selector');
            }
        }
    }
    recordExecution(execution, success) {
        const record = {
            id: execution.id,
            startTime: execution.startTime,
            endTime: execution.endTime,
            request: execution.request,
            success,
            stepsCompleted: execution.steps.length,
            retryCount: execution.retryCount,
            error: execution.error?.message
        };
        this.executionHistory.push(record);
        // Keep only last 1000 records
        if (this.executionHistory.length > 1000) {
            this.executionHistory = this.executionHistory.slice(-1000);
        }
    }
    calculateAverageExecutionTime(executions) {
        if (executions.length === 0)
            return 0;
        const totalTime = executions.reduce((sum, exec) => {
            return sum + (exec.endTime.getTime() - exec.startTime.getTime());
        }, 0);
        return totalTime / executions.length;
    }
    generateExecutionId() {
        return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    getElementAttributes(element) {
        const attrs = {};
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }
    async handleMessageSent(event) {
        this.context.logger.debug('Message sent event received', event.data);
    }
    async handleResponseExtracted(event) {
        this.context.logger.debug('Response extracted event received', event.data);
    }
}
/**
 * Performance Tracker - Monitors and analyzes plugin performance metrics
 */
class PerformanceTracker {
    constructor(context) {
        this.context = context;
        this.isStarted = false;
        this.metrics = {
            responseTime: { current: 0, previous: 0, change: 0, trend: 'stable' },
            accuracy: { current: 0, previous: 0, change: 0, trend: 'stable' },
            userSatisfaction: { current: 0, previous: 0, change: 0, trend: 'stable' },
            costEfficiency: { current: 0, previous: 0, change: 0, trend: 'stable' },
            errorRate: { current: 0, previous: 0, change: 0, trend: 'stable' },
            throughput: { current: 0, previous: 0, change: 0, trend: 'stable' }
        };
        this.dataPoints = [];
        this.alerts = [];
        this.thresholds = {
            maxResponseTime: 10000,
            minAccuracy: 0.8,
            minUserSatisfaction: 0.7,
            maxErrorRate: 0.05,
            minThroughput: 1.0
        };
    }
    async start() {
        if (this.isStarted)
            return;
        this.context.logger.info('Starting Performance Tracker');
        // Load historical data
        const historicalData = await this.context.storageService.get('performanceData');
        if (historicalData) {
            this.dataPoints = historicalData;
            this.calculateCurrentMetrics();
        }
        // Load alerts
        const savedAlerts = await this.context.storageService.get('performanceAlerts');
        if (savedAlerts) {
            this.alerts = savedAlerts;
        }
        // Start monitoring
        this.startMonitoring();
        // Set up event listeners
        this.context.eventBus.on(ChatGPTPluginEvents.AI_RESPONSE_RECEIVED, (event) => {
            this.handleResponseReceived(event);
        });
        this.context.eventBus.on(ChatGPTPluginEvents.AI_PERFORMANCE_UPDATED, (event) => {
            this.handlePerformanceUpdated(event);
        });
        this.isStarted = true;
        this.context.logger.info('Performance Tracker started successfully');
    }
    async stop() {
        if (!this.isStarted)
            return;
        // Stop monitoring
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        // Save data
        await this.context.storageService.set('performanceData', this.dataPoints);
        await this.context.storageService.set('performanceAlerts', this.alerts);
        this.isStarted = false;
        this.context.logger.info('Performance Tracker stopped');
    }
    async destroy() {
        await this.stop();
        this.dataPoints = [];
        this.alerts = [];
        this.context.logger.info('Performance Tracker destroyed');
    }
    async configure(settings) {
        if (settings.maxResponseTime !== undefined) {
            this.thresholds.maxResponseTime = settings.maxResponseTime;
        }
        if (settings.minAccuracy !== undefined) {
            this.thresholds.minAccuracy = settings.minAccuracy;
        }
        if (settings.minUserSatisfaction !== undefined) {
            this.thresholds.minUserSatisfaction = settings.minUserSatisfaction;
        }
        if (settings.maxErrorRate !== undefined) {
            this.thresholds.maxErrorRate = settings.maxErrorRate;
        }
        if (settings.monitoringInterval !== undefined) {
            this.restartMonitoring(settings.monitoringInterval);
        }
    }
    async getMetrics() {
        return {
            current: this.metrics,
            dataPointsCount: this.dataPoints.length,
            activeAlerts: this.alerts.filter(a => a.status === 'active').length,
            thresholds: this.thresholds,
            trends: this.calculateTrends(),
            recommendations: this.generateRecommendations(),
            lastUpdated: this.dataPoints.length > 0 ? this.dataPoints[this.dataPoints.length - 1].timestamp : null
        };
    }
    // Public API methods
    async recordPerformanceData(data) {
        const dataPoint = {
            timestamp: new Date(),
            responseTime: data.responseTime,
            accuracy: data.accuracy,
            userSatisfaction: data.userSatisfaction,
            cost: data.cost,
            errorOccurred: data.errorOccurred || false,
            requestId: data.requestId,
            modelUsed: data.modelUsed,
            operationType: data.operationType
        };
        this.dataPoints.push(dataPoint);
        // Keep only last 10000 data points
        if (this.dataPoints.length > 10000) {
            this.dataPoints = this.dataPoints.slice(-10000);
        }
        // Update current metrics
        this.calculateCurrentMetrics();
        // Check for alerts
        await this.checkThresholds(dataPoint);
        // Emit performance updated event
        await this.context.eventBus.emit({
            type: ChatGPTPluginEvents.AI_PERFORMANCE_UPDATED,
            source: 'performance-tracker',
            data: {
                metrics: this.metrics,
                dataPoint
            },
            timestamp: new Date().toISOString()
        });
    }
    async generatePerformanceReport(timeWindow) {
        const endTime = timeWindow?.end || new Date();
        const startTime = timeWindow?.start || new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        const filteredData = this.dataPoints.filter(dp => dp.timestamp >= startTime && dp.timestamp <= endTime);
        if (filteredData.length === 0) {
            return {
                timeWindow: { start: startTime, end: endTime },
                summary: {
                    totalRequests: 0,
                    averageResponseTime: 0,
                    averageAccuracy: 0,
                    averageUserSatisfaction: 0,
                    errorRate: 0,
                    totalCost: 0
                },
                trends: [],
                alerts: [],
                recommendations: []
            };
        }
        const summary = this.calculateSummaryStats(filteredData);
        const trends = this.calculateTrendsForPeriod(filteredData);
        const periodAlerts = this.alerts.filter(a => a.timestamp >= startTime && a.timestamp <= endTime);
        return {
            timeWindow: { start: startTime, end: endTime },
            summary,
            trends,
            alerts: periodAlerts,
            recommendations: this.generateRecommendations()
        };
    }
    async getPerformanceTrends(metric, timeWindow) {
        const endTime = timeWindow?.end || new Date();
        const startTime = timeWindow?.start || new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        const filteredData = this.dataPoints.filter(dp => dp.timestamp >= startTime && dp.timestamp <= endTime);
        return this.analyzeTrend(filteredData, metric);
    }
    async getOptimizationSuggestions() {
        const suggestions = [];
        // Analyze response time
        if (this.metrics.responseTime.current > this.thresholds.maxResponseTime) {
            suggestions.push({
                type: 'performance',
                priority: 'high',
                description: 'Response time is above threshold',
                recommendation: 'Consider switching to a faster model or optimizing prompts',
                expectedImpact: 'Reduce response time by 20-40%',
                implementationEffort: 'medium'
            });
        }
        // Analyze accuracy
        if (this.metrics.accuracy.current < this.thresholds.minAccuracy) {
            suggestions.push({
                type: 'quality',
                priority: 'high',
                description: 'Accuracy is below acceptable threshold',
                recommendation: 'Switch to a more capable model or improve prompt engineering',
                expectedImpact: 'Improve accuracy by 10-25%',
                implementationEffort: 'high'
            });
        }
        // Analyze cost efficiency
        const recentCosts = this.dataPoints.slice(-100);
        const avgCost = recentCosts.reduce((sum, dp) => sum + (dp.cost || 0), 0) / recentCosts.length;
        if (avgCost > 0.1) { // Arbitrary threshold
            suggestions.push({
                type: 'cost',
                priority: 'medium',
                description: 'Average cost per request is high',
                recommendation: 'Consider using a more cost-effective model for routine tasks',
                expectedImpact: 'Reduce costs by 30-50%',
                implementationEffort: 'low'
            });
        }
        // Analyze error patterns
        const recentErrors = this.dataPoints.slice(-100).filter(dp => dp.errorOccurred);
        if (recentErrors.length > 5) {
            suggestions.push({
                type: 'reliability',
                priority: 'high',
                description: 'High error rate detected',
                recommendation: 'Review error patterns and implement better error handling',
                expectedImpact: 'Reduce error rate by 50-70%',
                implementationEffort: 'medium'
            });
        }
        return suggestions;
    }
    async clearPerformanceData() {
        this.dataPoints = [];
        this.alerts = [];
        this.metrics = {
            responseTime: { current: 0, previous: 0, change: 0, trend: 'stable' },
            accuracy: { current: 0, previous: 0, change: 0, trend: 'stable' },
            userSatisfaction: { current: 0, previous: 0, change: 0, trend: 'stable' },
            costEfficiency: { current: 0, previous: 0, change: 0, trend: 'stable' },
            errorRate: { current: 0, previous: 0, change: 0, trend: 'stable' },
            throughput: { current: 0, previous: 0, change: 0, trend: 'stable' }
        };
        await this.context.storageService.set('performanceData', []);
        await this.context.storageService.set('performanceAlerts', []);
        this.context.logger.info('Performance data cleared');
    }
    // Private helper methods
    startMonitoring() {
        this.monitoringInterval = window.setInterval(() => {
            this.collectSystemMetrics();
        }, 60000); // Every minute
    }
    restartMonitoring(interval) {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.monitoringInterval = window.setInterval(() => {
            this.collectSystemMetrics();
        }, interval);
    }
    async collectSystemMetrics() {
        // Collect browser performance metrics
        if (performance && performance.memory) {
            const memoryInfo = performance.memory;
            const systemData = {
                timestamp: new Date(),
                responseTime: 0,
                accuracy: 1,
                userSatisfaction: 0.8,
                cost: 0,
                errorOccurred: false,
                requestId: 'system-monitor',
                modelUsed: 'system',
                operationType: 'monitoring',
                systemMetrics: {
                    memoryUsage: memoryInfo.usedJSHeapSize,
                    memoryLimit: memoryInfo.totalJSHeapSize,
                    cpuTime: performance.now()
                }
            };
            this.dataPoints.push(systemData);
        }
    }
    calculateCurrentMetrics() {
        if (this.dataPoints.length === 0)
            return;
        const recent = this.dataPoints.slice(-100); // Last 100 data points
        const older = this.dataPoints.slice(-200, -100); // Previous 100 data points
        // Calculate current values
        const currentResponseTime = this.calculateAverage(recent, 'responseTime');
        const currentAccuracy = this.calculateAverage(recent, 'accuracy');
        const currentUserSatisfaction = this.calculateAverage(recent, 'userSatisfaction');
        const currentErrorRate = recent.filter(dp => dp.errorOccurred).length / recent.length;
        const currentThroughput = recent.length / (recent.length > 0 ?
            (recent[recent.length - 1].timestamp.getTime() - recent[0].timestamp.getTime()) / 60000 : 1);
        // Calculate previous values for comparison
        const previousResponseTime = older.length > 0 ? this.calculateAverage(older, 'responseTime') : currentResponseTime;
        const previousAccuracy = older.length > 0 ? this.calculateAverage(older, 'accuracy') : currentAccuracy;
        const previousUserSatisfaction = older.length > 0 ? this.calculateAverage(older, 'userSatisfaction') : currentUserSatisfaction;
        const previousErrorRate = older.length > 0 ? older.filter(dp => dp.errorOccurred).length / older.length : currentErrorRate;
        // Update metrics with trend calculation
        this.metrics.responseTime = this.createMetricValue(currentResponseTime, previousResponseTime);
        this.metrics.accuracy = this.createMetricValue(currentAccuracy, previousAccuracy);
        this.metrics.userSatisfaction = this.createMetricValue(currentUserSatisfaction, previousUserSatisfaction);
        this.metrics.errorRate = this.createMetricValue(currentErrorRate, previousErrorRate);
        this.metrics.throughput = this.createMetricValue(currentThroughput, 0);
        // Calculate cost efficiency (lower is better)
        const totalCost = recent.reduce((sum, dp) => sum + (dp.cost || 0), 0);
        const costEfficiency = totalCost > 0 ? (recent.length / totalCost) : 1;
        this.metrics.costEfficiency = this.createMetricValue(costEfficiency, 1);
    }
    createMetricValue(current, previous) {
        const change = current - previous;
        const changePercent = previous !== 0 ? change / previous : 0;
        let trend = 'stable';
        if (Math.abs(changePercent) > 0.05) { // 5% threshold
            trend = changePercent > 0 ? 'improving' : 'declining';
        }
        return { current, previous, change: changePercent, trend };
    }
    calculateAverage(dataPoints, field) {
        const values = dataPoints.map(dp => {
            const value = dp[field];
            return typeof value === 'number' ? value : 0;
        }).filter(v => v > 0);
        return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    }
    async checkThresholds(dataPoint) {
        const alerts = [];
        // Check response time
        if (dataPoint.responseTime > this.thresholds.maxResponseTime) {
            alerts.push({
                id: this.generateAlertId(),
                type: 'response_time',
                severity: 'high',
                message: `Response time ${dataPoint.responseTime}ms exceeds threshold ${this.thresholds.maxResponseTime}ms`,
                timestamp: dataPoint.timestamp,
                value: dataPoint.responseTime,
                threshold: this.thresholds.maxResponseTime,
                status: 'active'
            });
        }
        // Check accuracy
        if (dataPoint.accuracy < this.thresholds.minAccuracy) {
            alerts.push({
                id: this.generateAlertId(),
                type: 'accuracy',
                severity: 'high',
                message: `Accuracy ${dataPoint.accuracy} below threshold ${this.thresholds.minAccuracy}`,
                timestamp: dataPoint.timestamp,
                value: dataPoint.accuracy,
                threshold: this.thresholds.minAccuracy,
                status: 'active'
            });
        }
        // Add alerts
        this.alerts.push(...alerts);
        // Keep only last 1000 alerts
        if (this.alerts.length > 1000) {
            this.alerts = this.alerts.slice(-1000);
        }
    }
    calculateTrends() {
        const trends = [];
        Object.entries(this.metrics).forEach(([key, metric]) => {
            trends.push({
                metric: key,
                direction: metric.trend,
                change: metric.change,
                significance: Math.abs(metric.change) > 0.1 ? 'high' : Math.abs(metric.change) > 0.05 ? 'medium' : 'low'
            });
        });
        return trends;
    }
    generateRecommendations() {
        const recommendations = [];
        if (this.metrics.responseTime.trend === 'declining') {
            recommendations.push('Consider optimizing prompts or switching to a faster model');
        }
        if (this.metrics.accuracy.trend === 'declining') {
            recommendations.push('Review recent prompt changes or consider using a more capable model');
        }
        if (this.metrics.errorRate.current > this.thresholds.maxErrorRate) {
            recommendations.push('Investigate error patterns and improve error handling');
        }
        if (this.metrics.userSatisfaction.trend === 'declining') {
            recommendations.push('Collect user feedback to identify areas for improvement');
        }
        return recommendations;
    }
    calculateSummaryStats(dataPoints) {
        return {
            totalRequests: dataPoints.length,
            averageResponseTime: this.calculateAverage(dataPoints, 'responseTime'),
            averageAccuracy: this.calculateAverage(dataPoints, 'accuracy'),
            averageUserSatisfaction: this.calculateAverage(dataPoints, 'userSatisfaction'),
            errorRate: dataPoints.filter(dp => dp.errorOccurred).length / dataPoints.length,
            totalCost: dataPoints.reduce((sum, dp) => sum + (dp.cost || 0), 0)
        };
    }
    calculateTrendsForPeriod(dataPoints) {
        // Simple trend calculation for the period
        const midpoint = Math.floor(dataPoints.length / 2);
        const firstHalf = dataPoints.slice(0, midpoint);
        const secondHalf = dataPoints.slice(midpoint);
        const trends = [];
        if (firstHalf.length > 0 && secondHalf.length > 0) {
            const firstAvgResponseTime = this.calculateAverage(firstHalf, 'responseTime');
            const secondAvgResponseTime = this.calculateAverage(secondHalf, 'responseTime');
            trends.push({
                metric: 'responseTime',
                direction: secondAvgResponseTime > firstAvgResponseTime ? 'declining' : 'improving',
                change: (secondAvgResponseTime - firstAvgResponseTime) / firstAvgResponseTime,
                significance: 'medium'
            });
        }
        return trends;
    }
    analyzeTrend(dataPoints, metric) {
        // Simplified trend analysis
        return [{
                metric,
                direction: 'stable',
                confidence: 0.8,
                timeFrame: '24h',
                significance: 'medium'
            }];
    }
    generateAlertId() {
        return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    async handleResponseReceived(event) {
        const data = event.data;
        if (data.responseTime) {
            await this.recordPerformanceData({
                responseTime: data.responseTime,
                accuracy: data.accuracy || 0.8,
                userSatisfaction: data.userSatisfaction || 0.8,
                cost: data.cost || 0,
                errorOccurred: false,
                requestId: data.requestId,
                modelUsed: data.modelUsed,
                operationType: 'response'
            });
        }
    }
    async handlePerformanceUpdated(event) {
        this.context.logger.debug('Performance updated event received', event.data);
    }
}
