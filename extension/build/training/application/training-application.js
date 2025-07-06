// TypeScript-EDA Training Application
// Application layer - orchestrates training system with @Enable decorators
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Application, Enable } from 'typescript-eda';
import { TrainingSession } from '../domain/entities/training-session';
import { AutomationPattern } from '../domain/entities/automation-pattern';
import { UIOverlayAdapter } from '../infrastructure/ui-overlay-adapter';
import { PatternStorageAdapter } from '../infrastructure/pattern-storage-adapter';
import { PatternMatchingAdapter } from '../infrastructure/pattern-matching-adapter';
import { TrainingModeRequested, TrainingModeEnabled, TrainingModeDisabled, ElementSelectionRequested, ElementSelected, PatternLearned, AutomationPatternExecuted, PatternExecutionFailed, UserActionConfirmed, UserActionCancelled } from '../domain/events/training-events';
let ChatGPTBuddyTrainingApplication = (() => {
    let _classDecorators = [Enable(UIOverlayAdapter), Enable(PatternStorageAdapter), Enable(PatternMatchingAdapter), Enable(TrainingSession), Enable(AutomationPattern)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = Application;
    var ChatGPTBuddyTrainingApplication = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.metadata = new Map([
                ['name', 'ChatGPTBuddyTraining'],
                ['description', 'Interactive training system for automation learning'],
                ['version', '2.1.0'],
                ['domain-entities', [TrainingSession, AutomationPattern]],
                ['primary-ports', ['UIOverlayAdapter', 'PatternMatchingAdapter']],
                ['secondary-ports', ['PatternStorageAdapter']],
                ['events', [
                        'TrainingModeRequested',
                        'ElementSelectionRequested',
                        'PatternLearningRequested',
                        'AutomationPatternMatched',
                        'UserActionConfirmed'
                    ]]
            ]);
            this.currentSessionId = null;
            this.state = {
                isInitialized: false,
                currentSession: null,
                trainingMode: 'inactive',
                totalPatterns: 0,
                lastActivity: null
            };
            // Initialize adapters
            this.uiAdapter = new UIOverlayAdapter();
            this.storageAdapter = new PatternStorageAdapter();
            this.matchingAdapter = new PatternMatchingAdapter(this.storageAdapter);
            // Setup adapter event handlers
            this.setupAdapterHandlers();
        }
        // Application lifecycle
        async start() {
            if (this.state.isInitialized) {
                return;
            }
            try {
                // Initialize storage and load patterns
                const patterns = await this.storageAdapter.exportPatterns();
                this.state = {
                    ...this.state,
                    isInitialized: true,
                    totalPatterns: patterns.length,
                    lastActivity: new Date()
                };
                console.log('ChatGPT Buddy Training Application started', {
                    totalPatterns: patterns.length,
                    version: this.metadata.get('version')
                });
            }
            catch (error) {
                console.error('Failed to start training application:', error);
                throw error;
            }
        }
        async stop() {
            if (!this.state.isInitialized) {
                return;
            }
            // End current training session if active
            if (this.state.currentSession) {
                await this.endCurrentSession('Application shutdown');
            }
            // Hide any active UI
            await this.uiAdapter.hideGuidance();
            this.state = {
                ...this.state,
                isInitialized: false,
                currentSession: null,
                trainingMode: 'inactive'
            };
            console.log('ChatGPT Buddy Training Application stopped');
        }
        // Main application event handlers
        async handleAutomationRequest(request) {
            this.updateLastActivity();
            try {
                // Check if we have matching patterns in automatic mode
                if (this.state.trainingMode === 'automatic') {
                    const matchedEvent = await this.matchingAdapter.handleAutomationRequest(request);
                    if (matchedEvent) {
                        return await this.executeMatchedPattern(matchedEvent);
                    }
                }
                // If in training mode or no patterns found, request element selection
                if (this.state.trainingMode === 'training' || this.state.trainingMode === 'automatic') {
                    return await this.requestElementSelection(request);
                }
                // If training is inactive, return failure
                return new PatternExecutionFailed('no-pattern', 'Training mode inactive and no matching patterns found', this.generateCorrelationId());
            }
            catch (error) {
                console.error('Error handling automation request:', error);
                return new PatternExecutionFailed('error', `Application error: ${error.message}`, this.generateCorrelationId());
            }
        }
        async enableTrainingMode(website) {
            this.updateLastActivity();
            try {
                // Create new training session
                const sessionId = this.generateSessionId();
                const session = new TrainingSession(sessionId);
                // Enable training mode
                const trainingEvent = new TrainingModeRequested(website, this.generateCorrelationId());
                const result = await session.enableTrainingMode(trainingEvent);
                if (result instanceof TrainingModeEnabled) {
                    this.state = {
                        ...this.state,
                        currentSession: session,
                        trainingMode: 'training'
                    };
                    this.currentSessionId = sessionId;
                    console.log('Training mode enabled for website:', website);
                }
                return result;
            }
            catch (error) {
                console.error('Failed to enable training mode:', error);
                return new TrainingModeDisabled('error', `Failed to enable training mode: ${error.message}`, this.generateCorrelationId());
            }
        }
        async disableTrainingMode(reason = 'User requested') {
            this.updateLastActivity();
            if (!this.state.currentSession) {
                return null;
            }
            try {
                // End current session
                const endedEvent = await this.state.currentSession.endTrainingSession(reason, this.generateCorrelationId());
                // Update state
                this.state = {
                    ...this.state,
                    currentSession: null,
                    trainingMode: 'automatic' // Switch to automatic mode after training
                };
                this.currentSessionId = null;
                // Hide any active UI
                await this.uiAdapter.hideGuidance();
                console.log('Training mode disabled:', reason);
                return endedEvent;
            }
            catch (error) {
                console.error('Failed to disable training mode:', error);
                return null;
            }
        }
        async switchToAutomaticMode() {
            this.updateLastActivity();
            // End training session if active
            if (this.state.currentSession) {
                await this.endCurrentSession('Switched to automatic mode');
            }
            this.state = {
                ...this.state,
                trainingMode: 'automatic'
            };
            console.log('Switched to automatic mode');
        }
        // Pattern management
        async getPatternStatistics() {
            return await this.storageAdapter.getPatternStatistics();
        }
        async cleanupStalePatterns(maxAgeInDays = 30) {
            const deletedCount = await this.storageAdapter.cleanupStalePatterns(maxAgeInDays);
            if (deletedCount > 0) {
                const stats = await this.getPatternStatistics();
                this.state = {
                    ...this.state,
                    totalPatterns: stats.totalPatterns
                };
            }
            return deletedCount;
        }
        async exportPatterns() {
            return await this.storageAdapter.exportPatterns();
        }
        async importPatterns(patterns) {
            await this.storageAdapter.importPatterns(patterns);
            const stats = await this.getPatternStatistics();
            this.state = {
                ...this.state,
                totalPatterns: stats.totalPatterns
            };
        }
        // State getters
        getState() {
            return { ...this.state };
        }
        isTrainingMode() {
            return this.state.trainingMode === 'training';
        }
        isAutomaticMode() {
            return this.state.trainingMode === 'automatic';
        }
        getCurrentSession() {
            return this.state.currentSession;
        }
        // Private methods
        async requestElementSelection(request) {
            if (!this.state.currentSession) {
                throw new Error('No active training session');
            }
            const elementSelectionEvent = new ElementSelectionRequested(request.messageType, this.extractElementDescription(request), request.context, this.generateCorrelationId());
            // Request element selection from training session
            const guidanceEvent = await this.state.currentSession.requestElementSelection(elementSelectionEvent);
            // Show UI guidance
            await this.uiAdapter.showGuidance(guidanceEvent.guidance);
            return elementSelectionEvent;
        }
        async executeMatchedPattern(matchedEvent) {
            try {
                // Create AutomationPattern entity
                const patternEntity = new AutomationPattern(matchedEvent.pattern);
                // Execute the pattern
                const result = await patternEntity.executePattern(matchedEvent);
                // Update pattern statistics
                if (result instanceof AutomationPatternExecuted) {
                    await this.matchingAdapter.updatePatternStatistics(matchedEvent.pattern.id, result.executionResult);
                }
                return result;
            }
            catch (error) {
                console.error('Pattern execution failed:', error);
                return new PatternExecutionFailed(matchedEvent.pattern.id, `Execution failed: ${error.message}`, matchedEvent.correlationId);
            }
        }
        setupAdapterHandlers() {
            // UI adapter event handlers
            this.uiAdapter.onElementSelectionEvent(async (element, selector) => {
                if (this.state.currentSession) {
                    await this.handleElementSelection(element, selector);
                }
            });
            this.uiAdapter.onUserConfirmationEvent(async (action, selector) => {
                if (this.state.currentSession) {
                    await this.handleUserConfirmation(action, selector);
                }
            });
            this.uiAdapter.onUserCancellationEvent(async (action, reason) => {
                if (this.state.currentSession) {
                    await this.handleUserCancellation(action, reason);
                }
            });
        }
        async handleElementSelection(element, selector) {
            if (!this.state.currentSession)
                return;
            try {
                const elementSelectedEvent = new ElementSelected(element, selector, 'unknown', // Will be determined from context
                this.getCurrentContext(), this.generateCorrelationId());
                // Process element selection through training session
                const result = await this.state.currentSession.learnPattern(elementSelectedEvent);
                if (result instanceof PatternLearned) {
                    // Store the pattern
                    await this.storageAdapter.storePattern(result.pattern);
                    // Update total patterns count
                    const stats = await this.getPatternStatistics();
                    this.state = {
                        ...this.state,
                        totalPatterns: stats.totalPatterns
                    };
                    console.log('Pattern learned and stored:', result.pattern.id);
                }
                else {
                    console.error('Pattern learning failed:', result.reason);
                }
            }
            catch (error) {
                console.error('Error handling element selection:', error);
            }
        }
        async handleUserConfirmation(action, selector) {
            if (!this.state.currentSession)
                return;
            const confirmationEvent = new UserActionConfirmed(action, selector, this.generateCorrelationId());
            await this.state.currentSession.handleUserConfirmation(confirmationEvent);
            await this.uiAdapter.hideGuidance();
        }
        async handleUserCancellation(action, reason) {
            if (!this.state.currentSession)
                return;
            const cancellationEvent = new UserActionCancelled(action, reason, this.generateCorrelationId());
            await this.state.currentSession.handleUserCancellation(cancellationEvent);
            await this.uiAdapter.hideGuidance();
        }
        async endCurrentSession(reason) {
            if (!this.state.currentSession)
                return;
            try {
                await this.state.currentSession.endTrainingSession(reason, this.generateCorrelationId());
                this.state = {
                    ...this.state,
                    currentSession: null
                };
                this.currentSessionId = null;
            }
            catch (error) {
                console.error('Error ending training session:', error);
            }
        }
        extractElementDescription(request) {
            if (request.payload.element) {
                return request.payload.element;
            }
            // Generate description based on message type and context
            switch (request.messageType) {
                case 'FillTextRequested':
                    return 'text input field';
                case 'ClickElementRequested':
                    return 'clickable element';
                case 'SelectProjectRequested':
                    return 'project selector';
                case 'SelectChatRequested':
                    return 'chat selector';
                default:
                    return 'page element';
            }
        }
        getCurrentContext() {
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
            if (typeof document === 'undefined')
                return 'unknown';
            const elements = document.querySelectorAll('div, input, button, a, form');
            const structure = Array.from(elements)
                .slice(0, 25) // Sample first 25 elements
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
        updateLastActivity() {
            this.state = {
                ...this.state,
                lastActivity: new Date()
            };
        }
        generateSessionId() {
            return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        generateCorrelationId() {
            return `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
    };
    __setFunctionName(_classThis, "ChatGPTBuddyTrainingApplication");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatGPTBuddyTrainingApplication = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatGPTBuddyTrainingApplication = _classThis;
})();
export { ChatGPTBuddyTrainingApplication };
// Export singleton instance for use in browser extension
export const trainingApplication = new ChatGPTBuddyTrainingApplication();
