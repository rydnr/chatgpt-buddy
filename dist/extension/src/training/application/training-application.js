"use strict";
// TypeScript-EDA Training Application
// Application layer - orchestrates training system with @Enable decorators
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
exports.trainingApplication = exports.ChatGPTBuddyTrainingApplication = void 0;
const typescript_eda_1 = require("typescript-eda");
const training_session_1 = require("../domain/entities/training-session");
const automation_pattern_1 = require("../domain/entities/automation-pattern");
const ui_overlay_adapter_1 = require("../infrastructure/ui-overlay-adapter");
const pattern_storage_adapter_1 = require("../infrastructure/pattern-storage-adapter");
const pattern_matching_adapter_1 = require("../infrastructure/pattern-matching-adapter");
const training_events_1 = require("../domain/events/training-events");
let ChatGPTBuddyTrainingApplication = class ChatGPTBuddyTrainingApplication extends typescript_eda_1.Application {
    constructor() {
        super();
        this.metadata = new Map([
            ['name', 'ChatGPTBuddyTraining'],
            ['description', 'Interactive training system for automation learning'],
            ['version', '2.1.0'],
            ['domain-entities', [training_session_1.TrainingSession, automation_pattern_1.AutomationPattern]],
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
        this.uiAdapter = new ui_overlay_adapter_1.UIOverlayAdapter();
        this.storageAdapter = new pattern_storage_adapter_1.PatternStorageAdapter();
        this.matchingAdapter = new pattern_matching_adapter_1.PatternMatchingAdapter(this.storageAdapter);
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
            return new training_events_1.PatternExecutionFailed('no-pattern', 'Training mode inactive and no matching patterns found', this.generateCorrelationId());
        }
        catch (error) {
            console.error('Error handling automation request:', error);
            return new training_events_1.PatternExecutionFailed('error', `Application error: ${error.message}`, this.generateCorrelationId());
        }
    }
    async enableTrainingMode(website) {
        this.updateLastActivity();
        try {
            // Create new training session
            const sessionId = this.generateSessionId();
            const session = new training_session_1.TrainingSession(sessionId);
            // Enable training mode
            const trainingEvent = new training_events_1.TrainingModeRequested(website, this.generateCorrelationId());
            const result = await session.enableTrainingMode(trainingEvent);
            if (result instanceof training_events_1.TrainingModeEnabled) {
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
            return new training_events_1.TrainingModeDisabled('error', `Failed to enable training mode: ${error.message}`, this.generateCorrelationId());
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
        const elementSelectionEvent = new training_events_1.ElementSelectionRequested(request.messageType, this.extractElementDescription(request), request.context, this.generateCorrelationId());
        // Request element selection from training session
        const guidanceEvent = await this.state.currentSession.requestElementSelection(elementSelectionEvent);
        // Show UI guidance
        await this.uiAdapter.showGuidance(guidanceEvent.guidance);
        return elementSelectionEvent;
    }
    async executeMatchedPattern(matchedEvent) {
        try {
            // Create AutomationPattern entity
            const patternEntity = new automation_pattern_1.AutomationPattern(matchedEvent.pattern);
            // Execute the pattern
            const result = await patternEntity.executePattern(matchedEvent);
            // Update pattern statistics
            if (result instanceof training_events_1.AutomationPatternExecuted) {
                await this.matchingAdapter.updatePatternStatistics(matchedEvent.pattern.id, result.executionResult);
            }
            return result;
        }
        catch (error) {
            console.error('Pattern execution failed:', error);
            return new training_events_1.PatternExecutionFailed(matchedEvent.pattern.id, `Execution failed: ${error.message}`, matchedEvent.correlationId);
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
            const elementSelectedEvent = new training_events_1.ElementSelected(element, selector, 'unknown', // Will be determined from context
            this.getCurrentContext(), this.generateCorrelationId());
            // Process element selection through training session
            const result = await this.state.currentSession.learnPattern(elementSelectedEvent);
            if (result instanceof training_events_1.PatternLearned) {
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
        const confirmationEvent = new training_events_1.UserActionConfirmed(action, selector, this.generateCorrelationId());
        await this.state.currentSession.handleUserConfirmation(confirmationEvent);
        await this.uiAdapter.hideGuidance();
    }
    async handleUserCancellation(action, reason) {
        if (!this.state.currentSession)
            return;
        const cancellationEvent = new training_events_1.UserActionCancelled(action, reason, this.generateCorrelationId());
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
exports.ChatGPTBuddyTrainingApplication = ChatGPTBuddyTrainingApplication;
exports.ChatGPTBuddyTrainingApplication = ChatGPTBuddyTrainingApplication = __decorate([
    (0, typescript_eda_1.Enable)(ui_overlay_adapter_1.UIOverlayAdapter),
    (0, typescript_eda_1.Enable)(pattern_storage_adapter_1.PatternStorageAdapter),
    (0, typescript_eda_1.Enable)(pattern_matching_adapter_1.PatternMatchingAdapter),
    (0, typescript_eda_1.Enable)(training_session_1.TrainingSession),
    (0, typescript_eda_1.Enable)(automation_pattern_1.AutomationPattern),
    __metadata("design:paramtypes", [])
], ChatGPTBuddyTrainingApplication);
// Export singleton instance for use in browser extension
exports.trainingApplication = new ChatGPTBuddyTrainingApplication();
//# sourceMappingURL=training-application.js.map