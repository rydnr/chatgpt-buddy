/**
 * @fileoverview ChatGPT-specific events for AI automation integration
 * @description Domain events for ChatGPT and language model interactions
 * @author rydnr
 */
import { Event } from '@typescript-eda/domain';
/**
 * Event triggered when a ChatGPT interaction is requested
 */
export declare class ChatGPTInteractionRequestedEvent extends Event {
    readonly requestId: string;
    readonly extensionId: string;
    readonly prompt: string;
    readonly context?: ChatGPTContext | undefined;
    readonly modelPreference?: string | undefined;
    readonly options?: ChatGPTOptions | undefined;
    readonly type = "ChatGPTInteractionRequested";
    constructor(requestId: string, extensionId: string, prompt: string, context?: ChatGPTContext | undefined, modelPreference?: string | undefined, options?: ChatGPTOptions | undefined);
}
/**
 * Event triggered when a ChatGPT response is received
 */
export declare class ChatGPTResponseReceivedEvent extends Event {
    readonly requestId: string;
    readonly extensionId: string;
    readonly response: ChatGPTResponse;
    readonly responseTime: number;
    readonly type = "ChatGPTResponseReceived";
    constructor(requestId: string, extensionId: string, response: ChatGPTResponse, responseTime: number);
}
/**
 * Event triggered when a ChatGPT interaction fails
 */
export declare class ChatGPTInteractionFailedEvent extends Event {
    readonly requestId: string;
    readonly extensionId: string;
    readonly error: ChatGPTError;
    readonly retryAttempt: number;
    readonly type = "ChatGPTInteractionFailed";
    constructor(requestId: string, extensionId: string, error: ChatGPTError, retryAttempt: number);
}
/**
 * Event triggered when language model integration is requested
 */
export declare class LanguageModelIntegrationEvent extends Event {
    readonly requestId: string;
    readonly modelType: LanguageModelType;
    readonly integrationRequest: ModelIntegrationRequest;
    readonly type = "LanguageModelIntegration";
    constructor(requestId: string, modelType: LanguageModelType, integrationRequest: ModelIntegrationRequest);
}
/**
 * Event triggered when AI automation pattern is detected
 */
export declare class AIAutomationPatternDetectedEvent extends Event {
    readonly patternId: string;
    readonly patternType: AIPatternType;
    readonly confidence: number;
    readonly context: PatternContext;
    readonly suggestions: string[];
    readonly type = "AIAutomationPatternDetected";
    constructor(patternId: string, patternType: AIPatternType, confidence: number, context: PatternContext, suggestions: string[]);
}
/**
 * Event triggered when AI model training is requested
 */
export declare class AIModelTrainingRequestedEvent extends Event {
    readonly trainingId: string;
    readonly dataSet: TrainingDataSet;
    readonly modelConfiguration: ModelConfiguration;
    readonly trainingOptions: TrainingOptions;
    readonly type = "AIModelTrainingRequested";
    constructor(trainingId: string, dataSet: TrainingDataSet, modelConfiguration: ModelConfiguration, trainingOptions: TrainingOptions);
}
/**
 * Event triggered when AI response analysis is completed
 */
export declare class AIResponseAnalysisCompletedEvent extends Event {
    readonly analysisId: string;
    readonly requestId: string;
    readonly analysis: ResponseAnalysis;
    readonly insights: AIInsights;
    readonly type = "AIResponseAnalysisCompleted";
    constructor(analysisId: string, requestId: string, analysis: ResponseAnalysis, insights: AIInsights);
}
/**
 * Event triggered when intelligent automation is suggested
 */
export declare class IntelligentAutomationSuggestedEvent extends Event {
    readonly suggestionId: string;
    readonly automationType: AutomationType;
    readonly suggestion: AutomationSuggestion;
    readonly confidence: number;
    readonly type = "IntelligentAutomationSuggested";
    constructor(suggestionId: string, automationType: AutomationType, suggestion: AutomationSuggestion, confidence: number);
}
/**
 * Event triggered when conversation context is updated
 */
export declare class ConversationContextUpdatedEvent extends Event {
    readonly conversationId: string;
    readonly extensionId: string;
    readonly contextUpdate: ContextUpdate;
    readonly previousContext?: ConversationContext | undefined;
    readonly type = "ConversationContextUpdated";
    constructor(conversationId: string, extensionId: string, contextUpdate: ContextUpdate, previousContext?: ConversationContext | undefined);
}
/**
 * Event triggered when AI model switching is requested
 */
export declare class AIModelSwitchRequestedEvent extends Event {
    readonly requestId: string;
    readonly currentModel: string;
    readonly targetModel: string;
    readonly reason: ModelSwitchReason;
    readonly context?: SwitchContext | undefined;
    readonly type = "AIModelSwitchRequested";
    constructor(requestId: string, currentModel: string, targetModel: string, reason: ModelSwitchReason, context?: SwitchContext | undefined);
}
/**
 * Event triggered when AI performance metrics are updated
 */
