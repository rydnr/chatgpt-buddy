"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationEventFactory = exports.UserGuidanceProvidedEvent = exports.UserGuidanceRequestedEvent = exports.AutomationFailedEvent = exports.AutomationSucceededEvent = exports.AutomationImplementedEvent = exports.AutomationRequestedEvent = void 0;
const base_1 = require("./base");
/**
 * Event triggered when user/system requests automation for a specific action
 * This is the starting point of the learning loop
 */
class AutomationRequestedEvent extends base_1.BaseEvent {
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
exports.AutomationRequestedEvent = AutomationRequestedEvent;
/**
 * Event triggered when user provides implementation through recording
 * Contains the Playwright script and metadata about the implementation
 */
class AutomationImplementedEvent extends base_1.BaseEvent {
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
exports.AutomationImplementedEvent = AutomationImplementedEvent;
/**
 * Event triggered when automation executes successfully
 */
class AutomationSucceededEvent extends base_1.BaseEvent {
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
exports.AutomationSucceededEvent = AutomationSucceededEvent;
/**
 * Event triggered when automation fails to execute
 */
class AutomationFailedEvent extends base_1.BaseEvent {
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
exports.AutomationFailedEvent = AutomationFailedEvent;
/**
 * Event for requesting user interaction/guidance during automation learning
 */
class UserGuidanceRequestedEvent extends base_1.BaseEvent {
    payload;
    type = 'userGuidanceRequested';
    constructor(payload, correlationId, website, tabId) {
        super(payload, correlationId, website, tabId);
        this.payload = payload;
    }
}
exports.UserGuidanceRequestedEvent = UserGuidanceRequestedEvent;
/**
 * Event sent when user provides guidance/response
 */
class UserGuidanceProvidedEvent extends base_1.BaseEvent {
    payload;
    type = 'userGuidanceProvided';
    constructor(payload, correlationId, website, tabId) {
        super(payload, correlationId, website, tabId);
        this.payload = payload;
    }
}
exports.UserGuidanceProvidedEvent = UserGuidanceProvidedEvent;
/**
 * Utility functions for creating automation events
 */
class AutomationEventFactory {
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
exports.AutomationEventFactory = AutomationEventFactory;
//# sourceMappingURL=automation.js.map