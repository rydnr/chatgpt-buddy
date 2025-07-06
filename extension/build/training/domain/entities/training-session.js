// TypeScript-EDA Training Session Entity
// Following Domain-Driven Design and Event-Driven Architecture principles
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { Entity, listen } from 'typescript-eda';
import { TrainingModeRequested, TrainingModeEnabled, TrainingModeDisabled, ElementSelectionRequested, ElementSelected, PatternLearningRequested, PatternLearned, PatternLearningFailed, TrainingSessionStarted, TrainingSessionEnded, UserGuidanceDisplayed, UserActionConfirmed, UserActionCancelled } from '../events/training-events';
let TrainingSession = (() => {
    var _a;
    let _classSuper = Entity;
    let _instanceExtraInitializers = [];
    let _enableTrainingMode_decorators;
    let _requestElementSelection_decorators;
    let _learnPattern_decorators;
    let _handleUserConfirmation_decorators;
    let _handleUserCancellation_decorators;
    return _a = class TrainingSession extends _classSuper {
            constructor(sessionId) {
                super();
                this.state = __runInitializers(this, _instanceExtraInitializers);
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
                        return new TrainingModeDisabled(this.state.id, 'Training mode already active', event.correlationId);
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
                    await this.emitEvent(new TrainingSessionStarted(this.state.id, event.website, event.correlationId));
                    return new TrainingModeEnabled(this.state.id, event.website, event.correlationId);
                }
                catch (error) {
                    return new TrainingModeDisabled(this.state.id, `Failed to enable training mode: ${error.message}`, event.correlationId);
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
                return new UserGuidanceDisplayed(guidance, event.correlationId);
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
                    return new PatternLearned(pattern, event.correlationId);
                }
                catch (error) {
                    return new PatternLearningFailed(`Failed to learn pattern: ${error.message}`, event.messageType, event.correlationId);
                }
            }
            async handleUserConfirmation(event) {
                if (!this.state.isActive || !this.state.activeGuidance) {
                    throw new Error('No active guidance to confirm');
                }
                // Create pattern learning request based on confirmed action
                return new PatternLearningRequested(this.state.activeGuidance.messageType, this.extractPayloadFromGuidance(this.state.activeGuidance), event.elementSelector, this.state.currentContext, event.correlationId);
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
                return new TrainingSessionEnded(this.state.id, duration, this.state.learnedPatterns.length, correlationId);
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
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _enableTrainingMode_decorators = [listen(TrainingModeRequested)];
            _requestElementSelection_decorators = [listen(ElementSelectionRequested)];
            _learnPattern_decorators = [listen(ElementSelected)];
            _handleUserConfirmation_decorators = [listen(UserActionConfirmed)];
            _handleUserCancellation_decorators = [listen(UserActionCancelled)];
            __esDecorate(_a, null, _enableTrainingMode_decorators, { kind: "method", name: "enableTrainingMode", static: false, private: false, access: { has: obj => "enableTrainingMode" in obj, get: obj => obj.enableTrainingMode }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _requestElementSelection_decorators, { kind: "method", name: "requestElementSelection", static: false, private: false, access: { has: obj => "requestElementSelection" in obj, get: obj => obj.requestElementSelection }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _learnPattern_decorators, { kind: "method", name: "learnPattern", static: false, private: false, access: { has: obj => "learnPattern" in obj, get: obj => obj.learnPattern }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _handleUserConfirmation_decorators, { kind: "method", name: "handleUserConfirmation", static: false, private: false, access: { has: obj => "handleUserConfirmation" in obj, get: obj => obj.handleUserConfirmation }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _handleUserCancellation_decorators, { kind: "method", name: "handleUserCancellation", static: false, private: false, access: { has: obj => "handleUserCancellation" in obj, get: obj => obj.handleUserCancellation }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { TrainingSession };