export declare class AIPerformanceMetricsUpdatedEvent extends Event {
    readonly metricsId: string;
    readonly metrics: AIPerformanceMetrics;
    readonly timeWindow: TimeWindow;
    readonly trends: MetricTrends;
    readonly type = "AIPerformanceMetricsUpdated";
    constructor(metricsId: string, metrics: AIPerformanceMetrics, timeWindow: TimeWindow, trends: MetricTrends);
}
/**
 * Event triggered when AI automation workflow is optimized
 */
export declare class AIWorkflowOptimizedEvent extends Event {
    readonly workflowId: string;
    readonly originalWorkflow: AutomationWorkflow;
    readonly optimizedWorkflow: AutomationWorkflow;
    readonly optimizations: WorkflowOptimization[];
    readonly expectedImprovement: PerformanceImprovement;
    readonly type = "AIWorkflowOptimized";
    constructor(workflowId: string, originalWorkflow: AutomationWorkflow, optimizedWorkflow: AutomationWorkflow, optimizations: WorkflowOptimization[], expectedImprovement: PerformanceImprovement);
}
export interface ChatGPTContext {
    conversationId?: string;
    previousMessages: Message[];
    userContext: UserContext;
    webPageContext: WebPageContext;
    automationContext?: AutomationContext;
}
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: MessageMetadata;
}
export interface MessageMetadata {
    modelUsed?: string;
    responseTime?: number;
    tokenCount?: number;
    cost?: number;
}
export interface UserContext {
    userId?: string;
    preferences: UserPreferences;
    sessionData: SessionData;
    activityHistory: ActivitySummary[];
}
export interface UserPreferences {
    preferredModel: string;
    responseStyle: 'concise' | 'detailed' | 'conversational';
    language: string;
    enableAIInsights: boolean;
    privacyLevel: 'minimal' | 'balanced' | 'comprehensive';
}
export interface SessionData {
    startTime: Date;
    interactionCount: number;
    averageResponseTime: number;
    errorCount: number;
    successfulAutomations: number;
}
export interface ActivitySummary {
    date: Date;
    interactionCount: number;
    primaryUseCase: string;
    satisfactionRating?: number;
}
export interface WebPageContext {
    url: string;
    title: string;
    domain: string;
    contentType: string;
    pageStructure: PageStructure;
    interactiveElements: InteractiveElement[];
}
export interface PageStructure {
    headings: string[];
    mainContent: string;
    navigation: NavigationElement[];
    forms: FormElement[];
}
export interface InteractiveElement {
    type: 'button' | 'link' | 'input' | 'select' | 'textarea';
    selector: string;
    label?: string;
    description?: string;
    isVisible: boolean;
}
export interface NavigationElement {
    text: string;
    url: string;
    level: number;
}
export interface FormElement {
    action: string;
    method: string;
    fields: FormField[];
}
export interface FormField {
    name: string;
    type: string;
    required: boolean;
    placeholder?: string;
}
export interface AutomationContext {
    currentTask?: string;
    taskHistory: TaskHistoryItem[];
    availableActions: AvailableAction[];
    constraints: AutomationConstraint[];
}
export interface TaskHistoryItem {
    task: string;
    timestamp: Date;
    success: boolean;
    duration: number;
    errorMessage?: string;
}
export interface AvailableAction {
    actionType: string;
    description: string;
    parameters: ActionParameter[];
    estimatedTime: number;
}
export interface ActionParameter {
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: any;
}
export interface AutomationConstraint {
    type: 'time' | 'safety' | 'permission' | 'rate_limit';
    description: string;
    value: any;
}
export interface ChatGPTOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    stop?: string[];
    enableStreaming?: boolean;
    includeContext?: boolean;
    responseFormat?: 'text' | 'json' | 'markdown';
}
export interface ChatGPTResponse {
    content: string;
    finishReason: 'stop' | 'length' | 'content_filter' | 'function_call';
    usage: TokenUsage;
    modelUsed: string;
    responseTime: number;
    confidence?: number;
    suggestions?: ResponseSuggestion[];
}
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
}
export interface ResponseSuggestion {
    type: 'action' | 'automation' | 'optimization';
    description: string;
    confidence: number;
    actionable: boolean;
}
export interface ChatGPTError {
    code: string;
    message: string;
    details?: any;
    retryable: boolean;
    suggestions: string[];
    modelFallback?: string;
}
export type LanguageModelType = 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'custom';
export interface ModelIntegrationRequest {
    modelType: LanguageModelType;
    configuration: ModelConfiguration;
    integrationLevel: 'basic' | 'advanced' | 'custom';
    features: ModelFeature[];
}
export interface ModelConfiguration {
    apiKey?: string;
    endpoint?: string;
    version?: string;
    customSettings?: Record<string, any>;
    rateLimits?: RateLimitSettings;
}
export interface RateLimitSettings {
    requestsPerMinute: number;
    tokensPerMinute: number;
    dailyLimit?: number;
}
export type ModelFeature = 'text_generation' | 'code_generation' | 'analysis' | 'translation' | 'summarization' | 'function_calling';
export type AIPatternType = 'conversation' | 'automation' | 'workflow' | 'data_extraction' | 'content_generation' | 'decision_making';
export interface PatternContext {
    domainType: string;
    complexity: 'simple' | 'medium' | 'complex';
    frequency: number;
    successRate: number;
    lastUsed: Date;
}
export interface TrainingDataSet {
    dataType: 'conversations' | 'automations' | 'mixed';
    size: number;
    quality: 'low' | 'medium' | 'high';
    source: string;
    preprocessingRequired: boolean;
}
export interface TrainingOptions {
    epochs: number;
    batchSize: number;
    learningRate: number;
    validationSplit: number;
    earlyStoppingEnabled: boolean;
}
export interface ResponseAnalysis {
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    relevance: number;
    accuracy: number;
    helpfulness: number;
    completeness: number;
    issues: AnalysisIssue[];
}
export interface AnalysisIssue {
    type: 'accuracy' | 'relevance' | 'completeness' | 'tone' | 'safety';
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestion: string;
}
export interface AIInsights {
    patterns: InsightPattern[];
    recommendations: Recommendation[];
    trends: TrendAnalysis[];
    opportunities: OptimizationOpportunity[];
}
export interface InsightPattern {
    type: string;
    description: string;
    confidence: number;
    frequency: number;
    impact: 'low' | 'medium' | 'high';
}
export interface Recommendation {
    category: 'performance' | 'user_experience' | 'efficiency' | 'cost';
    priority: 'low' | 'medium' | 'high';
    description: string;
    expectedBenefit: string;
    implementationEffort: 'low' | 'medium' | 'high';
}
export interface TrendAnalysis {
    metric: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    timeFrame: string;
    significance: 'low' | 'medium' | 'high';
}
export interface OptimizationOpportunity {
    area: string;
    currentPerformance: number;
    potentialImprovement: number;
    implementation: string;
    priority: number;
}
export type AutomationType = 'web_navigation' | 'form_filling' | 'data_extraction' | 'content_creation' | 'task_automation' | 'workflow_optimization';
export interface AutomationSuggestion {
    description: string;
    steps: AutomationStep[];
    estimatedTime: number;
    successProbability: number;
    prerequisites: string[];
    benefits: string[];
}
export interface AutomationStep {
    action: string;
    target: string;
    parameters: Record<string, any>;
    optional: boolean;
    retryable: boolean;
}
export interface ContextUpdate {
    addedContext: Record<string, any>;
    removedContext: string[];
    modifiedContext: Record<string, any>;
    updateReason: string;
}
export interface ConversationContext {
    conversationId: string;
    participantCount: number;
    topics: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    complexity: 'simple' | 'medium' | 'complex';
    lastActivity: Date;
}
export type ModelSwitchReason = 'performance' | 'cost' | 'capability' | 'availability' | 'user_preference' | 'error_recovery';
export interface SwitchContext {
    currentTask: string;
    requirementsChanged: boolean;
    performanceThreshold: number;
    fallbackOptions: string[];
}
export interface AIPerformanceMetrics {
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
export interface TimeWindow {
    start: Date;
    end: Date;
    duration: number;
    granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
}
export interface MetricTrends {
    shortTerm: TrendDirection;
    longTerm: TrendDirection;
    seasonality: SeasonalPattern[];
    anomalies: AnomalyDetection[];
}
export type TrendDirection = 'up' | 'down' | 'flat' | 'volatile';
export interface SeasonalPattern {
    period: string;
    strength: number;
    description: string;
}
export interface AnomalyDetection {
    timestamp: Date;
    metric: string;
    expectedValue: number;
    actualValue: number;
    severity: 'low' | 'medium' | 'high';
}
export interface AutomationWorkflow {
    id: string;
    name: string;
    steps: WorkflowStep[];
    estimatedDuration: number;
    successRate: number;
    cost: number;
}
export interface WorkflowStep {
    id: string;
    type: string;
    description: string;
    duration: number;
    dependencies: string[];
    parameters: Record<string, any>;
}
export interface WorkflowOptimization {
    type: 'parallelization' | 'caching' | 'elimination' | 'substitution';
    description: string;
    impact: OptimizationImpact;
    implementationComplexity: 'low' | 'medium' | 'high';
}
export interface OptimizationImpact {
    timeReduction: number;
    costReduction: number;
    accuracyImprovement: number;
    reliabilityImprovement: number;
}
export interface PerformanceImprovement {
    overallImprovement: number;
    keyMetrics: Record<string, number>;
    riskFactors: string[];
    confidenceLevel: number;
}
//# sourceMappingURL=chatgpt-events.d.ts.map