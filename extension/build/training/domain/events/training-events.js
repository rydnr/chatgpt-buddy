// TypeScript-EDA Training Domain Events
// Following Domain-Driven Design and Event-Driven Architecture principles
export class DomainEvent {
    constructor(correlationId) {
        this.id = `${this.constructor.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.timestamp = new Date();
        this.correlationId = correlationId;
    }
}
// Training Mode Events
export class TrainingModeRequested extends DomainEvent {
    constructor(website, correlationId) {
        super(correlationId);
        this.website = website;
        this.eventType = 'TrainingModeRequested';
    }
}
export class TrainingModeEnabled extends DomainEvent {
    constructor(sessionId, website, correlationId) {
        super(correlationId);
        this.sessionId = sessionId;
        this.website = website;
        this.eventType = 'TrainingModeEnabled';
    }
}
export class TrainingModeDisabled extends DomainEvent {
    constructor(sessionId, reason, correlationId) {
        super(correlationId);
        this.sessionId = sessionId;
        this.reason = reason;
        this.eventType = 'TrainingModeDisabled';
    }
}
// Element Selection Events
export class ElementSelectionRequested extends DomainEvent {
    constructor(messageType, elementDescription, context, correlationId) {
        super(correlationId);
        this.messageType = messageType;
        this.elementDescription = elementDescription;
        this.context = context;
        this.eventType = 'ElementSelectionRequested';
    }
}
export class ElementSelected extends DomainEvent {
    constructor(element, selector, messageType, context, correlationId) {
        super(correlationId);
        this.element = element;
        this.selector = selector;
        this.messageType = messageType;
        this.context = context;
        this.eventType = 'ElementSelected';
    }
}
export class ElementSelectionFailed extends DomainEvent {
    constructor(reason, messageType, correlationId) {
        super(correlationId);
        this.reason = reason;
        this.messageType = messageType;
        this.eventType = 'ElementSelectionFailed';
    }
}
// Pattern Learning Events
export class PatternLearningRequested extends DomainEvent {
    constructor(messageType, payload, selector, context, correlationId) {
        super(correlationId);
        this.messageType = messageType;
        this.payload = payload;
        this.selector = selector;
        this.context = context;
        this.eventType = 'PatternLearningRequested';
    }
}
export class PatternLearned extends DomainEvent {
    constructor(pattern, correlationId) {
        super(correlationId);
        this.pattern = pattern;
        this.eventType = 'PatternLearned';
    }
}
export class PatternLearningFailed extends DomainEvent {
    constructor(reason, messageType, correlationId) {
        super(correlationId);
        this.reason = reason;
        this.messageType = messageType;
        this.eventType = 'PatternLearningFailed';
    }
}
// Pattern Execution Events
export class AutomationPatternMatched extends DomainEvent {
    constructor(pattern, request, confidence, correlationId) {
        super(correlationId);
        this.pattern = pattern;
        this.request = request;
        this.confidence = confidence;
        this.eventType = 'AutomationPatternMatched';
    }
}
export class AutomationPatternExecuted extends DomainEvent {
    constructor(patternId, executionResult, correlationId) {
        super(correlationId);
        this.patternId = patternId;
        this.executionResult = executionResult;
        this.eventType = 'AutomationPatternExecuted';
    }
}
export class PatternExecutionFailed extends DomainEvent {
    constructor(patternId, reason, correlationId) {
        super(correlationId);
        this.patternId = patternId;
        this.reason = reason;
        this.eventType = 'PatternExecutionFailed';
    }
}
// Training Session Events
export class TrainingSessionStarted extends DomainEvent {
    constructor(sessionId, website, correlationId) {
        super(correlationId);
        this.sessionId = sessionId;
        this.website = website;
        this.eventType = 'TrainingSessionStarted';
    }
}
export class TrainingSessionEnded extends DomainEvent {
    constructor(sessionId, duration, patternsLearned, correlationId) {
        super(correlationId);
        this.sessionId = sessionId;
        this.duration = duration;
        this.patternsLearned = patternsLearned;
        this.eventType = 'TrainingSessionEnded';
    }
}
// User Guidance Events
export class UserGuidanceDisplayed extends DomainEvent {
    constructor(guidance, correlationId) {
        super(correlationId);
        this.guidance = guidance;
        this.eventType = 'UserGuidanceDisplayed';
    }
}
export class UserActionConfirmed extends DomainEvent {
    constructor(action, elementSelector, correlationId) {
        super(correlationId);
        this.action = action;
        this.elementSelector = elementSelector;
        this.eventType = 'UserActionConfirmed';
    }
}
export class UserActionCancelled extends DomainEvent {
    constructor(action, reason, correlationId) {
        super(correlationId);
        this.action = action;
        this.reason = reason;
        this.eventType = 'UserActionCancelled';
    }
}
