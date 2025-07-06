/**
 * @fileoverview ChatGPT-Buddy Background Script
 * @description AI-enhanced background script extending Web-Buddy framework for ChatGPT automation
 * @author rydnr
 */
import { BackgroundApplication } from '@web-buddy/browser-extension';
import { ChatGPTInteractionRequestedEvent, AIPatternRecognitionEvent, TrainingModeRequestedEvent, LanguageModelIntegrationEvent } from './training/domain/events/training-events';
/**
 * ChatGPT-specific background application extending Web-Buddy base functionality
 * Adds AI automation, pattern recognition, and ChatGPT integration capabilities
 */
export declare class ChatGPTBackgroundApplication extends BackgroundApplication {
    readonly metadata: Map<string, string>;
    private aiConfig;
    constructor();
    /**
     * Handle ChatGPT-specific interaction requests
     */
    handleChatGPTInteraction(event: ChatGPTInteractionRequestedEvent): Promise<void>;
    /**
     * Handle AI pattern recognition events
     */
    handlePatternRecognition(event: AIPatternRecognitionEvent): Promise<void>;
    /**
     * Handle training mode requests for pattern learning
     */
    handleTrainingModeRequest(event: TrainingModeRequestedEvent): Promise<void>;
    /**
     * Handle language model integration events
     */
    handleLanguageModelIntegration(event: LanguageModelIntegrationEvent): Promise<void>;
    /**
     * Ensure a ChatGPT tab is available, opening one if necessary
     */
    private ensureChatGPTTab;
    /**
     * Analyze detected patterns for automation opportunities
     */
    private analyzePattern;
    /**
     * Notify user of automation opportunities
     */
    private notifyAutomationOpportunities;
    /**
     * Handle OpenAI API integration
     */
    private handleOpenAIIntegration;
    /**
     * Handle Anthropic API integration
     */
    private handleAnthropicIntegration;
    /**
     * Override Chrome message handling to add ChatGPT-specific actions
     */
    protected handleChromeMessage(message: any, sender: any, sendResponse: Function): Promise<void>;
    /**
     * Initialize ChatGPT-specific functionality
     */
    initialize(): Promise<void>;
    /**
     * Initialize ChatGPT-specific features
     */
    private initializeChatGPTFeatures;
}
//# sourceMappingURL=chatgpt-background.d.ts.map