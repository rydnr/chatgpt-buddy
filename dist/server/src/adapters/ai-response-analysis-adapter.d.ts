/**
 * @fileoverview AI Response Analysis Adapter
 * @description Adapter for analyzing and improving AI response quality
 * @author rydnr
 */
import { Port } from '@typescript-eda/infrastructure';
/**
 * Port interface for AI response analysis operations
 */
export declare abstract class AIResponseAnalysisPort extends Port {
    readonly name = "AIResponseAnalysisPort";
    abstract analyzeResponse(response: ResponseAnalysisRequest): Promise<ResponseAnalysisResult>;
    abstract assessQuality(content: string): Promise<QualityAssessment>;
    abstract generateImprovements(analysis: ResponseAnalysisResult): Promise<ImprovementSuggestion[]>;
}
/**
 * AI response analysis adapter
 * Analyzes AI responses for quality, relevance, and improvement opportunities
 */
export declare class AIResponseAnalysisAdapter extends AIResponseAnalysisPort {
    private analysisHistory;
    private isInitialized;
    initialize(): Promise<void>;
    analyzeResponse(request: ResponseAnalysisRequest): Promise<ResponseAnalysisResult>;
    assessQuality(content: string): Promise<QualityAssessment>;
    generateImprovements(analysis: ResponseAnalysisResult): Promise<ImprovementSuggestion[]>;
    private assessResponseQuality;
    private assessRelevance;
    private assessPerformance;
    private generateBasicSuggestions;
    getAnalysisStatistics(): AnalysisStatistics;
    isHealthy(): Promise<boolean>;
    shutdown(): Promise<void>;
}
export interface ResponseAnalysisRequest {
    success: boolean;
    executionTime: number;
    result?: any;
    error?: string;
    metadata?: any;
}
export interface ResponseAnalysisResult {
    requestId: string;
    quality: number;
    relevance: number;
    performance: number;
    suggestions: string[];
    confidence: number;
}
export interface QualityAssessment {
    overallScore: number;
    clarity: number;
    completeness: number;
    accuracy: number;
    helpfulness: number;
    issues: QualityIssue[];
}
export interface QualityIssue {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
}
export interface ImprovementSuggestion {
    type: 'performance' | 'quality' | 'user_experience';
    priority: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
}
export interface AnalysisStatistics {
    totalAnalyses: number;
    averageQuality: number;
    averageRelevance: number;
    averagePerformance: number;
}
//# sourceMappingURL=ai-response-analysis-adapter.d.ts.map