import { Entity } from 'typescript-eda';
import { AutomationPatternMatched, AutomationPatternExecuted, PatternExecutionFailed, ExecutionContext, AutomationPatternData, AutomationRequest } from '../events/training-events';
export interface PatternMatchingCriteria {
    readonly messageTypeMatch: boolean;
    readonly payloadSimilarity: number;
    readonly contextCompatibility: number;
    readonly confidenceThreshold: number;
    readonly overallScore: number;
}
export interface PatternExecutionOptions {
    readonly validateContext: boolean;
    readonly updateUsageStats: boolean;
    readonly timeout: number;
}
export declare class AutomationPattern extends Entity<AutomationPattern> {
    private data;
    private executionHistory;
    private lastExecuted;
    constructor(patternData: AutomationPatternData);
    get id(): string;
    get messageType(): string;
    get payload(): Record<string, any>;
    get selector(): string;
    get context(): ExecutionContext;
    get confidence(): number;
    get usageCount(): number;
    get successfulExecutions(): number;
    get successRate(): number;
    executePattern(event: AutomationPatternMatched): Promise<AutomationPatternExecuted | PatternExecutionFailed>;
    evaluateMatch(request: AutomationRequest): Promise<PatternMatchingCriteria>;
    isGoodMatch(criteria: PatternMatchingCriteria): boolean;
    isValidForContext(currentContext: ExecutionContext): boolean;
    getReliabilityLevel(): 'high' | 'medium' | 'low' | 'unreliable';
    shouldBeRetrained(): boolean;
    private executeAutomation;
    private performAction;
    private fillText;
    private clickElement;
    private selectProject;
    private selectChat;
    private isElementClickable;
    private waitForStabilization;
    private validateProjectSelection;
    private validateChatSelection;
    private calculatePayloadSimilarity;
    private calculateContextCompatibility;
    private calculatePathCompatibility;
    private calculateConfidenceThreshold;
    private calculateOverallMatchingScore;
    private calculateReliabilityScore;
    private calculateStringSimilarity;
    private levenshteinDistance;
    private updateUsageStatistics;
    private updateConfidence;
    private recordExecution;
    private getPatternAgeInDays;
    private generateExecutionId;
}
//# sourceMappingURL=automation-pattern.d.ts.map