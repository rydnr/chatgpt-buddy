import { Application } from 'typescript-eda';
import { TrainingSession } from '../domain/entities/training-session';
import { TrainingModeEnabled, TrainingModeDisabled, ElementSelectionRequested, AutomationPatternExecuted, PatternExecutionFailed, TrainingSessionEnded, AutomationRequest, AutomationPatternData } from '../domain/events/training-events';
export interface TrainingApplicationState {
    readonly isInitialized: boolean;
    readonly currentSession: TrainingSession | null;
    readonly trainingMode: 'inactive' | 'training' | 'automatic';
    readonly totalPatterns: number;
    readonly lastActivity: Date | null;
}
export declare class ChatGPTBuddyTrainingApplication extends Application {
    readonly metadata: Map<string, unknown>;
    private state;
    private uiAdapter;
    private storageAdapter;
    private matchingAdapter;
    private currentSessionId;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    handleAutomationRequest(request: AutomationRequest): Promise<AutomationPatternExecuted | ElementSelectionRequested | PatternExecutionFailed>;
    enableTrainingMode(website: string): Promise<TrainingModeEnabled | TrainingModeDisabled>;
    disableTrainingMode(reason?: string): Promise<TrainingSessionEnded | null>;
    switchToAutomaticMode(): Promise<void>;
    getPatternStatistics(): Promise<{
        totalPatterns: number;
        patternsByWebsite: Record<string, number>;
        patternsByType: Record<string, number>;
        averageConfidence: number;
        successRate: number;
    }>;
    cleanupStalePatterns(maxAgeInDays?: number): Promise<number>;
    exportPatterns(): Promise<AutomationPatternData[]>;
    importPatterns(patterns: AutomationPatternData[]): Promise<void>;
    getState(): TrainingApplicationState;
    isTrainingMode(): boolean;
    isAutomaticMode(): boolean;
    getCurrentSession(): TrainingSession | null;
    private requestElementSelection;
    private executeMatchedPattern;
    private setupAdapterHandlers;
    private handleElementSelection;
    private handleUserConfirmation;
    private handleUserCancellation;
    private endCurrentSession;
    private extractElementDescription;
    private getCurrentContext;
    private generatePageStructureHash;
    private updateLastActivity;
    private generateSessionId;
    private generateCorrelationId;
}
export declare const trainingApplication: ChatGPTBuddyTrainingApplication;
//# sourceMappingURL=training-application.d.ts.map