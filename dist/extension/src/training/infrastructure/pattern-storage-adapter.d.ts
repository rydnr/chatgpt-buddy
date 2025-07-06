import { SecondaryAdapter } from 'typescript-eda';
import { AutomationPatternData, ExecutionContext } from '../domain/events/training-events';
export interface PatternStoragePort {
    storePattern(pattern: AutomationPatternData): Promise<void>;
    retrievePattern(patternId: string): Promise<AutomationPatternData | null>;
    retrievePatternsByType(messageType: string): Promise<AutomationPatternData[]>;
    retrievePatternsByContext(context: ExecutionContext): Promise<AutomationPatternData[]>;
    updatePatternUsage(patternId: string, usageCount: number, successfulExecutions: number): Promise<void>;
    updatePatternConfidence(patternId: string, confidence: number): Promise<void>;
    deletePattern(patternId: string): Promise<void>;
    clearAllPatterns(): Promise<void>;
    exportPatterns(): Promise<AutomationPatternData[]>;
    importPatterns(patterns: AutomationPatternData[]): Promise<void>;
}
export declare class PatternStorageAdapter implements PatternStoragePort, SecondaryAdapter {
    private static readonly DB_NAME;
    private static readonly DB_VERSION;
    private static readonly STORE_NAME;
    private db;
    private initializationPromise;
    constructor();
    storePattern(pattern: AutomationPatternData): Promise<void>;
    retrievePattern(patternId: string): Promise<AutomationPatternData | null>;
    retrievePatternsByType(messageType: string): Promise<AutomationPatternData[]>;
    retrievePatternsByContext(context: ExecutionContext): Promise<AutomationPatternData[]>;
    updatePatternUsage(patternId: string, usageCount: number, successfulExecutions: number): Promise<void>;
    updatePatternConfidence(patternId: string, confidence: number): Promise<void>;
    deletePattern(patternId: string): Promise<void>;
    clearAllPatterns(): Promise<void>;
    exportPatterns(): Promise<AutomationPatternData[]>;
    importPatterns(patterns: AutomationPatternData[]): Promise<void>;
    getPatternStatistics(): Promise<{
        totalPatterns: number;
        patternsByWebsite: Record<string, number>;
        patternsByType: Record<string, number>;
        averageConfidence: number;
        totalExecutions: number;
        successRate: number;
    }>;
    cleanupStalePatterns(maxAgeInDays?: number): Promise<number>;
    private ensureInitialized;
    private initializeDB;
    private convertToPatternData;
    private isContextCompatible;
    private calculatePathSimilarity;
}
//# sourceMappingURL=pattern-storage-adapter.d.ts.map