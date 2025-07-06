import { PrimaryAdapter } from 'typescript-eda';
import { AutomationPatternMatched, AutomationPatternData, AutomationRequest, ExecutionContext, ExecutionResult } from '../domain/events/training-events';
import { PatternStoragePort } from './pattern-storage-adapter';
export interface PatternMatchingPort {
    findMatchingPatterns(request: AutomationRequest): Promise<PatternMatch[]>;
    selectBestPattern(matches: PatternMatch[]): PatternMatch | null;
    executePattern(pattern: AutomationPatternData, request: AutomationRequest): Promise<ExecutionResult>;
    updatePatternStatistics(patternId: string, result: ExecutionResult): Promise<void>;
}
export interface PatternMatch {
    pattern: AutomationPatternData;
    confidence: number;
    contextScore: number;
    payloadSimilarity: number;
    overallScore: number;
    recommendationLevel: 'high' | 'medium' | 'low' | 'risky';
}
export declare class PatternMatchingAdapter implements PatternMatchingPort, PrimaryAdapter {
    private storageAdapter;
    private patternCache;
    private cacheTimeout;
    private lastCacheUpdate;
    constructor(storageAdapter?: PatternStoragePort);
    handleAutomationRequest(request: AutomationRequest): Promise<AutomationPatternMatched | null>;
    findMatchingPatterns(request: AutomationRequest): Promise<PatternMatch[]>;
    selectBestPattern(matches: PatternMatch[]): PatternMatch | null;
    executePattern(pattern: AutomationPatternData, request: AutomationRequest): Promise<ExecutionResult>;
    updatePatternStatistics(patternId: string, result: ExecutionResult): Promise<void>;
    analyzePatternPerformance(patternId: string): Promise<{
        pattern: AutomationPatternData;
        performance: {
            successRate: number;
            averageExecutionTime: number;
            recentTrend: 'improving' | 'stable' | 'declining';
            reliability: 'high' | 'medium' | 'low' | 'unreliable';
            recommendedAction: 'keep' | 'retrain' | 'delete';
        };
    } | null>;
    getPatternRecommendations(context: ExecutionContext): Promise<{
        suggestionsByType: Record<string, PatternMatch[]>;
        overallHealth: number;
        needsTraining: string[];
        stalePatterns: string[];
    }>;
    private evaluatePatternMatch;
    private createLowScoreMatch;
    private calculatePayloadSimilarity;
    private calculateContextScore;
    private calculatePatternReliability;
    private calculateAgePenalty;
    private determineRecommendationLevel;
    private calculateStringSimilarity;
    private calculatePathSimilarity;
    private levenshteinDistance;
    private getPatternsByType;
    private invalidateCacheForType;
    private isMatchAcceptable;
    private isContextValid;
    private isElementActionable;
    private performPatternAction;
    private fillTextAction;
    private clickAction;
    private delay;
    private calculateUpdatedConfidence;
    private calculateReliabilityLevel;
    private getRecommendedAction;
    private shouldRetrain;
    private isPatternStale;
    private generateCorrelationId;
}
//# sourceMappingURL=pattern-matching-adapter.d.ts.map