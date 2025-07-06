"use strict";
// TypeScript-EDA Training Domain Events
// Following Domain-Driven Design and Event-Driven Architecture principles
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserActionCancelled = exports.UserActionConfirmed = exports.UserGuidanceDisplayed = exports.TrainingSessionEnded = exports.TrainingSessionStarted = exports.PatternExecutionFailed = exports.AutomationPatternExecuted = exports.AutomationPatternMatched = exports.PatternLearningFailed = exports.PatternLearned = exports.PatternLearningRequested = exports.ElementSelectionFailed = exports.ElementSelected = exports.ElementSelectionRequested = exports.TrainingModeDisabled = exports.TrainingModeEnabled = exports.TrainingModeRequested = exports.DomainEvent = void 0;
class DomainEvent {
    constructor(correlationId) {
        this.id = `${this.constructor.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.timestamp = new Date();
        this.correlationId = correlationId;
    }
}
exports.DomainEvent = DomainEvent;
// Training Mode Events
class TrainingModeRequested extends DomainEvent {
    constructor(website, correlationId) {
        super(correlationId);
        this.website = website;
        this.eventType = 'TrainingModeRequested';
    }
}
exports.TrainingModeRequested = TrainingModeRequested;
class TrainingModeEnabled extends DomainEvent {
    constructor(sessionId, website, correlationId) {
        super(correlationId);
        this.sessionId = sessionId;
        this.website = website;
        this.eventType = 'TrainingModeEnabled';
    }
}
exports.TrainingModeEnabled = TrainingModeEnabled;
class TrainingModeDisabled extends DomainEvent {
    constructor(sessionId, reason, correlationId) {
        super(correlationId);
        this.sessionId = sessionId;
        this.reason = reason;
        this.eventType = 'TrainingModeDisabled';
    }
}
exports.TrainingModeDisabled = TrainingModeDisabled;
// Element Selection Events
class ElementSelectionRequested extends DomainEvent {
    constructor(messageType, elementDescription, context, correlationId) {
        super(correlationId);
        this.messageType = messageType;
        this.elementDescription = elementDescription;
        this.context = context;
        this.eventType = 'ElementSelectionRequested';
    }
}
exports.ElementSelectionRequested = ElementSelectionRequested;
class ElementSelected extends DomainEvent {
    constructor(element, selector, messageType, context, correlationId) {
        super(correlationId);
        this.element = element;
        this.selector = selector;
        this.messageType = messageType;
        this.context = context;
        this.eventType = 'ElementSelected';
    }
}
exports.ElementSelected = ElementSelected;
class ElementSelectionFailed extends DomainEvent {
    constructor(reason, messageType, correlationId) {
        super(correlationId);
        this.reason = reason;
        this.messageType = messageType;
        this.eventType = 'ElementSelectionFailed';
    }
}
exports.ElementSelectionFailed = ElementSelectionFailed;
// Pattern Learning Events
class PatternLearningRequested extends DomainEvent {
    constructor(messageType, payload, selector, context, correlationId) {
        super(correlationId);
        this.messageType = messageType;
        this.payload = payload;
        this.selector = selector;
        this.context = context;
        this.eventType = 'PatternLearningRequested';
    }
}
exports.PatternLearningRequested = PatternLearningRequested;
class PatternLearned extends DomainEvent {
    constructor(pattern, correlationId) {
        super(correlationId);
        this.pattern = pattern;
        this.eventType = 'PatternLearned';
    }
}
exports.PatternLearned = PatternLearned;
class PatternLearningFailed extends DomainEvent {
    constructor(reason, messageType, correlationId) {
        super(correlationId);
        this.reason = reason;
        this.messageType = messageType;
        this.eventType = 'PatternLearningFailed';
    }
}
exports.PatternLearningFailed = PatternLearningFailed;
// Pattern Execution Events
class AutomationPatternMatched extends DomainEvent {
    constructor(pattern, request, confidence, correlationId) {
        super(correlationId);
        this.pattern = pattern;
        this.request = request;
        this.confidence = confidence;
        this.eventType = 'AutomationPatternMatched';
    }
}
exports.AutomationPatternMatched = AutomationPatternMatched;
class AutomationPatternExecuted extends DomainEvent {
    constructor(patternId, executionResult, correlationId) {
        super(correlationId);
        this.patternId = patternId;
        this.executionResult = executionResult;
        this.eventType = 'AutomationPatternExecuted';
    }
}
exports.AutomationPatternExecuted = AutomationPatternExecuted;
class PatternExecutionFailed extends DomainEvent {
    constructor(patternId, reason, correlationId) {
        super(correlationId);
        this.patternId = patternId;
        this.reason = reason;
        this.eventType = 'PatternExecutionFailed';
    }
}
exports.PatternExecutionFailed = PatternExecutionFailed;
// Training Session Events
class TrainingSessionStarted extends DomainEvent {
    constructor(sessionId, website, correlationId) {
        super(correlationId);
        this.sessionId = sessionId;
        this.website = website;
        this.eventType = 'TrainingSessionStarted';
    }
}
exports.TrainingSessionStarted = TrainingSessionStarted;
class TrainingSessionEnded extends DomainEvent {
    constructor(sessionId, duration, patternsLearned, correlationId) {
        super(correlationId);
        this.sessionId = sessionId;
        this.duration = duration;
        this.patternsLearned = patternsLearned;
        this.eventType = 'TrainingSessionEnded';
    }
}
exports.TrainingSessionEnded = TrainingSessionEnded;
// User Guidance Events
class UserGuidanceDisplayed extends DomainEvent {
    constructor(guidance, correlationId) {
        super(correlationId);
        this.guidance = guidance;
        this.eventType = 'UserGuidanceDisplayed';
    }
}
exports.UserGuidanceDisplayed = UserGuidanceDisplayed;
class UserActionConfirmed extends DomainEvent {
    constructor(action, elementSelector, correlationId) {
        super(correlationId);
        this.action = action;
        this.elementSelector = elementSelector;
        this.eventType = 'UserActionConfirmed';
    }
}
exports.UserActionConfirmed = UserActionConfirmed;
class UserActionCancelled extends DomainEvent {
    constructor(action, reason, correlationId) {
        super(correlationId);
        this.action = action;
        this.reason = reason;
        this.eventType = 'UserActionCancelled';
    }
}
exports.UserActionCancelled = UserActionCancelled;
//# sourceMappingURL=training-events.js.map