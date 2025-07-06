"use strict";
/**
 * @fileoverview ChatGPT-Buddy Background Script
 * @description AI-enhanced background script extending Web-Buddy framework for ChatGPT automation
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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGPTBackgroundApplication = void 0;
const application_1 = require("@typescript-eda/application");
const domain_1 = require("@typescript-eda/domain");
const browser_extension_1 = require("@web-buddy/browser-extension");
const training_events_1 = require("./training/domain/events/training-events");
const training_application_1 = require("./training/application/training-application");
/**
 * ChatGPT-specific background application extending Web-Buddy base functionality
 * Adds AI automation, pattern recognition, and ChatGPT integration capabilities
 */
let ChatGPTBackgroundApplication = class ChatGPTBackgroundApplication extends browser_extension_1.BackgroundApplication {
    constructor() {
        super();
        this.metadata = new Map([
            ['name', 'ChatGPT-Buddy Background Application'],
            ['description', 'AI-powered browser extension for ChatGPT automation'],
            ['version', '2.0.0'],
            ['capabilities', [
                    'websocket',
                    'tabManagement',
                    'messageStore',
                    'automation',
                    'chatgpt-integration',
                    'ai-pattern-recognition',
                    'training-system',
                    'language-model-routing'
                ]],
            ['supportedModels', [
                    'gpt-4',
                    'gpt-4-turbo',
                    'gpt-3.5-turbo',
                    'claude-3-opus',
                    'claude-3-sonnet'
                ]]
        ]);
        this.aiConfig = {
            enablePatternRecognition: true,
            enableTrainingMode: false,
            preferredModel: 'gpt-4',
            contextRetention: true,
            smartAutomation: true
        };
        console.log('🤖 ChatGPT-Buddy Background Application initializing...');
    }
    /**
     * Handle ChatGPT-specific interaction requests
     */
    async handleChatGPTInteraction(event) {
        console.log(`🤖 ChatGPT interaction requested: ${event.interactionType}`);
        try {
            // Get active tab for ChatGPT interaction
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab.id) {
                throw new Error('No active tab found for ChatGPT interaction');
            }
            // Check if this is a ChatGPT tab
            const isChatGPTTab = tab.url?.includes('chat.openai.com') ||
                tab.url?.includes('chatgpt.com') ||
                tab.title?.toLowerCase().includes('chatgpt');
            if (!isChatGPTTab) {
                console.log('⚠️ Current tab is not a ChatGPT tab, attempting to find or open one');
                await this.ensureChatGPTTab();
                return;
            }
            // Send ChatGPT-specific message to content script
            const chatGPTMessage = {
                action: 'chatgpt_interaction',
                interactionType: event.interactionType,
                prompt: event.prompt,
                context: event.context,
                model: event.preferredModel || this.aiConfig.preferredModel,
                correlationId: event.correlationId
            };
            chrome.tabs.sendMessage(tab.id, chatGPTMessage, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Error sending ChatGPT message:', chrome.runtime.lastError.message);
                }
                else {
                    console.log('✅ ChatGPT interaction response:', response);
                }
            });
        }
        catch (error) {
            console.error('❌ Error handling ChatGPT interaction:', error);
        }
    }
    /**
     * Handle AI pattern recognition events
     */
    async handlePatternRecognition(event) {
        if (!this.aiConfig.enablePatternRecognition) {
            console.log('🔍 Pattern recognition disabled, skipping event');
            return;
        }
        console.log(`🧠 AI pattern detected: ${event.patternType}`);
        // Analyze pattern and suggest automation opportunities
        const suggestions = await this.analyzePattern(event);
        if (suggestions.length > 0) {
            console.log('💡 Automation suggestions generated:', suggestions);
            // Notify user of automation opportunities
            await this.notifyAutomationOpportunities(suggestions);
        }
    }
    /**
     * Handle training mode requests for pattern learning
     */
    async handleTrainingModeRequest(event) {
        console.log(`🎓 Training mode ${event.enabled ? 'enabled' : 'disabled'}`);
        this.aiConfig.enableTrainingMode = event.enabled;
        // Get active tab and enable/disable training UI
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                action: 'toggle_training_mode',
                enabled: event.enabled,
                sessionType: event.sessionType,
                learningLevel: event.learningLevel
            });
        }
    }
    /**
     * Handle language model integration events
     */
    async handleLanguageModelIntegration(event) {
        console.log(`🔄 Language model integration: ${event.modelType}`);
        // Route request to appropriate AI service
        switch (event.modelType) {
            case 'openai':
                await this.handleOpenAIIntegration(event);
                break;
            case 'anthropic':
                await this.handleAnthropicIntegration(event);
                break;
            default:
                console.warn(`⚠️ Unknown model type: ${event.modelType}`);
        }
    }
    /**
     * Ensure a ChatGPT tab is available, opening one if necessary
     */
    async ensureChatGPTTab() {
        // First, try to find an existing ChatGPT tab
        const tabs = await chrome.tabs.query({});
        const chatGPTTab = tabs.find(tab => tab.url?.includes('chat.openai.com') ||
            tab.url?.includes('chatgpt.com') ||
            tab.title?.toLowerCase().includes('chatgpt'));
        if (chatGPTTab) {
            console.log('✅ Found existing ChatGPT tab, switching to it');
            await chrome.tabs.update(chatGPTTab.id, { active: true });
            await chrome.windows.update(chatGPTTab.windowId, { focused: true });
            return chatGPTTab;
        }
        // No existing tab found, create a new one
        console.log('🆕 Creating new ChatGPT tab');
        const newTab = await chrome.tabs.create({
            url: 'https://chat.openai.com',
            active: true
        });
        return newTab;
    }
    /**
     * Analyze detected patterns for automation opportunities
     */
    async analyzePattern(event) {
        const suggestions = [];
        switch (event.patternType) {
            case 'repetitive_prompts':
                suggestions.push('Create prompt template for repeated queries');
                suggestions.push('Set up automated prompt sequences');
                break;
            case 'data_extraction':
                suggestions.push('Automate data extraction workflow');
                suggestions.push('Create structured output templates');
                break;
            case 'workflow_optimization':
                suggestions.push('Optimize interaction flow');
                suggestions.push('Reduce manual steps with smart automation');
                break;
            default:
                suggestions.push('General automation pattern detected');
        }
        return suggestions;
    }
    /**
     * Notify user of automation opportunities
     */
    async notifyAutomationOpportunities(suggestions) {
        // For now, log to console. In future, could show notification or popup
        console.log('💡 Automation Opportunities Available:');
        suggestions.forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion}`);
        });
        // Could also badge the extension icon to indicate opportunities
        chrome.action.setBadgeText({ text: suggestions.length.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    }
    /**
     * Handle OpenAI API integration
     */
    async handleOpenAIIntegration(event) {
        console.log('🔗 Integrating with OpenAI API');
        // Implementation would send to server for API handling
    }
    /**
     * Handle Anthropic API integration
     */
    async handleAnthropicIntegration(event) {
        console.log('🔗 Integrating with Anthropic API');
        // Implementation would send to server for API handling
    }
    /**
     * Override Chrome message handling to add ChatGPT-specific actions
     */
    async handleChromeMessage(message, sender, sendResponse) {
        // Handle ChatGPT-specific actions first
        switch (message.action) {
            case 'chatgpt_prompt':
                await this.accept(new training_events_1.ChatGPTInteractionRequestedEvent('prompt_submission', message.prompt, message.context, message.model, message.correlationId));
                sendResponse({ success: true });
                break;
            case 'enable_training':
                await this.accept(new training_events_1.TrainingModeRequestedEvent(true, message.sessionType || 'general', message.learningLevel || 'intermediate'));
                sendResponse({ success: true });
                break;
            case 'disable_training':
                await this.accept(new training_events_1.TrainingModeRequestedEvent(false));
                sendResponse({ success: true });
                break;
            case 'get_ai_config':
                sendResponse({
                    success: true,
                    config: this.aiConfig,
                    metadata: Object.fromEntries(this.metadata)
                });
                break;
            default:
                // Fall back to parent class handling
                await super.handleChromeMessage(message, sender, sendResponse);
        }
    }
    /**
     * Initialize ChatGPT-specific functionality
     */
    async initialize() {
        console.log('🤖 Initializing ChatGPT-Buddy background application');
        // Initialize parent Web-Buddy functionality
        await super.initialize();
        // Initialize ChatGPT-specific features
        await this.initializeChatGPTFeatures();
        console.log('✅ ChatGPT-Buddy background application initialized');
    }
    /**
     * Initialize ChatGPT-specific features
     */
    async initializeChatGPTFeatures() {
        // Set up AI-specific configuration
        this.aiConfig.enablePatternRecognition =
            (await chrome.storage.sync.get(['enablePatternRecognition']))?.enablePatternRecognition ?? true;
        this.aiConfig.preferredModel =
            (await chrome.storage.sync.get(['preferredModel']))?.preferredModel ?? 'gpt-4';
        // Set up extension badge
        chrome.action.setBadgeText({ text: 'AI' });
        chrome.action.setBadgeBackgroundColor({ color: '#2196F3' });
        console.log('🔧 ChatGPT features initialized:', this.aiConfig);
    }
};
exports.ChatGPTBackgroundApplication = ChatGPTBackgroundApplication;
__decorate([
    (0, domain_1.listen)(training_events_1.ChatGPTInteractionRequestedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof training_events_1.ChatGPTInteractionRequestedEvent !== "undefined" && training_events_1.ChatGPTInteractionRequestedEvent) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], ChatGPTBackgroundApplication.prototype, "handleChatGPTInteraction", null);
__decorate([
    (0, domain_1.listen)(training_events_1.AIPatternRecognitionEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof training_events_1.AIPatternRecognitionEvent !== "undefined" && training_events_1.AIPatternRecognitionEvent) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], ChatGPTBackgroundApplication.prototype, "handlePatternRecognition", null);
__decorate([
    (0, domain_1.listen)(training_events_1.TrainingModeRequestedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof training_events_1.TrainingModeRequestedEvent !== "undefined" && training_events_1.TrainingModeRequestedEvent) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], ChatGPTBackgroundApplication.prototype, "handleTrainingModeRequest", null);
__decorate([
    (0, domain_1.listen)(training_events_1.LanguageModelIntegrationEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof training_events_1.LanguageModelIntegrationEvent !== "undefined" && training_events_1.LanguageModelIntegrationEvent) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], ChatGPTBackgroundApplication.prototype, "handleLanguageModelIntegration", null);
exports.ChatGPTBackgroundApplication = ChatGPTBackgroundApplication = __decorate([
    (0, application_1.Enable)(training_application_1.TrainingApplication),
    __metadata("design:paramtypes", [])
], ChatGPTBackgroundApplication);
// Initialize and start the ChatGPT background application
const chatgptBackgroundApp = new ChatGPTBackgroundApplication();
chatgptBackgroundApp.initialize().catch(error => {
    console.error('❌ Failed to initialize ChatGPT background application:', error);
});
// Export for testing
if (typeof globalThis !== 'undefined') {
    globalThis.chatgptBackgroundApp = chatgptBackgroundApp;
}
//# sourceMappingURL=chatgpt-background.js.map