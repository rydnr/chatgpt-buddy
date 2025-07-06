/**
 * Advanced Training Scenarios & Multi-Step Workflows
 *
 * Implements sophisticated training scenarios including conditional logic,
 * loops, data extraction, form handling, and complex multi-step workflows.
 */
import { PatternStep } from './pattern-manager';
export interface TrainingScenario {
    id: string;
    name: string;
    description: string;
    category: ScenarioCategory;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimatedTime: number;
    prerequisites: string[];
    objectives: LearningObjective[];
    steps: ScenarioStep[];
    variations: ScenarioVariation[];
    assessment: ScenarioAssessment;
    metadata: ScenarioMetadata;
}
export type ScenarioCategory = 'form-automation' | 'data-extraction' | 'navigation-flows' | 'e-commerce' | 'testing-scenarios' | 'workflow-automation' | 'api-integration' | 'multi-tab-workflows';
export interface LearningObjective {
    id: string;
    description: string;
    skills: string[];
    verificationMethod: 'pattern-execution' | 'manual-verification' | 'automated-test';
}
export interface ScenarioStep {
    id: string;
    name: string;
    description: string;
    instructionType: 'demonstration' | 'guided-practice' | 'independent-practice';
    patterns: ScenarioPattern[];
    hints: string[];
    commonMistakes: string[];
    successCriteria: string[];
    timeLimit?: number;
}
export interface ScenarioPattern {
    id: string;
    name: string;
    description: string;
    patternSteps: PatternStep[];
    isOptional: boolean;
    alternativeApproaches: string[];
    difficultyFactors: string[];
}
export interface ScenarioVariation {
    id: string;
    name: string;
    description: string;
    changedElements: ElementChange[];
    difficultyModifier: number;
}
export interface ElementChange {
    selector: string;
    changeType: 'text' | 'position' | 'attribute' | 'visibility' | 'structure';
    oldValue: string;
    newValue: string;
    adaptationStrategy: string;
}
export interface ScenarioAssessment {
    successMetrics: SuccessMetric[];
    rubric: AssessmentRubric[];
    feedback: FeedbackRules[];
}
export interface SuccessMetric {
    name: string;
    type: 'completion-rate' | 'accuracy' | 'efficiency' | 'adaptability';
    weight: number;
    thresholds: {
        excellent: number;
        good: number;
        acceptable: number;
        needsImprovement: number;
    };
}
export interface AssessmentRubric {
    criteria: string;
    levels: {
        exemplary: {
            score: number;
            description: string;
        };
        proficient: {
            score: number;
            description: string;
        };
        developing: {
            score: number;
            description: string;
        };
        beginning: {
            score: number;
            description: string;
        };
    };
}
export interface FeedbackRules {
    condition: string;
    feedbackType: 'encouragement' | 'correction' | 'guidance' | 'challenge';
    message: string;
    suggestedActions: string[];
}
export interface ScenarioMetadata {
    author: string;
    version: string;
    lastUpdated: string;
    tags: string[];
    websiteTypes: string[];
    browserCompatibility: string[];
    language: string;
    translationSupport: boolean;
}
export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    phases: WorkflowPhase[];
    dataFlow: DataFlowDefinition[];
    errorHandling: ErrorHandlingStrategy[];
    parallelExecution: ParallelExecutionConfig;
}
export interface WorkflowPhase {
    id: string;
    name: string;
    description: string;
    order: number;
    patterns: string[];
    dependencies: string[];
    conditionalExecution: ConditionalLogic[];
    outputData: DataOutputDefinition[];
    rollbackStrategy?: RollbackStrategy;
}
export interface ConditionalLogic {
    id: string;
    condition: string;
    trueAction: 'continue' | 'skip' | 'jump-to' | 'repeat' | 'fail';
    falseAction: 'continue' | 'skip' | 'jump-to' | 'repeat' | 'fail';
    targetPhase?: string;
    maxRetries?: number;
}
export interface DataFlowDefinition {
    sourcePhase: string;
    targetPhase: string;
    dataMapping: {
        [key: string]: string;
    };
    transformations: DataTransformation[];
    validations: DataValidation[];
}
export interface DataTransformation {
    field: string;
    operation: 'format' | 'calculate' | 'lookup' | 'aggregate' | 'filter';
    parameters: {
        [key: string]: any;
    };
}
export interface DataValidation {
    field: string;
    rule: 'required' | 'pattern' | 'range' | 'custom';
    parameters: any;
    errorMessage: string;
}
export interface ErrorHandlingStrategy {
    errorType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    response: 'retry' | 'skip' | 'fallback' | 'abort' | 'manual-intervention';
    maxRetries?: number;
    fallbackPattern?: string;
    notificationLevel: 'none' | 'log' | 'warn' | 'alert';
}
export interface ParallelExecutionConfig {
    enabled: boolean;
    maxConcurrentPhases: number;
    syncPoints: string[];
    resourceSharing: ResourceSharingConfig[];
}
export interface ResourceSharingConfig {
    resource: 'browser-tab' | 'data-storage' | 'network-session' | 'user-session';
    policy: 'exclusive' | 'shared-read' | 'shared-write' | 'synchronized';
    conflictResolution: 'queue' | 'merge' | 'override' | 'error';
}
export interface RollbackStrategy {
    enabled: boolean;
    checkpoints: string[];
    rollbackMethod: 'state-restoration' | 'inverse-operations' | 'manual-cleanup';
    dataBackup: boolean;
}
export declare class AdvancedTrainingManager {
    private scenarios;
    private workflows;
    private activeTrainingSessions;
    private readonly STORAGE_KEY;
    constructor();
    /**
     * Create a comprehensive training scenario
     */
    createTrainingScenario(name: string, category: ScenarioCategory, difficulty: TrainingScenario['difficulty'], steps: ScenarioStep[], options?: Partial<TrainingScenario>): Promise<TrainingScenario>;
    /**
     * Start an advanced training session
     */
    startTrainingSession(scenarioId: string, userId?: string): Promise<TrainingSession>;
    /**
     * Create a complex multi-step workflow
     */
    createWorkflowTemplate(name: string, phases: WorkflowPhase[], options?: Partial<WorkflowTemplate>): Promise<WorkflowTemplate>;
    /**
     * Execute a complex workflow
     */
    executeWorkflow(workflowId: string, context: WorkflowExecutionContext): Promise<WorkflowExecutionResult>;
    /**
     * Initialize predefined training scenarios
     */
    private initializePredefinedScenarios;
    /**
     * Get all available training scenarios
     */
    getTrainingScenarios(filter?: {
        category?: ScenarioCategory;
        difficulty?: string;
        searchText?: string;
    }): TrainingScenario[];
    /**
     * Get workflow templates
     */
    getWorkflowTemplates(filter?: {
        category?: string;
        complexity?: string;
    }): WorkflowTemplate[];
    /**
     * Generate unique scenario ID
     */
    private generateScenarioId;
    /**
     * Generate unique workflow ID
     */
    private generateWorkflowId;
    /**
     * Estimate scenario completion time
     */
    private estimateScenarioTime;
    /**
     * Create default assessment criteria
     */
    private createDefaultAssessment;
    /**
     * Validate workflow definition
     */
    private validateWorkflow;
    /**
     * Load scenarios from storage
     */
    private loadScenarios;
    /**
     * Save scenarios to storage
     */
    private saveScenarios;
    /**
     * Save workflows to storage
     */
    private saveWorkflows;
}
/**
 * Training Session Management
 */
