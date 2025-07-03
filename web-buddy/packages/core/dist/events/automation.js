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
import { BaseEvent } from './base';
/**
 * Event triggered when user/system requests automation for a specific action
 * This is the starting point of the learning loop
 */
export class AutomationRequestedEvent extends BaseEvent {
    payload;
    learningContext;
    type = 'automationRequested';
    eventType = 'request';
    constructor(payload, correlationId, website, tabId, learningContext) {
        super(payload, correlationId, website, tabId);
        this.payload = payload;
        this.learningContext = learningContext;
    }
}
/**
 * Event triggered when user provides implementation through recording
 * Contains the Playwright script and metadata about the implementation
 */
export class AutomationImplementedEvent extends BaseEvent {
    payload;
    learningContext;
    type = 'automationImplemented';
    eventType = 'implementation';
    constructor(payload, correlationId, website, tabId, learningContext) {
        super(payload, correlationId, website, tabId);
        this.payload = payload;
        this.learningContext = learningContext;
    }
}
/**
 * Event triggered when automation executes successfully
 */
export class AutomationSucceededEvent extends BaseEvent {
    payload;
    learningContext;
    type = 'automationSucceeded';
    eventType = 'success';
    constructor(payload, correlationId, website, tabId, learningContext) {
        super(payload, correlationId, website, tabId);
        this.payload = payload;
        this.learningContext = learningContext;
    }
}
/**
 * Event triggered when automation fails to execute
 */
export class AutomationFailedEvent extends BaseEvent {
    payload;
    learningContext;
    type = 'automationFailed';
    eventType = 'failure';
    constructor(payload, correlationId, website, tabId, learningContext) {
        super(payload, correlationId, website, tabId);
        this.payload = payload;
        this.learningContext = learningContext;
    }
}
/**
 * Event for requesting user interaction/guidance during automation learning
 */
export class UserGuidanceRequestedEvent extends BaseEvent {
    payload;
    type = 'userGuidanceRequested';
    constructor(payload, correlationId, website, tabId) {
        super(payload, correlationId, website, tabId);
        this.payload = payload;
    }
}
/**
 * Event sent when user provides guidance/response
 */
export class UserGuidanceProvidedEvent extends BaseEvent {
    payload;
    type = 'userGuidanceProvided';
    constructor(payload, correlationId, website, tabId) {
        super(payload, correlationId, website, tabId);
        this.payload = payload;
    }
}
/**
 * Utility functions for creating automation events
 */
export class AutomationEventFactory {
    static createSearchRequest(query, website, context) {
        return new AutomationRequestedEvent({
            action: 'search',
            parameters: { query },
            context: {
                searchType: 'web',
                expectedResultCount: 'multiple',
                ...context
            },
            expectedOutcome: `Search for "${query}" and return list of results`
        }, undefined, website);
    }
    static createLoginRequest(credentials, website, context) {
        return new AutomationRequestedEvent({
            action: 'login',
            parameters: credentials,
            context: {
                loginType: 'form',
                expectRedirect: true,
                ...context
            },
            expectedOutcome: 'Successfully log in and redirect to dashboard/main page'
        }, undefined, website);
    }
    static createFormSubmissionRequest(formData, website, context) {
        return new AutomationRequestedEvent({
            action: 'submitForm',
            parameters: formData,
            context: {
                formType: 'contact',
                expectConfirmation: true,
                ...context
            },
            expectedOutcome: 'Fill form with provided data and submit successfully'
        }, undefined, website);
    }
}
//# sourceMappingURL=automation.js.map