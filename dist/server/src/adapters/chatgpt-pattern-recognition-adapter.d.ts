/**
 * @fileoverview ChatGPT Pattern Recognition Adapter
 * @description Adapter for recognizing and analyzing ChatGPT interaction patterns
 * @author rydnr
 */
import { Port } from '@typescript-eda/infrastructure';
/**
 * Port interface for ChatGPT pattern recognition operations
 */
export declare abstract class ChatGPTPatternRecognitionPort extends Port {
    readonly name = "ChatGPTPatternRecognitionPort";
    abstract analyzePattern(interaction: PatternAnalysisRequest): Promise<PatternAnalysisResult>;
    abstract detectAutomationOpportunities(context: any): Promise<AutomationOpportunity[]>;
    abstract learnFromInteraction(interaction: InteractionData): Promise<void>;
}
/**
 * ChatGPT pattern recognition adapter
 * Analyzes interaction patterns for optimization and learning opportunities
 */
export declare class ChatGPTPatternRecognitionAdapter extends ChatGPTPatternRecognitionPort {
    private patterns;
    private isInitialized;
    initialize(): Promise<void>;
    analyzePattern(request: PatternAnalysisRequest): Promise<PatternAnalysisResult>;
    detectAutomationOpportunities(context: any): Promise<AutomationOpportunity[]>;
    learnFromInteraction(interaction: InteractionData): Promise<void>;
    isHealthy(): Promise<boolean>;
    shutdown(): Promise<void>;
}
export interface PatternAnalysisRequest {
    requestId: string;
    prompt?: string;
    response?: string;
    duration?: number;
    modelUsed?: string;
}
export interface PatternAnalysisResult {
    patternType: string;
    confidence: number;
    insights: string[];
    suggestions: string[];
}
export interface AutomationOpportunity {
    type: string;
    description: string;
    confidence: number;
    estimatedBenefit: string;
}
export interface InteractionData {
    requestId: string;
    context: any;
}
export interface InteractionPattern {
    id: string;
    type: string;
    frequency: number;
    lastSeen: Date;
    context: any;
}
//# sourceMappingURL=chatgpt-pattern-recognition-adapter.d.ts.map