export declare abstract class DomainEvent {
    readonly id: string;
    readonly timestamp: Date;
    readonly correlationId: string;
    constructor(correlationId: string);
    abstract get eventType(): string;
}
export declare class TrainingModeRequested extends DomainEvent {
    readonly website: string;
    readonly eventType = "TrainingModeRequested";
    constructor(website: string, correlationId: string);
}
export declare class TrainingModeEnabled extends DomainEvent {
    readonly sessionId: string;
    readonly website: string;
    readonly eventType = "TrainingModeEnabled";
    constructor(sessionId: string, website: string, correlationId: string);
}
export declare class TrainingModeDisabled extends DomainEvent {
    readonly sessionId: string;
    readonly reason: string;
    readonly eventType = "TrainingModeDisabled";
    constructor(sessionId: string, reason: string, correlationId: string);
}
export declare class ElementSelectionRequested extends DomainEvent {
    readonly messageType: string;
    readonly elementDescription: string;
    readonly context: ExecutionContext;
    readonly eventType = "ElementSelectionRequested";
    constructor(messageType: string, elementDescription: string, context: ExecutionContext, correlationId: string);
}
export declare class ElementSelected extends DomainEvent {
    readonly element: Element;
    readonly selector: string;
    readonly messageType: string;
    readonly context: ExecutionContext;
    readonly eventType = "ElementSelected";
    constructor(element: Element, selector: string, messageType: string, context: ExecutionContext, correlationId: string);
}
export declare class ElementSelectionFailed extends DomainEvent {
    readonly reason: string;
    readonly messageType: string;
    readonly eventType = "ElementSelectionFailed";
    constructor(reason: string, messageType: string, correlationId: string);
}
export declare class PatternLearningRequested extends DomainEvent {
    readonly messageType: string;
    readonly payload: Record<string, any>;
    readonly selector: string;
    readonly context: ExecutionContext;
    readonly eventType = "PatternLearningRequested";
    constructor(messageType: string, payload: Record<string, any>, selector: string, context: ExecutionContext, correlationId: string);
}
export declare class PatternLearned extends DomainEvent {
    readonly pattern: AutomationPatternData;
    readonly eventType = "PatternLearned";
    constructor(pattern: AutomationPatternData, correlationId: string);
}
export declare class PatternLearningFailed extends DomainEvent {
    readonly reason: string;
    readonly messageType: string;
    readonly eventType = "PatternLearningFailed";
    constructor(reason: string, messageType: string, correlationId: string);
}
export declare class AutomationPatternMatched extends DomainEvent {
    readonly pattern: AutomationPatternData;
    readonly request: AutomationRequest;
    readonly confidence: number;
    readonly eventType = "AutomationPatternMatched";
    constructor(pattern: AutomationPatternData, request: AutomationRequest, confidence: number, correlationId: string);
}
export declare class AutomationPatternExecuted extends DomainEvent {
    readonly patternId: string;
    readonly executionResult: ExecutionResult;
    readonly eventType = "AutomationPatternExecuted";
    constructor(patternId: string, executionResult: ExecutionResult, correlationId: string);
}
export declare class PatternExecutionFailed extends DomainEvent {
    readonly patternId: string;
    readonly reason: string;
    readonly eventType = "PatternExecutionFailed";
    constructor(patternId: string, reason: string, correlationId: string);
}
export declare class TrainingSessionStarted extends DomainEvent {
    readonly sessionId: string;
    readonly website: string;
    readonly eventType = "TrainingSessionStarted";
    constructor(sessionId: string, website: string, correlationId: string);
}
export declare class TrainingSessionEnded extends DomainEvent {
    readonly sessionId: string;
    readonly duration: number;
    readonly patternsLearned: number;
    readonly eventType = "TrainingSessionEnded";
    constructor(sessionId: string, duration: number, patternsLearned: number, correlationId: string);
}
export declare class UserGuidanceDisplayed extends DomainEvent {
    readonly guidance: UserGuidanceData;
    readonly eventType = "UserGuidanceDisplayed";
    constructor(guidance: UserGuidanceData, correlationId: string);
}
export declare class UserActionConfirmed extends DomainEvent {
    readonly action: string;
    readonly elementSelector: string;
    readonly eventType = "UserActionConfirmed";
    constructor(action: string, elementSelector: string, correlationId: string);
}
export declare class UserActionCancelled extends DomainEvent {
    readonly action: string;
    readonly reason: string;
    readonly eventType = "UserActionCancelled";
    constructor(action: string, reason: string, correlationId: string);
}
export interface ExecutionContext {
    url: string;
    hostname: string;
    pathname: string;
    title: string;
    timestamp: Date;
    pageStructureHash?: string;
}
export interface AutomationPatternData {
    id: string;
    messageType: string;
    payload: Record<string, any>;
    selector: string;
    context: ExecutionContext;
    confidence: number;
    usageCount: number;
    successfulExecutions: number;
}
export interface AutomationRequest {
    messageType: string;
    payload: Record<string, any>;
    context: ExecutionContext;
}
export interface ExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    timestamp: Date;
}
export interface UserGuidanceData {
    messageType: string;
    elementDescription: string;
    instructions: string;
    overlayType: 'prompt' | 'confirmation' | 'error';
}
export type TrainingDomainEvent = TrainingModeRequested | TrainingModeEnabled | TrainingModeDisabled | ElementSelectionRequested | ElementSelected | ElementSelectionFailed | PatternLearningRequested | PatternLearned | PatternLearningFailed | AutomationPatternMatched | AutomationPatternExecuted | PatternExecutionFailed | TrainingSessionStarted | TrainingSessionEnded | UserGuidanceDisplayed | UserActionConfirmed | UserActionCancelled;
//# sourceMappingURL=training-events.d.ts.map