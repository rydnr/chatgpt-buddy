/*
                        Web-Buddy Core - Automation Learning Events

    Copyright (C) 2025-today  rydnr@acm-sl.org

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { BaseEvent, AutomationEvent } from './base';

/**
 * Event triggered when user/system requests automation for a specific action
 * This is the starting point of the learning loop
 */
export class AutomationRequestedEvent extends BaseEvent implements AutomationEvent {
  public readonly type = 'automationRequested';
  public readonly eventType = 'request' as const;
  
  constructor(
    public readonly payload: {
      action: string; // e.g., 'search', 'login', 'submitForm'
      parameters: Record<string, any>; // e.g., { query: 'TypeScript patterns' }
      context?: Record<string, any>; // Additional metadata to help developer
      expectedOutcome?: string; // Description of what should happen
    },
    correlationId?: string,
    website?: string,
    tabId?: number,
    public readonly learningContext?: {
      isFirstTime: boolean;
      hasStoredImplementation: boolean;
      implementationId?: string;
      userGuidanceRequired?: boolean;
    }
  ) {
    super(payload, correlationId, website, tabId);
  }
}

/**
 * Event triggered when user provides implementation through recording
 * Contains the Playwright script and metadata about the implementation
 */
export class AutomationImplementedEvent extends BaseEvent implements AutomationEvent {
  public readonly type = 'automationImplemented';
  public readonly eventType = 'implementation' as const;
  
  constructor(
    public readonly payload: {
      requestEventId: string; // Links back to the original request
      action: string; // Same action as the request
      playwrightScript: string; // Raw recorded script
      templatedScript: string; // Script with payload placeholders
      metadata: {
        recordedAt: Date;
        websiteUrl: string;
        recordingDuration: number; // milliseconds
        stepCount: number;
        elements: Array<{
          selector: string;
          action: string;
          value?: string;
          timestamp: number;
        }>;
        screenshots?: string[]; // Base64 encoded screenshots
      };
      testCases?: Array<{
        input: Record<string, any>;
        expectedOutcome: string;
        validation?: string; // Playwright assertions
      }>;
    },
    correlationId?: string,
    website?: string,
    tabId?: number,
    public readonly learningContext?: {
      isFirstTime: boolean;
      hasStoredImplementation: boolean;
      implementationId?: string;
      userGuidanceRequired?: boolean;
    }
  ) {
    super(payload, correlationId, website, tabId);
  }
}

/**
 * Event triggered when automation executes successfully
 */
export class AutomationSucceededEvent extends BaseEvent implements AutomationEvent {
  public readonly type = 'automationSucceeded';
  public readonly eventType = 'success' as const;
  
  constructor(
    public readonly payload: {
      requestEventId: string;
      implementationId: string;
      action: string;
      executionTime: number; // milliseconds
      result: Record<string, any>; // Actual outcome data
      screenshots?: string[];
      performanceMetrics?: {
        domLoadTime: number;
        scriptExecutionTime: number;
        networkRequests: number;
      };
    },
    correlationId?: string,
    website?: string,
    tabId?: number,
    public readonly learningContext?: {
      isFirstTime: boolean;
      hasStoredImplementation: boolean;
      implementationId?: string;
      userGuidanceRequired?: boolean;
    }
  ) {
    super(payload, correlationId, website, tabId);
  }
}

/**
 * Event triggered when automation fails to execute
 */
export class AutomationFailedEvent extends BaseEvent implements AutomationEvent {
  public readonly type = 'automationFailed';
  public readonly eventType = 'failure' as const;
  
  constructor(
    public readonly payload: {
      requestEventId: string;
      implementationId?: string;
      action: string;
      error: {
        type: string; // 'timeout', 'elementNotFound', 'scriptError', etc.
        message: string;
        step?: number; // Which step in the script failed
        selector?: string; // Which selector caused the issue
        stackTrace?: string;
      };
      screenshots?: string[]; // Screenshots at failure point
      suggestions?: string[]; // Potential fixes or improvements
      retryRecommended: boolean;
      reRecordingRecommended: boolean;
    },
    correlationId?: string,
    website?: string,
    tabId?: number,
    public readonly learningContext?: {
      isFirstTime: boolean;
      hasStoredImplementation: boolean;
      implementationId?: string;
      userGuidanceRequired?: boolean;
    }
  ) {
    super(payload, correlationId, website, tabId);
  }
}

/**
 * Event for requesting user interaction/guidance during automation learning
 */
export class UserGuidanceRequestedEvent extends BaseEvent {
  public readonly type = 'userGuidanceRequested';
  
  constructor(
    public readonly payload: {
      requestEventId: string;
      guidanceType: 'record' | 'review' | 'approve' | 'fix' | 'choose';
      prompt: string; // Human-readable description of what's needed
      options?: Array<{
        id: string;
        label: string;
        description?: string;
        data?: any;
      }>;
      currentState?: {
        url: string;
        screenshot?: string;
        availableElements?: Array<{
          selector: string;
          text: string;
          type: string;
        }>;
      };
      timeoutMs?: number; // How long to wait for user response
    },
    correlationId?: string,
    website?: string,
    tabId?: number
  ) {
    super(payload, correlationId, website, tabId);
  }
}

/**
 * Event sent when user provides guidance/response
 */
export class UserGuidanceProvidedEvent extends BaseEvent {
  public readonly type = 'userGuidanceProvided';
  
  constructor(
    public readonly payload: {
      requestEventId: string;
      guidanceRequestId: string;
      response: {
        action: 'proceed' | 'cancel' | 'modify' | 'reuse' | 'record';
        selectedOptionId?: string;
        modifiedScript?: string;
        feedback?: string;
        userNotes?: string;
      };
      providedAt: Date;
    },
    correlationId?: string,
    website?: string,
    tabId?: number
  ) {
    super(payload, correlationId, website, tabId);
  }
}

/**
 * Utility functions for creating automation events
 */
export class AutomationEventFactory {
  static createSearchRequest(
    query: string,
    website: string,
    context?: Record<string, any>
  ): AutomationRequestedEvent {
    return new AutomationRequestedEvent(
      {
        action: 'search',
        parameters: { query },
        context: {
          searchType: 'web',
          expectedResultCount: 'multiple',
          ...context
        },
        expectedOutcome: `Search for "${query}" and return list of results`
      },
      undefined,
      website
    );
  }
  
  static createLoginRequest(
    credentials: { username: string; password?: string },
    website: string,
    context?: Record<string, any>
  ): AutomationRequestedEvent {
    return new AutomationRequestedEvent(
      {
        action: 'login',
        parameters: credentials,
        context: {
          loginType: 'form',
          expectRedirect: true,
          ...context
        },
        expectedOutcome: 'Successfully log in and redirect to dashboard/main page'
      },
      undefined,
      website
    );
  }
  
  static createFormSubmissionRequest(
    formData: Record<string, any>,
    website: string,
    context?: Record<string, any>
  ): AutomationRequestedEvent {
    return new AutomationRequestedEvent(
      {
        action: 'submitForm',
        parameters: formData,
        context: {
          formType: 'contact',
          expectConfirmation: true,
          ...context
        },
        expectedOutcome: 'Fill form with provided data and submit successfully'
      },
      undefined,
      website
    );
  }
}