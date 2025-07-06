import { Entity } from 'typescript-eda';
import { TrainingModeRequested, TrainingModeEnabled, TrainingModeDisabled, ElementSelectionRequested, ElementSelected, PatternLearningRequested, PatternLearned, PatternLearningFailed, TrainingSessionEnded, UserGuidanceDisplayed, UserActionConfirmed, UserActionCancelled, ExecutionContext, AutomationPatternData, UserGuidanceData } from '../events/training-events';
export interface TrainingSessionState {
    readonly id: string;
    readonly website: string;
    readonly mode: 'inactive' | 'training' | 'guided';
    readonly startedAt: Date | null;
    readonly endedAt: Date | null;
    readonly isActive: boolean;
    readonly currentContext: ExecutionContext | null;
    readonly learnedPatterns: AutomationPatternData[];
    readonly activeGuidance: UserGuidanceData | null;
}
export declare class TrainingSession extends Entity<TrainingSession> {
    private state;
    constructor(sessionId: string);
    get id(): string;
    get website(): string;
    get mode(): string;
    get isActive(): boolean;
    get learnedPatterns(): AutomationPatternData[];
    get currentContext(): ExecutionContext | null;
    enableTrainingMode(event: TrainingModeRequested): Promise<TrainingModeEnabled | TrainingModeDisabled>;
    requestElementSelection(event: ElementSelectionRequested): Promise<UserGuidanceDisplayed>;
    learnPattern(event: ElementSelected): Promise<PatternLearned | PatternLearningFailed>;
    handleUserConfirmation(event: UserActionConfirmed): Promise<PatternLearningRequested>;
    handleUserCancellation(event: UserActionCancelled): Promise<void>;
    endTrainingSession(reason: string, correlationId: string): Promise<TrainingSessionEnded>;
    private generateInstructions;
    private extractPayloadFromContext;
    private extractPayloadFromGuidance;
    private extractElementDescriptionFromContext;
    private extractValueFromContext;
    private extractProjectNameFromContext;
    private extractChatTitleFromContext;
    private createCurrentContext;
    private generatePageStructureHash;
    private generatePatternId;
    private emitEvent;
}
//# sourceMappingURL=training-session.d.ts.map