// TypeScript-EDA Training Session Entity
// Following Domain-Driven Design and Event-Driven Architecture principles

import { Entity, listen } from 'typescript-eda';
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
  TrainingSessionStarted,
  TrainingSessionEnded,
  UserGuidanceDisplayed,
  UserActionConfirmed,
  UserActionCancelled,
  ExecutionContext,
  AutomationPatternData,
  UserGuidanceData
} from '../events/training-events';

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

export class TrainingSession extends Entity<TrainingSession> {
  private state: TrainingSessionState;

  constructor(sessionId: string) {
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
  get id(): string { return this.state.id; }
  get website(): string { return this.state.website; }
  get mode(): string { return this.state.mode; }
  get isActive(): boolean { return this.state.isActive; }
  get learnedPatterns(): AutomationPatternData[] { return [...this.state.learnedPatterns]; }
  get currentContext(): ExecutionContext | null { return this.state.currentContext; }

  @listen(TrainingModeRequested)
  public async enableTrainingMode(event: TrainingModeRequested): Promise<TrainingModeEnabled | TrainingModeDisabled> {
    try {
      if (this.state.isActive) {
        return new TrainingModeDisabled(
          this.state.id,
          'Training mode already active',
          event.correlationId
        );
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
      await this.emitEvent(new TrainingSessionStarted(
        this.state.id,
        event.website,
        event.correlationId
      ));

      return new TrainingModeEnabled(
        this.state.id,
        event.website,
        event.correlationId
      );
    } catch (error) {
      return new TrainingModeDisabled(
        this.state.id,
        `Failed to enable training mode: ${error.message}`,
        event.correlationId
      );
    }
  }

  @listen(ElementSelectionRequested)
  public async requestElementSelection(event: ElementSelectionRequested): Promise<UserGuidanceDisplayed> {
    if (!this.state.isActive) {
      throw new Error('Training session not active');
    }

    // Generate user guidance for element selection
    const guidance: UserGuidanceData = {
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

  @listen(ElementSelected)
  public async learnPattern(event: ElementSelected): Promise<PatternLearned | PatternLearningFailed> {
    try {
      if (!this.state.isActive) {
        throw new Error('Training session not active');
      }

      // Create automation pattern from selected element
      const pattern: AutomationPatternData = {
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
    } catch (error) {
      return new PatternLearningFailed(
        `Failed to learn pattern: ${error.message}`,
        event.messageType,
        event.correlationId
      );
    }
  }

  @listen(UserActionConfirmed)
  public async handleUserConfirmation(event: UserActionConfirmed): Promise<PatternLearningRequested> {
    if (!this.state.isActive || !this.state.activeGuidance) {
      throw new Error('No active guidance to confirm');
    }

    // Create pattern learning request based on confirmed action
    return new PatternLearningRequested(
      this.state.activeGuidance.messageType,
      this.extractPayloadFromGuidance(this.state.activeGuidance),
      event.elementSelector,
      this.state.currentContext!,
      event.correlationId
    );
  }

  @listen(UserActionCancelled)
  public async handleUserCancellation(event: UserActionCancelled): Promise<void> {
    // Clear active guidance on cancellation
    this.state = {
      ...this.state,
      activeGuidance: null
    };
  }

  public async endTrainingSession(reason: string, correlationId: string): Promise<TrainingSessionEnded> {
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

    return new TrainingSessionEnded(
      this.state.id,
      duration,
      this.state.learnedPatterns.length,
      correlationId
    );
  }

  // Domain logic methods

  private generateInstructions(event: ElementSelectionRequested): string {
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

  private extractPayloadFromContext(event: ElementSelected): Record<string, any> {
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

  private extractPayloadFromGuidance(guidance: UserGuidanceData): Record<string, any> {
    return {
      element: guidance.elementDescription,
      description: guidance.instructions
    };
  }

  private extractElementDescriptionFromContext(context: ExecutionContext): string {
    // Extract element description from URL or title context
    if (context.pathname.includes('chat')) {
      return 'Chat Element';
    } else if (context.pathname.includes('project')) {
      return 'Project Element';
    } else {
      return 'Page Element';
    }
  }

  private extractValueFromContext(context: ExecutionContext): string {
    // This would typically come from the original request context
    // For now, return a placeholder
    return '';
  }

  private extractProjectNameFromContext(context: ExecutionContext): string {
    // Extract project name from URL or context
    const pathSegments = context.pathname.split('/');
    const projectIndex = pathSegments.indexOf('project');
    if (projectIndex >= 0 && projectIndex < pathSegments.length - 1) {
      return pathSegments[projectIndex + 1];
    }
    return 'Unknown Project';
  }

  private extractChatTitleFromContext(context: ExecutionContext): string {
    // Extract chat title from page title or URL
    if (context.title.includes('Chat')) {
      return context.title;
    }
    return 'Unknown Chat';
  }

  private createCurrentContext(): ExecutionContext {
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
    // Simple page structure hash based on DOM elements
    if (typeof document === 'undefined') return 'unknown';
    
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

  private generatePatternId(): string {
    return `pattern-${this.state.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async emitEvent(event: any): Promise<void> {
    // In a real TypeScript-EDA implementation, this would emit the event
    // to the event bus. For now, this is a placeholder.
    console.log('Emitting event:', event.eventType, event);
  }
}