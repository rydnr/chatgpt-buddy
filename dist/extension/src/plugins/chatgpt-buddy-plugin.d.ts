/**
 * @fileoverview ChatGPT Buddy Plugin Implementation
 * @description AI-powered automation plugin for ChatGPT and language models
 */
import { WebBuddyPlugin, PluginMetadata, PluginCapabilities, PluginContext, PluginState, PluginConfiguration, PluginUIComponent, PluginMenuItem, WebBuddyContract, PluginEvent } from './plugin-interface';
/**
 * ChatGPT-specific plugin configuration
 */
interface ChatGPTPluginConfiguration extends PluginConfiguration {
    settings: {
        preferredModel: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet';
        fallbackModel: string;
        enableTrainingMode: boolean;
        autoLearnPatterns: boolean;
        trainingConfidenceThreshold: number;
        enablePatternRecognition: boolean;
        enableAIInsights: boolean;
        cacheResponses: boolean;
        maxResponseTime: number;
        showTrainingOverlay: boolean;
        enableKeyboardShortcuts: boolean;
        notificationLevel: 'minimal' | 'normal' | 'verbose';
        apiKeys: {
            openai?: string;
            anthropic?: string;
        };
        rateLimits: {
            requestsPerMinute: number;
            maxDailyCost: number;
        };
    };
}
/**
 * ChatGPT Plugin Events
 */
export declare const ChatGPTPluginEvents: {
    readonly AI_INTERACTION_REQUESTED: "chatgpt:interaction:requested";
    readonly AI_RESPONSE_RECEIVED: "chatgpt:response:received";
    readonly AI_MODEL_SWITCHED: "chatgpt:model:switched";
    readonly TRAINING_MODE_ENABLED: "chatgpt:training:enabled";
    readonly TRAINING_PATTERN_LEARNED: "chatgpt:training:pattern:learned";
    readonly TRAINING_SESSION_COMPLETED: "chatgpt:training:session:completed";
    readonly CHATGPT_MESSAGE_SENT: "chatgpt:message:sent";
    readonly CHATGPT_RESPONSE_EXTRACTED: "chatgpt:response:extracted";
    readonly CONVERSATION_STARTED: "chatgpt:conversation:started";
    readonly AI_PERFORMANCE_UPDATED: "chatgpt:performance:updated";
    readonly OPTIMIZATION_SUGGESTED: "chatgpt:optimization:suggested";
};
/**
 * ChatGPT Buddy Plugin - Main plugin implementation
 */
