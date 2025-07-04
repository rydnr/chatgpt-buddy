/**
 * @fileoverview ChatGPT-specific events for AI automation integration
 * @description Domain events for ChatGPT and language model interactions
 * @author rydnr
 */

import { Event } from '@typescript-eda/domain';

/**
 * Event triggered when a ChatGPT interaction is requested
 */
export class ChatGPTInteractionRequestedEvent extends Event {
  public readonly type = 'ChatGPTInteractionRequested';
  
  constructor(
    public readonly requestId: string,
    public readonly extensionId: string,
    public readonly prompt: string,
    public readonly context?: ChatGPTContext,
    public readonly modelPreference?: string,
    public readonly options?: ChatGPTOptions
  ) {
    super();
  }
}

/**
 * Event triggered when a ChatGPT response is received
 */
export class ChatGPTResponseReceivedEvent extends Event {
  public readonly type = 'ChatGPTResponseReceived';
  
  constructor(
    public readonly requestId: string,
    public readonly extensionId: string,
    public readonly response: ChatGPTResponse,
    public readonly responseTime: number
  ) {
    super();
  }
}

/**
 * Event triggered when a ChatGPT interaction fails
 */
export class ChatGPTInteractionFailedEvent extends Event {
  public readonly type = 'ChatGPTInteractionFailed';
  
  constructor(
    public readonly requestId: string,
    public readonly extensionId: string,
    public readonly error: ChatGPTError,
    public readonly retryAttempt: number
  ) {
    super();
  }
}

/**
 * Event triggered when language model integration is requested
 */
export class LanguageModelIntegrationEvent extends Event {
  public readonly type = 'LanguageModelIntegration';
  
  constructor(
    public readonly requestId: string,
    public readonly modelType: LanguageModelType,
    public readonly integrationRequest: ModelIntegrationRequest
  ) {
    super();
  }
}

/**
 * Event triggered when AI automation pattern is detected
 */
export class AIAutomationPatternDetectedEvent extends Event {
  public readonly type = 'AIAutomationPatternDetected';
  
  constructor(
    public readonly patternId: string,
    public readonly patternType: AIPatternType,
    public readonly confidence: number,
    public readonly context: PatternContext,
    public readonly suggestions: string[]
  ) {
    super();
  }
}

/**
 * Event triggered when AI model training is requested
 */
export class AIModelTrainingRequestedEvent extends Event {
  public readonly type = 'AIModelTrainingRequested';
  
  constructor(
    public readonly trainingId: string,
    public readonly dataSet: TrainingDataSet,
    public readonly modelConfiguration: ModelConfiguration,
    public readonly trainingOptions: TrainingOptions
  ) {
    super();
  }
}

/**
 * Event triggered when AI response analysis is completed
 */
export class AIResponseAnalysisCompletedEvent extends Event {
  public readonly type = 'AIResponseAnalysisCompleted';
  
  constructor(
    public readonly analysisId: string,
    public readonly requestId: string,
    public readonly analysis: ResponseAnalysis,
    public readonly insights: AIInsights
  ) {
    super();
  }
}

/**
 * Event triggered when intelligent automation is suggested
 */
export class IntelligentAutomationSuggestedEvent extends Event {
  public readonly type = 'IntelligentAutomationSuggested';
  
  constructor(
    public readonly suggestionId: string,
    public readonly automationType: AutomationType,
    public readonly suggestion: AutomationSuggestion,
    public readonly confidence: number
  ) {
    super();
  }
}

/**
 * Event triggered when conversation context is updated
 */
export class ConversationContextUpdatedEvent extends Event {
  public readonly type = 'ConversationContextUpdated';
  
  constructor(
    public readonly conversationId: string,
    public readonly extensionId: string,
    public readonly contextUpdate: ContextUpdate,
    public readonly previousContext?: ConversationContext
  ) {
    super();
  }
}

/**
 * Event triggered when AI model switching is requested
 */
export class AIModelSwitchRequestedEvent extends Event {
  public readonly type = 'AIModelSwitchRequested';
  
  constructor(
    public readonly requestId: string,
    public readonly currentModel: string,
    public readonly targetModel: string,
    public readonly reason: ModelSwitchReason,
    public readonly context?: SwitchContext
  ) {
    super();
  }
}

/**
 * Event triggered when AI performance metrics are updated
 */
export class AIPerformanceMetricsUpdatedEvent extends Event {
  public readonly type = 'AIPerformanceMetricsUpdated';
  
  constructor(
    public readonly metricsId: string,
    public readonly metrics: AIPerformanceMetrics,
    public readonly timeWindow: TimeWindow,
    public readonly trends: MetricTrends
  ) {
    super();
  }
}

/**
 * Event triggered when AI automation workflow is optimized
 */
export class AIWorkflowOptimizedEvent extends Event {
  public readonly type = 'AIWorkflowOptimized';
  
  constructor(
    public readonly workflowId: string,
    public readonly originalWorkflow: AutomationWorkflow,
    public readonly optimizedWorkflow: AutomationWorkflow,
    public readonly optimizations: WorkflowOptimization[],
    public readonly expectedImprovement: PerformanceImprovement
  ) {
    super();
  }
}

// Supporting types and interfaces

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

export type LanguageModelType = 
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku'
  | 'custom';

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

export type ModelFeature = 
  | 'text_generation'
  | 'code_generation'
  | 'analysis'
  | 'translation'
  | 'summarization'
  | 'function_calling';

export type AIPatternType = 
  | 'conversation'
  | 'automation'
  | 'workflow'
  | 'data_extraction'
  | 'content_generation'
  | 'decision_making';

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
  relevance: number; // 0-1
  accuracy: number; // 0-1
  helpfulness: number; // 0-1
  completeness: number; // 0-1
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

export type AutomationType = 
  | 'web_navigation'
  | 'form_filling'
  | 'data_extraction'
  | 'content_creation'
  | 'task_automation'
  | 'workflow_optimization';

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

export type ModelSwitchReason = 
  | 'performance'
  | 'cost'
  | 'capability'
  | 'availability'
  | 'user_preference'
  | 'error_recovery';

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
  timeReduction: number; // percentage
  costReduction: number; // percentage
  accuracyImprovement: number; // percentage
  reliabilityImprovement: number; // percentage
}

export interface PerformanceImprovement {
  overallImprovement: number; // percentage
  keyMetrics: Record<string, number>;
  riskFactors: string[];
  confidenceLevel: number; // 0-1
}