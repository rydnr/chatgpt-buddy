"use strict";
/**
 * @fileoverview Coordination events for managing browser extension communication
 * @description Events for extension lifecycle, automation requests, and session management
 * @author Web-Buddy Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoordinationMetricsUpdatedEvent = exports.CoordinationErrorEvent = exports.ExtensionHeartbeatMissedEvent = exports.ExtensionHeartbeatReceivedEvent = exports.CoordinationSessionEndedEvent = exports.CoordinationSessionStartedEvent = exports.AutomationRequestFailedEvent = exports.AutomationResponseReceivedEvent = exports.AutomationRequestRoutedEvent = exports.AutomationRequestReceivedEvent = exports.ExtensionDisconnectedEvent = exports.ExtensionConnectedEvent = void 0;
const typescript_eda_stubs_1 = require("../../stubs/typescript-eda-stubs");
/**
 * Event triggered when a browser extension connects to the server
 */
class ExtensionConnectedEvent extends typescript_eda_stubs_1.Event {
    constructor(extensionId, metadata, connectionInfo) {
        super();
        this.extensionId = extensionId;
        this.metadata = metadata;
        this.connectionInfo = connectionInfo;
        this.type = 'ExtensionConnected';
    }
}
exports.ExtensionConnectedEvent = ExtensionConnectedEvent;
/**
 * Event triggered when a browser extension disconnects from the server
 */
class ExtensionDisconnectedEvent extends typescript_eda_stubs_1.Event {
    constructor(extensionId, reason, sessionDuration) {
        super();
        this.extensionId = extensionId;
        this.reason = reason;
        this.sessionDuration = sessionDuration;
        this.type = 'ExtensionDisconnected';
    }
}
exports.ExtensionDisconnectedEvent = ExtensionDisconnectedEvent;
/**
 * Event triggered when an automation request is received from external clients
 */
class AutomationRequestReceivedEvent extends typescript_eda_stubs_1.Event {
    constructor(requestId, clientId, targetExtensionId, targetTabId, automationPayload) {
        super();
        this.requestId = requestId;
        this.clientId = clientId;
        this.targetExtensionId = targetExtensionId;
        this.targetTabId = targetTabId;
        this.automationPayload = automationPayload;
        this.type = 'AutomationRequestReceived';
    }
}
exports.AutomationRequestReceivedEvent = AutomationRequestReceivedEvent;
/**
 * Event triggered when automation request is routed to an extension
 */
class AutomationRequestRoutedEvent extends typescript_eda_stubs_1.Event {
    constructor(requestId, extensionId, routingDecision) {
        super();
        this.requestId = requestId;
        this.extensionId = extensionId;
        this.routingDecision = routingDecision;
        this.type = 'AutomationRequestRouted';
    }
}
exports.AutomationRequestRoutedEvent = AutomationRequestRoutedEvent;
/**
 * Event triggered when automation response is received from extension
 */
class AutomationResponseReceivedEvent extends typescript_eda_stubs_1.Event {
    constructor(requestId, extensionId, response, executionTime) {
        super();
        this.requestId = requestId;
        this.extensionId = extensionId;
        this.response = response;
        this.executionTime = executionTime;
        this.type = 'AutomationResponseReceived';
    }
}
exports.AutomationResponseReceivedEvent = AutomationResponseReceivedEvent;
/**
 * Event triggered when automation request fails to be delivered
 */
class AutomationRequestFailedEvent extends typescript_eda_stubs_1.Event {
    constructor(requestId, extensionId, error, retryAttempt) {
        super();
        this.requestId = requestId;
        this.extensionId = extensionId;
        this.error = error;
        this.retryAttempt = retryAttempt;
        this.type = 'AutomationRequestFailed';
    }
}
exports.AutomationRequestFailedEvent = AutomationRequestFailedEvent;
/**
 * Event triggered when a new coordination session is started
 */
class CoordinationSessionStartedEvent extends typescript_eda_stubs_1.Event {
    constructor(sessionId, clientId, sessionType, configuration) {
        super();
        this.sessionId = sessionId;
        this.clientId = clientId;
        this.sessionType = sessionType;
        this.configuration = configuration;
        this.type = 'CoordinationSessionStarted';
    }
}
exports.CoordinationSessionStartedEvent = CoordinationSessionStartedEvent;
/**
 * Event triggered when a coordination session ends
 */
class CoordinationSessionEndedEvent extends typescript_eda_stubs_1.Event {
    constructor(sessionId, duration, statistics, reason) {
        super();
        this.sessionId = sessionId;
        this.duration = duration;
        this.statistics = statistics;
        this.reason = reason;
        this.type = 'CoordinationSessionEnded';
    }
}
exports.CoordinationSessionEndedEvent = CoordinationSessionEndedEvent;
/**
 * Event triggered when extension heartbeat is received
 */
class ExtensionHeartbeatReceivedEvent extends typescript_eda_stubs_1.Event {
    constructor(extensionId, status, metrics) {
        super();
        this.extensionId = extensionId;
        this.status = status;
        this.metrics = metrics;
        this.type = 'ExtensionHeartbeatReceived';
    }
}
exports.ExtensionHeartbeatReceivedEvent = ExtensionHeartbeatReceivedEvent;
/**
 * Event triggered when extension heartbeat is missed
 */
class ExtensionHeartbeatMissedEvent extends typescript_eda_stubs_1.Event {
    constructor(extensionId, missedCount, lastSeen) {
        super();
        this.extensionId = extensionId;
        this.missedCount = missedCount;
        this.lastSeen = lastSeen;
        this.type = 'ExtensionHeartbeatMissed';
    }
}
exports.ExtensionHeartbeatMissedEvent = ExtensionHeartbeatMissedEvent;
/**
 * Event triggered when coordination error occurs
 */
class CoordinationErrorEvent extends typescript_eda_stubs_1.Event {
    constructor(error, context, recovery) {
        super();
        this.error = error;
        this.context = context;
        this.recovery = recovery;
        this.type = 'CoordinationError';
    }
}
exports.CoordinationErrorEvent = CoordinationErrorEvent;
/**
 * Event triggered when coordination metrics are updated
 */
class CoordinationMetricsUpdatedEvent extends typescript_eda_stubs_1.Event {
    constructor(metrics, updateType) {
        super();
        this.metrics = metrics;
        this.updateType = updateType;
        this.type = 'CoordinationMetricsUpdated';
    }
}
exports.CoordinationMetricsUpdatedEvent = CoordinationMetricsUpdatedEvent;
//# sourceMappingURL=coordination-events.js.map