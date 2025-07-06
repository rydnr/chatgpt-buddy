export interface TrainingMessage {
    type: string;
    payload: {
        element?: string;
        value?: string;
        title?: string;
    };
    correlationId: string;
}
export interface AutomationPattern {
    id: string;
    messageType: string;
    payload: Record<string, any>;
    selector: string;
    context: {
        url: string;
        hostname?: string;
        pathname?: string;
        title: string;
        timestamp: Date;
        pageStructureHash?: string;
    };
    confidence: number;
    usageCount: number;
    successfulExecutions?: number;
}
export interface ExecutionContext {
    url: string;
    hostname: string;
    pathname: string;
    pageStructureHash?: string;
}
export declare class TrainingUI {
    private overlay;
    private isTrainingMode;
    private isSelectionMode;
    private capturedSelector;
    private capturedElement;
    private confirmationOverlay;
    private storedPatterns;
    constructor();
    enableTrainingMode(): void;
    disableTrainingMode(): void;
    showTrainingPrompt(messageType: string, payload: any): void;
    isVisible(): boolean;
    hide(): void;
    isSelectionModeEnabled(): boolean;
    getCapturedSelector(): string | null;
    getCapturedElement(): Element | null;
    getClickHandler(): ((event: MouseEvent) => void);
    isConfirmationVisible(): boolean;
    showConfirmationDialog(element: Element, selector: string): void;
    handleMouseOver(event: MouseEvent): void;
    handleMouseOut(event: MouseEvent): void;
    private enableElementSelection;
    private disableElementSelection;
    private handleElementSelection;
    createAutomationPattern(messageType: string, payload: Record<string, any>, element: Element, selector: string): AutomationPattern;
    savePattern(pattern: AutomationPattern): void;
    getStoredPatterns(): AutomationPattern[];
    getPatternsByType(messageType: string): AutomationPattern[];
    private generatePatternId;
}
export declare function generateOptimalSelector(element: Element): string;
export declare function generateTrainingText(messageType: string, payload: any): string;
export declare class PatternMatcher {
    private patterns;
    addPattern(pattern: AutomationPattern): void;
    findBestMatch(request: {
        messageType: string;
        payload: Record<string, any>;
    }): AutomationPattern | null;
    recordSuccessfulExecution(pattern: AutomationPattern): void;
    private calculateSimilarity;
    private calculateStringSimilarity;
    private levenshteinDistance;
}
export declare class ContextMatcher {
    isContextCompatible(patternContext: AutomationPattern['context'], currentContext: ExecutionContext): boolean;
    calculateContextScore(patternContext: AutomationPattern['context'], currentContext: ExecutionContext): number;
    private calculatePathSimilarity;
}
export declare class PatternValidator {
    isPatternStillValid(pattern: AutomationPattern, currentPageHash?: string): boolean;
    calculateValidationScore(pattern: AutomationPattern, currentPageHash?: string): number;
    getPatternReliabilityLevel(pattern: AutomationPattern): 'high' | 'medium' | 'low' | 'unreliable';
}
//# sourceMappingURL=training-ui.d.ts.map