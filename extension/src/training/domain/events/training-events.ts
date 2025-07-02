// TypeScript-EDA Training Domain Events
// Following Domain-Driven Design and Event-Driven Architecture principles

export abstract class DomainEvent {
  public readonly id: string;
  public readonly timestamp: Date;
  public readonly correlationId: string;

  constructor(correlationId: string) {
    this.id = `${this.constructor.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = new Date();
    this.correlationId = correlationId;
  }

  abstract get eventType(): string;
}

// Training Mode Events
export class TrainingModeRequested extends DomainEvent {
  public readonly eventType = 'TrainingModeRequested';
  
  constructor(
    public readonly website: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class TrainingModeEnabled extends DomainEvent {
  public readonly eventType = 'TrainingModeEnabled';
  
  constructor(
    public readonly sessionId: string,
    public readonly website: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class TrainingModeDisabled extends DomainEvent {
  public readonly eventType = 'TrainingModeDisabled';
  
  constructor(
    public readonly sessionId: string,
    public readonly reason: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

// Element Selection Events
export class ElementSelectionRequested extends DomainEvent {
  public readonly eventType = 'ElementSelectionRequested';
  
  constructor(
    public readonly messageType: string,
    public readonly elementDescription: string,
    public readonly context: ExecutionContext,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class ElementSelected extends DomainEvent {
  public readonly eventType = 'ElementSelected';
  
  constructor(
    public readonly element: Element,
    public readonly selector: string,
    public readonly messageType: string,
    public readonly context: ExecutionContext,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class ElementSelectionFailed extends DomainEvent {
  public readonly eventType = 'ElementSelectionFailed';
  
  constructor(
    public readonly reason: string,
    public readonly messageType: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

// Pattern Learning Events
export class PatternLearningRequested extends DomainEvent {
  public readonly eventType = 'PatternLearningRequested';
  
  constructor(
    public readonly messageType: string,
    public readonly payload: Record<string, any>,
    public readonly selector: string,
    public readonly context: ExecutionContext,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class PatternLearned extends DomainEvent {
  public readonly eventType = 'PatternLearned';
  
  constructor(
    public readonly pattern: AutomationPatternData,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class PatternLearningFailed extends DomainEvent {
  public readonly eventType = 'PatternLearningFailed';
  
  constructor(
    public readonly reason: string,
    public readonly messageType: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

// Pattern Execution Events
export class AutomationPatternMatched extends DomainEvent {
  public readonly eventType = 'AutomationPatternMatched';
  
  constructor(
    public readonly pattern: AutomationPatternData,
    public readonly request: AutomationRequest,
    public readonly confidence: number,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class AutomationPatternExecuted extends DomainEvent {
  public readonly eventType = 'AutomationPatternExecuted';
  
  constructor(
    public readonly patternId: string,
    public readonly executionResult: ExecutionResult,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class PatternExecutionFailed extends DomainEvent {
  public readonly eventType = 'PatternExecutionFailed';
  
  constructor(
    public readonly patternId: string,
    public readonly reason: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

// Training Session Events
export class TrainingSessionStarted extends DomainEvent {
  public readonly eventType = 'TrainingSessionStarted';
  
  constructor(
    public readonly sessionId: string,
    public readonly website: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class TrainingSessionEnded extends DomainEvent {
  public readonly eventType = 'TrainingSessionEnded';
  
  constructor(
    public readonly sessionId: string,
    public readonly duration: number,
    public readonly patternsLearned: number,
    correlationId: string
  ) {
    super(correlationId);
  }
}

// User Guidance Events
export class UserGuidanceDisplayed extends DomainEvent {
  public readonly eventType = 'UserGuidanceDisplayed';
  
  constructor(
    public readonly guidance: UserGuidanceData,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class UserActionConfirmed extends DomainEvent {
  public readonly eventType = 'UserActionConfirmed';
  
  constructor(
    public readonly action: string,
    public readonly elementSelector: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

export class UserActionCancelled extends DomainEvent {
  public readonly eventType = 'UserActionCancelled';
  
  constructor(
    public readonly action: string,
    public readonly reason: string,
    correlationId: string
  ) {
    super(correlationId);
  }
}

// Supporting Types
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

// Event Union Types for Type Safety
export type TrainingDomainEvent = 
  | TrainingModeRequested
  | TrainingModeEnabled
  | TrainingModeDisabled
  | ElementSelectionRequested
  | ElementSelected
  | ElementSelectionFailed
  | PatternLearningRequested
  | PatternLearned
  | PatternLearningFailed
  | AutomationPatternMatched
  | AutomationPatternExecuted
  | PatternExecutionFailed
  | TrainingSessionStarted
  | TrainingSessionEnded
  | UserGuidanceDisplayed
  | UserActionConfirmed
  | UserActionCancelled;