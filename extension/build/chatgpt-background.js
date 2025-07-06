/**
 * @fileoverview ChatGPT-Buddy Background Script
 * @description AI-enhanced background script extending Web-Buddy framework for ChatGPT automation
 * @author rydnr
 */
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Enable } from '@typescript-eda/application';
import { listen } from '@typescript-eda/domain';
import { BackgroundApplication } from '@web-buddy/browser-extension';
import { ChatGPTInteractionRequestedEvent, AIPatternRecognitionEvent, TrainingModeRequestedEvent, LanguageModelIntegrationEvent } from './training/domain/events/training-events';
import { TrainingApplication } from './training/application/training-application';
/**
 * ChatGPT-specific background application extending Web-Buddy base functionality
 * Adds AI automation, pattern recognition, and ChatGPT integration capabilities
 */
let ChatGPTBackgroundApplication = (() => {
    let _classDecorators = [Enable(TrainingApplication)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BackgroundApplication;
    let _instanceExtraInitializers = [];
    let _handleChatGPTInteraction_decorators;
    let _handlePatternRecognition_decorators;
    let _handleTrainingModeRequest_decorators;
    let _handleLanguageModelIntegration_decorators;
    var ChatGPTBackgroundApplication = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.metadata = (__runInitializers(this, _instanceExtraInitializers), new Map([
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
            ]));
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
                    await this.accept(new ChatGPTInteractionRequestedEvent('prompt_submission', message.prompt, message.context, message.model, message.correlationId));
                    sendResponse({ success: true });
                    break;
                case 'enable_training':
                    await this.accept(new TrainingModeRequestedEvent(true, message.sessionType || 'general', message.learningLevel || 'intermediate'));
                    sendResponse({ success: true });
                    break;
                case 'disable_training':
                    await this.accept(new TrainingModeRequestedEvent(false));
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
    __setFunctionName(_classThis, "ChatGPTBackgroundApplication");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        _handleChatGPTInteraction_decorators = [listen(ChatGPTInteractionRequestedEvent)];
        _handlePatternRecognition_decorators = [listen(AIPatternRecognitionEvent)];
        _handleTrainingModeRequest_decorators = [listen(TrainingModeRequestedEvent)];
        _handleLanguageModelIntegration_decorators = [listen(LanguageModelIntegrationEvent)];
        __esDecorate(_classThis, null, _handleChatGPTInteraction_decorators, { kind: "method", name: "handleChatGPTInteraction", static: false, private: false, access: { has: obj => "handleChatGPTInteraction" in obj, get: obj => obj.handleChatGPTInteraction }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handlePatternRecognition_decorators, { kind: "method", name: "handlePatternRecognition", static: false, private: false, access: { has: obj => "handlePatternRecognition" in obj, get: obj => obj.handlePatternRecognition }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleTrainingModeRequest_decorators, { kind: "method", name: "handleTrainingModeRequest", static: false, private: false, access: { has: obj => "handleTrainingModeRequest" in obj, get: obj => obj.handleTrainingModeRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleLanguageModelIntegration_decorators, { kind: "method", name: "handleLanguageModelIntegration", static: false, private: false, access: { has: obj => "handleLanguageModelIntegration" in obj, get: obj => obj.handleLanguageModelIntegration }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatGPTBackgroundApplication = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatGPTBackgroundApplication = _classThis;
})();
export { ChatGPTBackgroundApplication };
// Initialize and start the ChatGPT background application
const chatgptBackgroundApp = new ChatGPTBackgroundApplication();
chatgptBackgroundApp.initialize().catch(error => {
    console.error('❌ Failed to initialize ChatGPT background application:', error);
});
// Export for testing
if (typeof globalThis !== 'undefined') {
    globalThis.chatgptBackgroundApp = chatgptBackgroundApp;
}
