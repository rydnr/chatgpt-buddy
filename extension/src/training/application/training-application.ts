// TypeScript-EDA Training Application
// Application layer - orchestrates training system with @Enable decorators

import { Application, Enable } from 'typescript-eda';
import { TrainingSession } from '../domain/entities/training-session';
import { AutomationPattern } from '../domain/entities/automation-pattern';
import { UIOverlayAdapter } from '../infrastructure/ui-overlay-adapter';
import { PatternStorageAdapter } from '../infrastructure/pattern-storage-adapter';
import { PatternMatchingAdapter } from '../infrastructure/pattern-matching-adapter';
import {
  TrainingModeRequested,
  TrainingModeEnabled,
  TrainingModeDisabled,
  ElementSelectionRequested,
  ElementSelected,
  ElementSelectionFailed,
  PatternLearningRequested,
  PatternLearned,
  PatternLearningFailed,
  AutomationPatternMatched,
  AutomationPatternExecuted,
  PatternExecutionFailed,
  TrainingSessionStarted,
  TrainingSessionEnded,
  UserGuidanceDisplayed,
  UserActionConfirmed,
  UserActionCancelled,
  AutomationRequest,
  ExecutionContext,
  AutomationPatternData
} from '../domain/events/training-events';

export interface TrainingApplicationState {
  readonly isInitialized: boolean;
  readonly currentSession: TrainingSession | null;
  readonly trainingMode: 'inactive' | 'training' | 'automatic';
  readonly totalPatterns: number;
  readonly lastActivity: Date | null;
}

