"use strict";
/**
 * @fileoverview Server lifecycle and management events
 * @description Core events for server startup, shutdown, health checks, and monitoring
 * @author Web-Buddy Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerSecurityAlertEvent = exports.ServerPerformanceWarningEvent = exports.ServerConfigurationChangedEvent = exports.ServerErrorEvent = exports.ServerStoppedEvent = exports.ServerStartedEvent = exports.ServerMetricsRequestedEvent = exports.ServerHealthCheckRequestedEvent = exports.ServerStopRequestedEvent = exports.ServerStartRequestedEvent = void 0;
const typescript_eda_stubs_1 = require("../../stubs/typescript-eda-stubs");
/**
 * Event triggered when server startup is requested
 */
class ServerStartRequestedEvent extends typescript_eda_stubs_1.Event {
    constructor(port, configuration) {
        super();
        this.port = port;
        this.configuration = configuration;
        this.type = 'ServerStartRequested';
    }
}
exports.ServerStartRequestedEvent = ServerStartRequestedEvent;
/**
 * Event triggered when server shutdown is requested
 */
class ServerStopRequestedEvent extends typescript_eda_stubs_1.Event {
    constructor(reason, gracefulShutdown = true) {
        super();
        this.reason = reason;
        this.gracefulShutdown = gracefulShutdown;
        this.type = 'ServerStopRequested';
    }
}
exports.ServerStopRequestedEvent = ServerStopRequestedEvent;
/**
 * Event triggered when server health check is requested
 */
class ServerHealthCheckRequestedEvent extends typescript_eda_stubs_1.Event {
    constructor(requestId, includeDetails = false) {
        super();
        this.requestId = requestId;
        this.includeDetails = includeDetails;
        this.type = 'ServerHealthCheckRequested';
    }
}
exports.ServerHealthCheckRequestedEvent = ServerHealthCheckRequestedEvent;
/**
 * Event triggered when server metrics are requested
 */
class ServerMetricsRequestedEvent extends typescript_eda_stubs_1.Event {
    constructor(requestId, metricsType = 'all') {
        super();
        this.requestId = requestId;
        this.metricsType = metricsType;
        this.type = 'ServerMetricsRequested';
    }
}
exports.ServerMetricsRequestedEvent = ServerMetricsRequestedEvent;
/**
 * Event triggered when server successfully starts
 */
class ServerStartedEvent extends typescript_eda_stubs_1.Event {
    constructor(port, startTime, processId) {
        super();
        this.port = port;
        this.startTime = startTime;
        this.processId = processId;
        this.type = 'ServerStarted';
    }
}
exports.ServerStartedEvent = ServerStartedEvent;
/**
 * Event triggered when server successfully stops
 */
class ServerStoppedEvent extends typescript_eda_stubs_1.Event {
    constructor(shutdownTime, uptime, reason) {
        super();
        this.shutdownTime = shutdownTime;
        this.uptime = uptime;
        this.reason = reason;
        this.type = 'ServerStopped';
    }
}
exports.ServerStoppedEvent = ServerStoppedEvent;
/**
 * Event triggered when server encounters an error
 */
class ServerErrorEvent extends typescript_eda_stubs_1.Event {
    constructor(error, component, severity = 'medium') {
        super();
        this.error = error;
        this.component = component;
        this.severity = severity;
        this.type = 'ServerError';
    }
}
exports.ServerErrorEvent = ServerErrorEvent;
/**
 * Event triggered when server configuration changes
 */
class ServerConfigurationChangedEvent extends typescript_eda_stubs_1.Event {
    constructor(previousConfiguration, newConfiguration, changedFields) {
        super();
        this.previousConfiguration = previousConfiguration;
        this.newConfiguration = newConfiguration;
        this.changedFields = changedFields;
        this.type = 'ServerConfigurationChanged';
    }
}
exports.ServerConfigurationChangedEvent = ServerConfigurationChangedEvent;
/**
 * Event triggered when server performance warning occurs
 */
class ServerPerformanceWarningEvent extends typescript_eda_stubs_1.Event {
    constructor(metric, threshold, currentValue, recommendation) {
        super();
        this.metric = metric;
        this.threshold = threshold;
        this.currentValue = currentValue;
        this.recommendation = recommendation;
        this.type = 'ServerPerformanceWarning';
    }
}
exports.ServerPerformanceWarningEvent = ServerPerformanceWarningEvent;
/**
 * Event triggered when server security alert occurs
 */
class ServerSecurityAlertEvent extends typescript_eda_stubs_1.Event {
    constructor(alertType, description, sourceIP, severity = 'medium') {
        super();
        this.alertType = alertType;
        this.description = description;
        this.sourceIP = sourceIP;
        this.severity = severity;
        this.type = 'ServerSecurityAlert';
    }
}
exports.ServerSecurityAlertEvent = ServerSecurityAlertEvent;
//# sourceMappingURL=server-events.js.map