export declare class TrainingSession {
    readonly id: string;
    readonly scenario: TrainingScenario;
    readonly userId: string;
    readonly startTime: Date;
    currentStep: number;
    progress: SessionProgress;
    results: SessionResults;
    constructor(scenario: TrainingScenario, userId: string);
    completeStep(stepId: string, success: boolean, timeSpent: number): void;
    private calculateResults;
}
export interface SessionProgress {
    completedSteps: StepCompletion[];
    currentStepStartTime: Date;
    timeSpent: number;
    hintsUsed: number;
    mistakesMade: string[];
}
export interface StepCompletion {
    stepId: string;
    success: boolean;
    timeSpent: number;
    completedAt: Date;
}
export interface SessionResults {
    score: number;
    accuracy: number;
    efficiency: number;
    adaptability: number;
    feedback: string[];
    recommendations: string[];
}
/**
 * Workflow Execution Engine
 */
export declare class WorkflowExecutor {
    private workflow;
    private context;
    private executionState;
    constructor(workflow: WorkflowTemplate, context: WorkflowExecutionContext);
    execute(): Promise<WorkflowExecutionResult>;
    private shouldExecutePhase;
    private executePhase;
    private executePattern;
    private evaluateCondition;
}
export interface WorkflowExecutionContext {
    userId: string;
    sessionId: string;
    initialData: {
        [key: string]: any;
    };
    preferences: {
        [key: string]: any;
    };
}
export interface WorkflowExecutionState {
    currentPhase: number;
    completedPhases: string[];
    data: Map<string, any>;
    errors: string[];
    startTime: Date;
}
export interface WorkflowExecutionResult {
    success: boolean;
    executionTime: number;
    completedPhases: string[];
    data: {
        [key: string]: any;
    };
    errors: string[];
}
export declare const globalAdvancedTrainingManager: AdvancedTrainingManager;
//# sourceMappingURL=advanced-training.d.ts.map