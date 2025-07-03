import { BaseEvent, AutomationEvent } from './base';
/**
 * Event triggered when user/system requests automation for a specific action
 * This is the starting point of the learning loop
 */
export declare class AutomationRequestedEvent extends BaseEvent implements AutomationEvent {
    readonly payload: {
        action: string;
        parameters: Record<string, any>;
        context?: Record<string, any>;
        expectedOutcome?: string;
    };
    readonly learningContext?: {
        isFirstTime: boolean;
        hasStoredImplementation: boolean;
        implementationId?: string;
        userGuidanceRequired?: boolean;
    } | undefined;
    readonly type = "automationRequested";
    readonly eventType: "request";
    constructor(payload: {
        action: string;
        parameters: Record<string, any>;
        context?: Record<string, any>;
        expectedOutcome?: string;
    }, correlationId?: string, website?: string, tabId?: number, learningContext?: {
        isFirstTime: boolean;
        hasStoredImplementation: boolean;
        implementationId?: string;
        userGuidanceRequired?: boolean;
    } | undefined);
}
/**
 * Event triggered when user provides implementation through recording
 * Contains the Playwright script and metadata about the implementation
 */
export declare class AutomationImplementedEvent extends BaseEvent implements AutomationEvent {
    readonly payload: {
        requestEventId: string;
        action: string;
        playwrightScript: string;
        templatedScript: string;
        metadata: {
            recordedAt: Date;
            websiteUrl: string;
            recordingDuration: number;
            stepCount: number;
            elements: Array<{
                selector: string;
                action: string;
                value?: string;
                timestamp: number;
            }>;
            screenshots?: string[];
        };
        testCases?: Array<{
            input: Record<string, any>;
            expectedOutcome: string;
            validation?: string;
        }>;
    };
    readonly learningContext?: {
        isFirstTime: boolean;
        hasStoredImplementation: boolean;
        implementationId?: string;
        userGuidanceRequired?: boolean;
    } | undefined;
    readonly type = "automationImplemented";
    readonly eventType: "implementation";
    constructor(payload: {
        requestEventId: string;
        action: string;
        playwrightScript: string;
        templatedScript: string;
        metadata: {
            recordedAt: Date;
            websiteUrl: string;
            recordingDuration: number;
            stepCount: number;
            elements: Array<{
                selector: string;
                action: string;
                value?: string;
                timestamp: number;
            }>;
            screenshots?: string[];
        };
        testCases?: Array<{
            input: Record<string, any>;
            expectedOutcome: string;
            validation?: string;
        }>;
    }, correlationId?: string, website?: string, tabId?: number, learningContext?: {
        isFirstTime: boolean;
        hasStoredImplementation: boolean;
        implementationId?: string;
        userGuidanceRequired?: boolean;
    } | undefined);
}
/**
 * Event triggered when automation executes successfully
 */
export declare class AutomationSucceededEvent extends BaseEvent implements AutomationEvent {
    readonly payload: {
        requestEventId: string;
        implementationId: string;
        action: string;
        executionTime: number;
        result: Record<string, any>;
        screenshots?: string[];
        performanceMetrics?: {
            domLoadTime: number;
            scriptExecutionTime: number;
            networkRequests: number;
        };
    };
    readonly learningContext?: {
        isFirstTime: boolean;
        hasStoredImplementation: boolean;
        implementationId?: string;
        userGuidanceRequired?: boolean;
    } | undefined;
    readonly type = "automationSucceeded";
    readonly eventType: "success";
    constructor(payload: {
        requestEventId: string;
        implementationId: string;
        action: string;
        executionTime: number;
        result: Record<string, any>;
        screenshots?: string[];
        performanceMetrics?: {
            domLoadTime: number;
            scriptExecutionTime: number;
            networkRequests: number;
        };
    }, correlationId?: string, website?: string, tabId?: number, learningContext?: {
        isFirstTime: boolean;
        hasStoredImplementation: boolean;
        implementationId?: string;
        userGuidanceRequired?: boolean;
    } | undefined);
}
/**
 * Event triggered when automation fails to execute
 */
export declare class AutomationFailedEvent extends BaseEvent implements AutomationEvent {
    readonly payload: {
        requestEventId: string;
        implementationId?: string;
        action: string;
        error: {
            type: string;
            message: string;
            step?: number;
            selector?: string;
            stackTrace?: string;
        };
        screenshots?: string[];
        suggestions?: string[];
        retryRecommended: boolean;
        reRecordingRecommended: boolean;
    };
    readonly learningContext?: {
        isFirstTime: boolean;
        hasStoredImplementation: boolean;
        implementationId?: string;
        userGuidanceRequired?: boolean;
    } | undefined;
    readonly type = "automationFailed";
    readonly eventType: "failure";
    constructor(payload: {
        requestEventId: string;
        implementationId?: string;
        action: string;
        error: {
            type: string;
            message: string;
            step?: number;
            selector?: string;
            stackTrace?: string;
        };
        screenshots?: string[];
        suggestions?: string[];
        retryRecommended: boolean;
        reRecordingRecommended: boolean;
    }, correlationId?: string, website?: string, tabId?: number, learningContext?: {
        isFirstTime: boolean;
        hasStoredImplementation: boolean;
        implementationId?: string;
        userGuidanceRequired?: boolean;
    } | undefined);
}
/**
 * Event for requesting user interaction/guidance during automation learning
 */
export declare class UserGuidanceRequestedEvent extends BaseEvent {
    readonly payload: {
        requestEventId: string;
        guidanceType: 'record' | 'review' | 'approve' | 'fix' | 'choose';
        prompt: string;
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
        timeoutMs?: number;
    };
    readonly type = "userGuidanceRequested";
    constructor(payload: {
        requestEventId: string;
        guidanceType: 'record' | 'review' | 'approve' | 'fix' | 'choose';
        prompt: string;
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
        timeoutMs?: number;
    }, correlationId?: string, website?: string, tabId?: number);
}
/**
 * Event sent when user provides guidance/response
 */
export declare class UserGuidanceProvidedEvent extends BaseEvent {
    readonly payload: {
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
    };
    readonly type = "userGuidanceProvided";
    constructor(payload: {
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
    }, correlationId?: string, website?: string, tabId?: number);
}
/**
 * Utility functions for creating automation events
 */
export declare class AutomationEventFactory {
    static createSearchRequest(query: string, website: string, context?: Record<string, any>): AutomationRequestedEvent;
    static createLoginRequest(credentials: {
        username: string;
        password?: string;
    }, website: string, context?: Record<string, any>): AutomationRequestedEvent;
    static createFormSubmissionRequest(formData: Record<string, any>, website: string, context?: Record<string, any>): AutomationRequestedEvent;
}
//# sourceMappingURL=automation.d.ts.map