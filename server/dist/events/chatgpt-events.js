"use strict";
/**
 * @fileoverview ChatGPT-specific events for AI automation integration
 * @description Domain events for ChatGPT and language model interactions
 * @author rydnr
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIWorkflowOptimizedEvent = exports.AIPerformanceMetricsUpdatedEvent = exports.AIModelSwitchRequestedEvent = exports.ConversationContextUpdatedEvent = exports.IntelligentAutomationSuggestedEvent = exports.AIResponseAnalysisCompletedEvent = exports.AIModelTrainingRequestedEvent = exports.AIAutomationPatternDetectedEvent = exports.LanguageModelIntegrationEvent = exports.ChatGPTInteractionFailedEvent = exports.ChatGPTResponseReceivedEvent = exports.ChatGPTInteractionRequestedEvent = void 0;
const domain_1 = require("@typescript-eda/domain");
/**
 * Event triggered when a ChatGPT interaction is requested
 */
class ChatGPTInteractionRequestedEvent extends domain_1.Event {
    constructor(requestId, extensionId, prompt, context, modelPreference, options) {
        super();
        this.requestId = requestId;
        this.extensionId = extensionId;
        this.prompt = prompt;
        this.context = context;
        this.modelPreference = modelPreference;
        this.options = options;
        this.type = 'ChatGPTInteractionRequested';
    }
}
exports.ChatGPTInteractionRequestedEvent = ChatGPTInteractionRequestedEvent;
/**
 * Event triggered when a ChatGPT response is received
 */
class ChatGPTResponseReceivedEvent extends domain_1.Event {
    constructor(requestId, extensionId, response, responseTime) {
        super();
        this.requestId = requestId;
        this.extensionId = extensionId;
        this.response = response;
        this.responseTime = responseTime;
        this.type = 'ChatGPTResponseReceived';
    }
}
exports.ChatGPTResponseReceivedEvent = ChatGPTResponseReceivedEvent;
/**
 * Event triggered when a ChatGPT interaction fails
 */
class ChatGPTInteractionFailedEvent extends domain_1.Event {
    constructor(requestId, extensionId, error, retryAttempt) {
        super();
        this.requestId = requestId;
        this.extensionId = extensionId;
        this.error = error;
        this.retryAttempt = retryAttempt;
        this.type = 'ChatGPTInteractionFailed';
    }
}
exports.ChatGPTInteractionFailedEvent = ChatGPTInteractionFailedEvent;
/**
 * Event triggered when language model integration is requested
 */
class LanguageModelIntegrationEvent extends domain_1.Event {
    constructor(requestId, modelType, integrationRequest) {
        super();
        this.requestId = requestId;
        this.modelType = modelType;
        this.integrationRequest = integrationRequest;
        this.type = 'LanguageModelIntegration';
    }
}
exports.LanguageModelIntegrationEvent = LanguageModelIntegrationEvent;
/**
 * Event triggered when AI automation pattern is detected
 */
class AIAutomationPatternDetectedEvent extends domain_1.Event {
    constructor(patternId, patternType, confidence, context, suggestions) {
        super();
        this.patternId = patternId;
        this.patternType = patternType;
        this.confidence = confidence;
        this.context = context;
        this.suggestions = suggestions;
        this.type = 'AIAutomationPatternDetected';
    }
}
exports.AIAutomationPatternDetectedEvent = AIAutomationPatternDetectedEvent;
/**
 * Event triggered when AI model training is requested
 */
class AIModelTrainingRequestedEvent extends domain_1.Event {
    constructor(trainingId, dataSet, modelConfiguration, trainingOptions) {
        super();
        this.trainingId = trainingId;
        this.dataSet = dataSet;
        this.modelConfiguration = modelConfiguration;
        this.trainingOptions = trainingOptions;
        this.type = 'AIModelTrainingRequested';
    }
}
exports.AIModelTrainingRequestedEvent = AIModelTrainingRequestedEvent;
/**
 * Event triggered when AI response analysis is completed
 */
class AIResponseAnalysisCompletedEvent extends domain_1.Event {
    constructor(analysisId, requestId, analysis, insights) {
        super();
        this.analysisId = analysisId;
        this.requestId = requestId;
        this.analysis = analysis;
        this.insights = insights;
        this.type = 'AIResponseAnalysisCompleted';
    }
}
exports.AIResponseAnalysisCompletedEvent = AIResponseAnalysisCompletedEvent;
/**
 * Event triggered when intelligent automation is suggested
 */
class IntelligentAutomationSuggestedEvent extends domain_1.Event {
    constructor(suggestionId, automationType, suggestion, confidence) {
        super();
        this.suggestionId = suggestionId;
        this.automationType = automationType;
        this.suggestion = suggestion;
        this.confidence = confidence;
        this.type = 'IntelligentAutomationSuggested';
    }
}
exports.IntelligentAutomationSuggestedEvent = IntelligentAutomationSuggestedEvent;
/**
 * Event triggered when conversation context is updated
 */
class ConversationContextUpdatedEvent extends domain_1.Event {
    constructor(conversationId, extensionId, contextUpdate, previousContext) {
        super();
        this.conversationId = conversationId;
        this.extensionId = extensionId;
        this.contextUpdate = contextUpdate;
        this.previousContext = previousContext;
        this.type = 'ConversationContextUpdated';
    }
}
exports.ConversationContextUpdatedEvent = ConversationContextUpdatedEvent;
/**
 * Event triggered when AI model switching is requested
 */
class AIModelSwitchRequestedEvent extends domain_1.Event {
    constructor(requestId, currentModel, targetModel, reason, context) {
        super();
        this.requestId = requestId;
        this.currentModel = currentModel;
        this.targetModel = targetModel;
        this.reason = reason;
        this.context = context;
        this.type = 'AIModelSwitchRequested';
    }
}
exports.AIModelSwitchRequestedEvent = AIModelSwitchRequestedEvent;
/**
 * Event triggered when AI performance metrics are updated
 */
class AIPerformanceMetricsUpdatedEvent extends domain_1.Event {
    constructor(metricsId, metrics, timeWindow, trends) {
        super();
        this.metricsId = metricsId;
        this.metrics = metrics;
        this.timeWindow = timeWindow;
        this.trends = trends;
        this.type = 'AIPerformanceMetricsUpdated';
    }
}
exports.AIPerformanceMetricsUpdatedEvent = AIPerformanceMetricsUpdatedEvent;
/**
 * Event triggered when AI automation workflow is optimized
 */
class AIWorkflowOptimizedEvent extends domain_1.Event {
    constructor(workflowId, originalWorkflow, optimizedWorkflow, optimizations, expectedImprovement) {
        super();
        this.workflowId = workflowId;
        this.originalWorkflow = originalWorkflow;
        this.optimizedWorkflow = optimizedWorkflow;
        this.optimizations = optimizations;
        this.expectedImprovement = expectedImprovement;
        this.type = 'AIWorkflowOptimized';
    }
}
exports.AIWorkflowOptimizedEvent = AIWorkflowOptimizedEvent;
