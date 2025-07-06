"use strict";
// TypeScript-EDA Training Session Entity
// Following Domain-Driven Design and Event-Driven Architecture principles
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingSession = void 0;
const typescript_eda_1 = require("typescript-eda");
const training_events_1 = require("../events/training-events");
class TrainingSession extends typescript_eda_1.Entity {
    constructor(sessionId) {
        super();
        this.state = {
            id: sessionId,
            website: '',
            mode: 'inactive',
            startedAt: null,
            endedAt: null,
            isActive: false,
            currentContext: null,
            learnedPatterns: [],
            activeGuidance: null
        };
    }
    // Getters for accessing state
    get id() { return this.state.id; }
    get website() { return this.state.website; }
    get mode() { return this.state.mode; }
    get isActive() { return this.state.isActive; }
    get learnedPatterns() { return [...this.state.learnedPatterns]; }
    get currentContext() { return this.state.currentContext; }
    async enableTrainingMode(event) {
        try {
            if (this.state.isActive) {
                return new training_events_1.TrainingModeDisabled(this.state.id, 'Training mode already active', event.correlationId);
            }
            // Update state to training mode
            this.state = {
                ...this.state,
                website: event.website,
                mode: 'training',
                startedAt: new Date(),
                isActive: true,
                currentContext: this.createCurrentContext(),
                endedAt: null
            };
            // Emit session started event
            await this.emitEvent(new training_events_1.TrainingSessionStarted(this.state.id, event.website, event.correlationId));
            return new training_events_1.TrainingModeEnabled(this.state.id, event.website, event.correlationId);
        }
        catch (error) {
            return new training_events_1.TrainingModeDisabled(this.state.id, `Failed to enable training mode: ${error.message}`, event.correlationId);
        }
    }
    async requestElementSelection(event) {
        if (!this.state.isActive) {
            throw new Error('Training session not active');
        }
        // Generate user guidance for element selection
        const guidance = {
            messageType: event.messageType,
            elementDescription: event.elementDescription,
            instructions: this.generateInstructions(event),
            overlayType: 'prompt'
        };
        // Update state with active guidance
        this.state = {
            ...this.state,
            activeGuidance: guidance,
            currentContext: event.context
        };
        return new training_events_1.UserGuidanceDisplayed(guidance, event.correlationId);
    }
    async learnPattern(event) {
        try {
            if (!this.state.isActive) {
                throw new Error('Training session not active');
            }
            // Create automation pattern from selected element
            const pattern = {
                id: this.generatePatternId(),
                messageType: event.messageType,
                payload: this.extractPayloadFromContext(event),
                selector: event.selector,
                context: event.context,
                confidence: 1.0,
                usageCount: 0,
                successfulExecutions: 0
            };
            // Add pattern to learned patterns
            this.state = {
                ...this.state,
                learnedPatterns: [...this.state.learnedPatterns, pattern],
                activeGuidance: null // Clear active guidance
            };
            return new training_events_1.PatternLearned(pattern, event.correlationId);
        }
        catch (error) {
            return new training_events_1.PatternLearningFailed(`Failed to learn pattern: ${error.message}`, event.messageType, event.correlationId);
        }
    }
    async handleUserConfirmation(event) {
        if (!this.state.isActive || !this.state.activeGuidance) {
            throw new Error('No active guidance to confirm');
        }
        // Create pattern learning request based on confirmed action
        return new training_events_1.PatternLearningRequested(this.state.activeGuidance.messageType, this.extractPayloadFromGuidance(this.state.activeGuidance), event.elementSelector, this.state.currentContext, event.correlationId);
    }
    async handleUserCancellation(event) {
        // Clear active guidance on cancellation
        this.state = {
            ...this.state,
            activeGuidance: null
        };
    }
    async endTrainingSession(reason, correlationId) {
        if (!this.state.isActive) {
            throw new Error('Training session not active');
        }
        const endTime = new Date();
        const duration = this.state.startedAt
            ? endTime.getTime() - this.state.startedAt.getTime()
            : 0;
        // Update state to inactive
        this.state = {
            ...this.state,
            mode: 'inactive',
            isActive: false,
            endedAt: endTime,
            activeGuidance: null
        };
        return new training_events_1.TrainingSessionEnded(this.state.id, duration, this.state.learnedPatterns.length, correlationId);
    }
    // Domain logic methods
    generateInstructions(event) {
        switch (event.messageType) {
            case 'FillTextRequested':
                return `Please click on the "${event.elementDescription}" input field where you want to enter text.`;
            case 'ClickElementRequested':
                return `Please click on the "${event.elementDescription}" button or element you want to interact with.`;
            case 'SelectProjectRequested':
                return `Please click on the "${event.elementDescription}" project to select it.`;
            case 'SelectChatRequested':
                return `Please click on the "${event.elementDescription}" chat conversation to open it.`;
            default:
                return `Please click on the "${event.elementDescription}" element you want to automate.`;
        }
    }
    extractPayloadFromContext(event) {
        // Extract relevant payload information based on the message type and context
        const basePayload = {
            element: this.extractElementDescriptionFromContext(event.context),
            selector: event.selector
        };
        switch (event.messageType) {
            case 'FillTextRequested':
                return {
                    ...basePayload,
                    value: this.extractValueFromContext(event.context)
                };
            case 'SelectProjectRequested':
                return {
                    ...basePayload,
                    projectName: this.extractProjectNameFromContext(event.context)
                };
            case 'SelectChatRequested':
                return {
                    ...basePayload,
                    chatTitle: this.extractChatTitleFromContext(event.context)
                };
            default:
                return basePayload;
        }
    }
    extractPayloadFromGuidance(guidance) {
        return {
            element: guidance.elementDescription,
            description: guidance.instructions
        };
    }
    extractElementDescriptionFromContext(context) {
        // Extract element description from URL or title context
        if (context.pathname.includes('chat')) {
            return 'Chat Element';
        }
        else if (context.pathname.includes('project')) {
            return 'Project Element';
        }
        else {
            return 'Page Element';
        }
    }
    extractValueFromContext(context) {
        // This would typically come from the original request context
        // For now, return a placeholder
        return '';
    }
    extractProjectNameFromContext(context) {
        // Extract project name from URL or context
        const pathSegments = context.pathname.split('/');
        const projectIndex = pathSegments.indexOf('project');
        if (projectIndex >= 0 && projectIndex < pathSegments.length - 1) {
            return pathSegments[projectIndex + 1];
        }
        return 'Unknown Project';
    }
    extractChatTitleFromContext(context) {
        // Extract chat title from page title or URL
        if (context.title.includes('Chat')) {
            return context.title;
        }
        return 'Unknown Chat';
    }
    createCurrentContext() {
        return {
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
            pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
            title: typeof document !== 'undefined' ? document.title : 'unknown',
            timestamp: new Date(),
            pageStructureHash: this.generatePageStructureHash()
        };
    }
    generatePageStructureHash() {
        // Simple page structure hash based on DOM elements
        if (typeof document === 'undefined')
            return 'unknown';
        const elements = document.querySelectorAll('div, input, button, a');
        const structure = Array.from(elements)
            .slice(0, 20) // Limit to first 20 elements for performance
            .map(el => `${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''}`)
            .join('|');
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < structure.length; i++) {
            const char = structure.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    generatePatternId() {
        return `pattern-${this.state.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    async emitEvent(event) {
        // In a real TypeScript-EDA implementation, this would emit the event
        // to the event bus. For now, this is a placeholder.
        console.log('Emitting event:', event.eventType, event);
    }
}
exports.TrainingSession = TrainingSession;
__decorate([
    (0, typescript_eda_1.listen)(training_events_1.TrainingModeRequested),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_events_1.TrainingModeRequested]),
    __metadata("design:returntype", Promise)
], TrainingSession.prototype, "enableTrainingMode", null);
__decorate([
    (0, typescript_eda_1.listen)(training_events_1.ElementSelectionRequested),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_events_1.ElementSelectionRequested]),
    __metadata("design:returntype", Promise)
], TrainingSession.prototype, "requestElementSelection", null);
__decorate([
    (0, typescript_eda_1.listen)(training_events_1.ElementSelected),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_events_1.ElementSelected]),
    __metadata("design:returntype", Promise)
], TrainingSession.prototype, "learnPattern", null);
__decorate([
    (0, typescript_eda_1.listen)(training_events_1.UserActionConfirmed),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_events_1.UserActionConfirmed]),
    __metadata("design:returntype", Promise)
], TrainingSession.prototype, "handleUserConfirmation", null);
__decorate([
    (0, typescript_eda_1.listen)(training_events_1.UserActionCancelled),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_events_1.UserActionCancelled]),
    __metadata("design:returntype", Promise)
], TrainingSession.prototype, "handleUserCancellation", null);
//# sourceMappingURL=training-session.js.map