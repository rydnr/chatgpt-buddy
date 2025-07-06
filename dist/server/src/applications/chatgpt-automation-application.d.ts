/**
 * @fileoverview ChatGPT Automation Application
 * @description Specialized automation application for ChatGPT and language model integration
 * @author rydnr
 */
import { Application } from '@typescript-eda/application';
import { AutomationRequestReceivedEvent, ExtensionConnectedEvent, AutomationResponseReceivedEvent } from '@web-buddy/nodejs-server';
import { ChatGPTInteractionRequestedEvent } from '../events/chatgpt-events';
/**
 * ChatGPT-specific automation application
 * Extends Web-Buddy coordination with AI language model integration
 */
export declare class ChatGPTAutomationApplication extends Application {
    readonly metadata: Map<string, string>;
    private activeAIInteractions;
    private patternRecognitionEnabled;
    private aiInsightsEnabled;
    /**
     * Handle ChatGPT interaction requests from browser extensions
     */
    handleChatGPTInteraction(event: ChatGPTInteractionRequestedEvent): Promise<void>;
    /**
     * Handle automation requests with AI enhancement
     */
    handleAutomationWithAI(event: AutomationRequestReceivedEvent): Promise<void>;
    /**
     * Handle automation responses with AI analysis
     */
    handleAutomationResponseWithAI(event: AutomationResponseReceivedEvent): Promise<void>;
    /**
     * Handle extension connections with AI capability detection
     */
    handleExtensionWithAICapabilities(event: ExtensionConnectedEvent): Promise<void>;
    /**
     * Select the optimal AI model for a given request
     */
    private selectOptimalModel;
    /**
     * Select the appropriate AI service based on model
     */
    private selectAIService;
    /**
     * Determine if automation should be enhanced with AI
     */
    private shouldEnhanceWithAI;
    /**
     * Generate AI insights for automation
     */
    private generateAutomationInsights;
    /**
     * Analyze automation response for improvements
     */
    private analyzeAutomationResponse;
    /**
     * Analyze interaction patterns for learning
     */
    private analyzeInteractionPatterns;
    /**
     * Detect AI capabilities from extension metadata
     */
    private detectAICapabilities;
    /**
     * Configure AI features for extension
     */
    private configureAIFeatures;
    /**
     * Helper methods for data management
     */
    private storeAutomationInsights;
    private storeImprovementSuggestions;
    private updateAutomationPatterns;
    private parseAISuggestions;
    private getAdapter;
    /**
     * Get current AI interaction statistics
     */
    getAIStatistics(): AIStatistics;
    private calculateModelUsage;
    /**
     * Application lifecycle methods
     */
    start(): Promise<void>;
    shutdown(): Promise<void>;
}
interface AIStatistics {
    totalInteractions: number;
    completedInteractions: number;
    failedInteractions: number;
    averageResponseTime: number;
    modelUsage: Record<string, number>;
}
export {};
//# sourceMappingURL=chatgpt-automation-application.d.ts.map