@Enable(UIOverlayAdapter)
@Enable(PatternStorageAdapter)
@Enable(PatternMatchingAdapter)
@Enable(TrainingSession)
@Enable(AutomationPattern)
export class ChatGPTBuddyTrainingApplication extends Application {
  public readonly metadata = new Map<string, unknown>([
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

  private state: TrainingApplicationState;
  private uiAdapter: UIOverlayAdapter;
  private storageAdapter: PatternStorageAdapter;
  private matchingAdapter: PatternMatchingAdapter;
  private currentSessionId: string | null = null;

  constructor() {
    super();
    
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

  public async start(): Promise<void> {
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

    } catch (error) {
      console.error('Failed to start training application:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
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

  public async handleAutomationRequest(request: AutomationRequest): Promise<AutomationPatternExecuted | ElementSelectionRequested | PatternExecutionFailed> {
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
      return new PatternExecutionFailed(
        'no-pattern',
        'Training mode inactive and no matching patterns found',
        this.generateCorrelationId()
      );

    } catch (error) {
      console.error('Error handling automation request:', error);
      return new PatternExecutionFailed(
        'error',
        `Application error: ${error.message}`,
        this.generateCorrelationId()
      );
    }
  }

  public async enableTrainingMode(website: string): Promise<TrainingModeEnabled | TrainingModeDisabled> {
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

    } catch (error) {
      console.error('Failed to enable training mode:', error);
      return new TrainingModeDisabled(
        'error',
        `Failed to enable training mode: ${error.message}`,
        this.generateCorrelationId()
      );
    }
  }

  public async disableTrainingMode(reason: string = 'User requested'): Promise<TrainingSessionEnded | null> {
    this.updateLastActivity();

    if (!this.state.currentSession) {
      return null;
    }

    try {
      // End current session
      const endedEvent = await this.state.currentSession.endTrainingSession(
        reason,
        this.generateCorrelationId()
      );

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

    } catch (error) {
      console.error('Failed to disable training mode:', error);
      return null;
    }
  }

  public async switchToAutomaticMode(): Promise<void> {
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

  public async getPatternStatistics(): Promise<{
    totalPatterns: number;
    patternsByWebsite: Record<string, number>;
    patternsByType: Record<string, number>;
    averageConfidence: number;
    successRate: number;
  }> {
    return await this.storageAdapter.getPatternStatistics();
  }

  public async cleanupStalePatterns(maxAgeInDays: number = 30): Promise<number> {
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

  public async exportPatterns(): Promise<AutomationPatternData[]> {
    return await this.storageAdapter.exportPatterns();
  }

  public async importPatterns(patterns: AutomationPatternData[]): Promise<void> {
    await this.storageAdapter.importPatterns(patterns);
    
    const stats = await this.getPatternStatistics();
    this.state = {
      ...this.state,
      totalPatterns: stats.totalPatterns
    };
  }

  // State getters

  public getState(): TrainingApplicationState {
    return { ...this.state };
  }

  public isTrainingMode(): boolean {
    return this.state.trainingMode === 'training';
  }

  public isAutomaticMode(): boolean {
    return this.state.trainingMode === 'automatic';
  }

  public getCurrentSession(): TrainingSession | null {
    return this.state.currentSession;
  }

  // Private methods

  private async requestElementSelection(request: AutomationRequest): Promise<ElementSelectionRequested> {
    if (!this.state.currentSession) {
      throw new Error('No active training session');
    }

    const elementSelectionEvent = new ElementSelectionRequested(
      request.messageType,
      this.extractElementDescription(request),
      request.context,
      this.generateCorrelationId()
    );

    // Request element selection from training session
    const guidanceEvent = await this.state.currentSession.requestElementSelection(elementSelectionEvent);
    
    // Show UI guidance
    await this.uiAdapter.showGuidance(guidanceEvent.guidance);

    return elementSelectionEvent;
  }

  private async executeMatchedPattern(matchedEvent: AutomationPatternMatched): Promise<AutomationPatternExecuted | PatternExecutionFailed> {
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

    } catch (error) {
      console.error('Pattern execution failed:', error);
      return new PatternExecutionFailed(
        matchedEvent.pattern.id,
        `Execution failed: ${error.message}`,
        matchedEvent.correlationId
      );
    }
  }

  private setupAdapterHandlers(): void {
    // UI adapter event handlers
    this.uiAdapter.onElementSelectionEvent(async (element: Element, selector: string) => {
      if (this.state.currentSession) {
        await this.handleElementSelection(element, selector);
      }
    });

    this.uiAdapter.onUserConfirmationEvent(async (action: string, selector: string) => {
      if (this.state.currentSession) {
        await this.handleUserConfirmation(action, selector);
      }
    });

    this.uiAdapter.onUserCancellationEvent(async (action: string, reason: string) => {
      if (this.state.currentSession) {
        await this.handleUserCancellation(action, reason);
      }
    });
  }

  private async handleElementSelection(element: Element, selector: string): Promise<void> {
    if (!this.state.currentSession) return;

    try {
      const elementSelectedEvent = new ElementSelected(
        element,
        selector,
        'unknown', // Will be determined from context
        this.getCurrentContext(),
        this.generateCorrelationId()
      );

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
      } else {
        console.error('Pattern learning failed:', result.reason);
      }

    } catch (error) {
      console.error('Error handling element selection:', error);
    }
  }

  private async handleUserConfirmation(action: string, selector: string): Promise<void> {
    if (!this.state.currentSession) return;

    const confirmationEvent = new UserActionConfirmed(
      action,
      selector,
      this.generateCorrelationId()
    );

    await this.state.currentSession.handleUserConfirmation(confirmationEvent);
    await this.uiAdapter.hideGuidance();
  }

  private async handleUserCancellation(action: string, reason: string): Promise<void> {
    if (!this.state.currentSession) return;

    const cancellationEvent = new UserActionCancelled(
      action,
      reason,
      this.generateCorrelationId()
    );

    await this.state.currentSession.handleUserCancellation(cancellationEvent);
    await this.uiAdapter.hideGuidance();
  }

  private async endCurrentSession(reason: string): Promise<void> {
    if (!this.state.currentSession) return;

    try {
      await this.state.currentSession.endTrainingSession(reason, this.generateCorrelationId());
      this.state = {
        ...this.state,
        currentSession: null
      };
      this.currentSessionId = null;
    } catch (error) {
      console.error('Error ending training session:', error);
    }
  }

  private extractElementDescription(request: AutomationRequest): string {
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

  private getCurrentContext(): ExecutionContext {
    return {
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      title: typeof document !== 'undefined' ? document.title : 'unknown',
      timestamp: new Date(),
      pageStructureHash: this.generatePageStructureHash()
    };
  }

  private generatePageStructureHash(): string {
    if (typeof document === 'undefined') return 'unknown';
    
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

  private updateLastActivity(): void {
    this.state = {
      ...this.state,
      lastActivity: new Date()
    };
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance for use in browser extension
export const trainingApplication = new ChatGPTBuddyTrainingApplication();