export declare class ChatGPTBuddyPlugin implements WebBuddyPlugin {
    readonly id = "chatgpt-buddy";
    readonly name = "ChatGPT Buddy";
    readonly version = "2.0.0";
    readonly description = "AI-powered automation for ChatGPT and language models";
    readonly author = "rydnr";
    readonly metadata: PluginMetadata;
    readonly capabilities: PluginCapabilities;
    state: PluginState;
    private context?;
    private aiModelManager?;
    private trainingManager?;
    private automationEngine?;
    private performanceTracker?;
    /**
     * Initialize the plugin
     */
    initialize(context: PluginContext): Promise<void>;
    /**
     * Activate the plugin
     */
    activate(): Promise<void>;
    /**
     * Deactivate the plugin
     */
    deactivate(): Promise<void>;
    /**
     * Destroy the plugin
     */
    destroy(): Promise<void>;
    /**
     * Get plugin contracts
     */
    getContracts(): WebBuddyContract[];
    /**
     * Execute a plugin capability
     */
    executeCapability(capability: string, params: any): Promise<any>;
    /**
     * Validate capability parameters
     */
    validateCapability(capability: string, params: any): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Get UI components
     */
    getUIComponents(): PluginUIComponent[];
    /**
     * Get menu items
     */
    getMenuItems(): PluginMenuItem[];
    /**
     * Handle plugin events
     */
    onEvent(event: PluginEvent): Promise<void>;
    /**
     * Get default configuration
     */
    getDefaultConfig(): ChatGPTPluginConfiguration;
    /**
     * Handle configuration changes
     */
    onConfigChange(config: PluginConfiguration): Promise<void>;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        healthy: boolean;
        issues: string[];
    }>;
    /**
     * Get plugin metrics
     */
    getMetrics(): Promise<Record<string, any>>;
    private setupEventListeners;
    private loadConfiguration;
    private applyConfiguration;
    private sendMessage;
    private getLatestResponse;
    private startNewConversation;
    private selectAIModel;
    private enableTrainingMode;
    private learnAutomationPattern;
    private getAIInsights;
    private renderTrainingOverlay;
    private renderModelSelector;
    private renderPatternLibrary;
    private renderInsightsDashboard;
    private showModelSelector;
    private showPatternLibrary;
    private showInsightsDashboard;
    private showSettings;
    private handleTabActivated;
    private handlePatternDetected;
    private handleTrainingSessionStarted;
    private handleModelSwitched;
    private calculateMessageCost;
    private getModelCostMultiplier;
    private generateRequestId;
    private generateOverallRecommendations;
}
export interface AIModel {
    id: string;
    name: string;
    provider: string;
    tier: 'standard' | 'premium';
    costTier: 'low' | 'medium' | 'high';
    capabilities: string[];
    maxTokens: number;
    baseScore: number;
    description: string;
}
export interface ModelPerformanceData {
    modelId: string;
    totalRequests: number;
    successfulRequests: number;
    totalResponseTime: number;
    averageResponseTime: number;
    successRate: number;
    totalCost: number;
    averageCost: number;
    userSatisfaction: number;
    lastUpdated: Date;
}
export interface ModelPerformanceRecord {
    modelId: string;
    responseTime: number;
    success: boolean;
    cost?: number;
    userSatisfaction?: number;
}
export interface ModelSwitchEvent {
    timestamp: Date;
    fromModel: string;
    toModel: string;
    reason: ModelSwitchReason;
    success: boolean;
}
export type ModelSwitchReason = 'performance' | 'cost' | 'capability' | 'availability' | 'user_preference' | 'error_recovery';
export interface ModelSelectionContext {
    taskType: string;
    complexityLevel: 'low' | 'medium' | 'high';
    costPreference?: 'low' | 'medium' | 'high';
    timeConstraint?: number;
    qualityRequirement?: number;
}
export interface ModelRecommendation {
    modelId: string;
    confidence: number;
    reasoning: string;
    estimatedPerformance: EstimatedPerformance;
}
export interface EstimatedPerformance {
    responseTime: number;
    successRate: number;
    cost: number;
    quality: number;
}
export interface TrainingSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    request: TrainingRequest;
    status: 'active' | 'completed' | 'cancelled' | 'failed';
    steps: TrainingStep[];
    patterns: LearnedPattern[];
    confidence: number;
}
export interface TrainingRequest {
    type: string;
    description: string;
    expectedOutcome: string;
    context: any;
}
export interface TrainingStep {
    action: string;
    selector: string;
    parameters: any;
    timestamp: Date;
    success: boolean;
}
export interface LearnedPattern {
    id: string;
    type: string;
    action: string;
    selector: string;
    parameters: any;
    context: {
        domain: string;
        url: string;
        timestamp: Date;
    };
    confidence: number;
    learnedAt: Date;
    usageCount: number;
    successCount: number;
    lastUsed: Date;
    failures: PatternFailure[];
}
export interface PatternFailure {
    timestamp: Date;
    reason: string;
    context: any;
}
export interface TrainingRecord {
    sessionId: string;
    startTime: Date;
    endTime: Date;
    request: TrainingRequest;
    stepsCount: number;
    patternsLearned: number;
    success: boolean;
    reason: string;
}
export interface TrainingResult {
    sessionId: string;
    success: boolean;
    patternsLearned: LearnedPattern[];
    executionTime: number;
    reason: string;
}
export interface PatternValidationResult {
    valid: boolean;
    issues: string[];
    confidence?: number;
    recommendations?: string[];
}
export interface PatternFeedback {
    success: boolean;
    reason?: string;
    context?: any;
}
export interface AutomationRequest {
    steps: AutomationStep[];
    timeout?: number;
    retryPolicy?: RetryPolicy;
    safetyChecks?: boolean;
}
export interface AutomationStep {
    type: 'click' | 'type' | 'wait' | 'extract' | 'navigate' | 'custom';
    selector: string;
    parameters?: any;
    optional?: boolean;
    timeout?: number;
}
export interface AutomationExecution {
    id: string;
    request: AutomationRequest;
    startTime: Date;
    endTime?: Date;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    steps: ExecutionStep[];
    retryCount: number;
    error?: Error;
    result?: AutomationResult;
}
export interface ExecutionStep {
    step: AutomationStep;
    result: StepResult;
    timestamp: Date;
}
export interface StepResult {
    type: string;
    success: boolean;
    selector?: string;
    value?: any;
    extractedData?: any;
    duration?: number;
    url?: string;
    timestamp: Date;
}
export interface AutomationResult {
    executionId: string;
    success: boolean;
    results: StepResult[];
    executionTime: number;
    stepsCompleted: number;
}
export interface ExecutionRecord {
    id: string;
    startTime: Date;
    endTime: Date;
    request: AutomationRequest;
    success: boolean;
    stepsCompleted: number;
    retryCount: number;
    error?: string;
}
export interface AutomationSettings {
    maxConcurrentExecutions: number;
    defaultTimeout: number;
    retryAttempts: number;
    enableSafetyChecks: boolean;
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential';
    baseDelay: number;
}
export interface MessageOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}
export interface MessageResult {
    success: boolean;
    messageId?: string;
    timestamp: Date;
}
export interface ResponseOptions {
    timeout?: number;
    includeMetadata?: boolean;
}
export interface PerformanceMetrics {
    responseTime: MetricValue;
    accuracy: MetricValue;
    userSatisfaction: MetricValue;
    costEfficiency: MetricValue;
    errorRate: MetricValue;
    throughput: MetricValue;
}
export interface MetricValue {
    current: number;
    previous: number;
    change: number;
    trend: 'improving' | 'declining' | 'stable';
}
export interface PerformanceDataPoint {
    timestamp: Date;
    responseTime: number;
    accuracy: number;
    userSatisfaction: number;
    cost?: number;
    errorOccurred: boolean;
    requestId: string;
    modelUsed: string;
    operationType: string;
    systemMetrics?: {
        memoryUsage: number;
        memoryLimit: number;
        cpuTime: number;
    };
}
export interface PerformanceDataInput {
    responseTime: number;
    accuracy: number;
    userSatisfaction: number;
    cost?: number;
    errorOccurred?: boolean;
    requestId: string;
    modelUsed: string;
    operationType: string;
}
export interface PerformanceAlert {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: Date;
    value: number;
    threshold: number;
    status: 'active' | 'resolved';
}
export interface PerformanceThresholds {
    maxResponseTime: number;
    minAccuracy: number;
    minUserSatisfaction: number;
    maxErrorRate: number;
    minThroughput: number;
}
export interface PerformanceReport {
    timeWindow: {
        start: Date;
        end: Date;
    };
    summary: PerformanceSummary;
    trends: TrendData[];
    alerts: PerformanceAlert[];
    recommendations: string[];
}
export interface PerformanceSummary {
    totalRequests: number;
    averageResponseTime: number;
    averageAccuracy: number;
    averageUserSatisfaction: number;
    errorRate: number;
    totalCost: number;
}
export interface TrendData {
    metric: string;
    direction: 'improving' | 'declining' | 'stable';
    change: number;
    significance: 'low' | 'medium' | 'high';
}
export interface TrendAnalysis {
    metric: string;
    direction: 'improving' | 'declining' | 'stable';
    confidence: number;
    timeFrame: string;
    significance: 'low' | 'medium' | 'high';
}
export interface TimeWindow {
    start: Date;
    end: Date;
}
export interface OptimizationSuggestion {
    type: 'performance' | 'cost' | 'quality' | 'reliability';
    priority: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
    expectedImpact: string;
    implementationEffort: 'low' | 'medium' | 'high';
}
export {};
//# sourceMappingURL=chatgpt-buddy-plugin.d.ts.map