export interface ClientConfig {
    baseUrl: string;
    apiKey: string;
    timeout?: number;
    retries?: number;
    userAgent?: string;
}
export declare abstract class DomainEvent {
    readonly correlationId: string;
    readonly id: string;
    readonly timestamp: Date;
    constructor(correlationId: string);
    abstract get eventType(): string;
}
export declare abstract class EventResponse {
    readonly correlationId: string;
    readonly success: boolean;
    readonly timestamp: Date;
    constructor(correlationId: string, success: boolean, timestamp?: Date);
    abstract get responseType(): string;
}
export declare class ProjectSelectionRequested extends DomainEvent {
    readonly projectName: string;
    readonly selector?: string | undefined;
    readonly eventType = "ProjectSelectionRequested";
    constructor(projectName: string, selector?: string | undefined, correlationId?: string);
}
export declare class ProjectSelected extends EventResponse {
    readonly projectName: string;
    readonly actualSelector: string;
    readonly responseType = "ProjectSelected";
    constructor(projectName: string, actualSelector: string, correlationId: string);
}
export declare class ProjectSelectionFailed extends EventResponse {
    readonly projectName: string;
    readonly reason: string;
    readonly selector?: string | undefined;
    readonly responseType = "ProjectSelectionFailed";
    constructor(projectName: string, reason: string, selector?: string | undefined, correlationId?: string);
}
export declare class ChatSelectionRequested extends DomainEvent {
    readonly chatTitle: string;
    readonly selector?: string | undefined;
    readonly eventType = "ChatSelectionRequested";
    constructor(chatTitle: string, selector?: string | undefined, correlationId?: string);
}
export declare class ChatSelected extends EventResponse {
    readonly chatTitle: string;
    readonly actualSelector: string;
    readonly responseType = "ChatSelected";
    constructor(chatTitle: string, actualSelector: string, correlationId: string);
}
export declare class ChatSelectionFailed extends EventResponse {
    readonly chatTitle: string;
    readonly reason: string;
    readonly responseType = "ChatSelectionFailed";
    constructor(chatTitle: string, reason: string, correlationId: string);
}
export declare class PromptSubmissionRequested extends DomainEvent {
    readonly promptText: string;
    readonly selector: string;
    readonly eventType = "PromptSubmissionRequested";
    constructor(promptText: string, selector?: string, correlationId?: string);
}
export declare class PromptSubmitted extends EventResponse {
    readonly promptText: string;
    readonly actualSelector: string;
    readonly responseType = "PromptSubmitted";
    constructor(promptText: string, actualSelector: string, correlationId: string);
}
export declare class PromptSubmissionFailed extends EventResponse {
    readonly promptText: string;
    readonly reason: string;
    readonly responseType = "PromptSubmissionFailed";
    constructor(promptText: string, reason: string, correlationId: string);
}
export declare class ResponseRetrievalRequested extends DomainEvent {
    readonly selector: string;
    readonly timeout: number;
    readonly eventType = "ResponseRetrievalRequested";
    constructor(selector?: string, timeout?: number, correlationId?: string);
}
export declare class ResponseRetrieved extends EventResponse {
    readonly content: string;
    readonly metadata: {
        selector: string;
        messageIndex?: number;
        timestamp?: string;
        wordCount?: number;
    };
    readonly responseType = "ResponseRetrieved";
    constructor(content: string, metadata: {
        selector: string;
        messageIndex?: number;
        timestamp?: string;
        wordCount?: number;
    }, correlationId: string);
}
export declare class ResponseRetrievalFailed extends EventResponse {
    readonly reason: string;
    readonly timeout: number;
    readonly responseType = "ResponseRetrievalFailed";
    constructor(reason: string, timeout: number, correlationId: string);
}
export interface GoogleImageElement {
    src: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
}
export declare class GoogleImageDownloadRequested extends DomainEvent {
    readonly imageElement: GoogleImageElement;
    readonly searchQuery?: string | undefined;
    readonly filename?: string | undefined;
    readonly eventType = "GoogleImageDownloadRequested";
    constructor(imageElement: GoogleImageElement, searchQuery?: string | undefined, filename?: string | undefined, correlationId?: string);
}
export declare class GoogleImageDownloadCompleted extends EventResponse {
    readonly downloadId: number;
    readonly originalUrl: string;
    readonly highResUrl: string;
    readonly filename: string;
    readonly filepath: string;
    readonly metadata: {
        searchQuery?: string;
        extractedAt: Date;
        fileSize: number;
        mimeType: string;
        dimensions?: {
            width: number;
            height: number;
        };
    };
    readonly responseType = "GoogleImageDownloadCompleted";
    constructor(downloadId: number, originalUrl: string, highResUrl: string, filename: string, filepath: string, metadata: {
        searchQuery?: string;
        extractedAt: Date;
        fileSize: number;
        mimeType: string;
        dimensions?: {
            width: number;
            height: number;
        };
    }, correlationId: string);
}
export declare class GoogleImageDownloadFailed extends EventResponse {
    readonly originalUrl: string;
    readonly reason: string;
    readonly phase: 'url_extraction' | 'download_initiation' | 'download_completion';
    readonly responseType = "GoogleImageDownloadFailed";
    constructor(originalUrl: string, reason: string, phase: 'url_extraction' | 'download_initiation' | 'download_completion', correlationId: string);
}
export declare class FileDownloadRequested extends DomainEvent {
    readonly url: string;
    readonly filename?: string | undefined;
    readonly conflictAction?: "uniquify" | "overwrite" | "prompt" | undefined;
    readonly saveAs?: boolean | undefined;
    readonly eventType = "FileDownloadRequested";
    constructor(url: string, filename?: string | undefined, conflictAction?: "uniquify" | "overwrite" | "prompt" | undefined, saveAs?: boolean | undefined, correlationId?: string);
}
export declare class FileDownloadStarted extends EventResponse {
    readonly downloadId: number;
    readonly url: string;
    readonly filename: string;
    readonly estimatedSize?: number | undefined;
    readonly responseType = "FileDownloadStarted";
    constructor(downloadId: number, url: string, filename: string, estimatedSize?: number | undefined, correlationId?: string);
}
export declare class FileDownloadCompleted extends EventResponse {
    readonly downloadId: number;
    readonly url: string;
    readonly filename: string;
    readonly filepath: string;
    readonly fileSize: number;
    readonly downloadTime: number;
    readonly responseType = "FileDownloadCompleted";
    constructor(downloadId: number, url: string, filename: string, filepath: string, fileSize: number, downloadTime: number, correlationId: string);
}
export declare class FileDownloadFailed extends EventResponse {
    readonly url: string;
    readonly reason: string;
    readonly downloadId?: number | undefined;
    readonly responseType = "FileDownloadFailed";
    constructor(url: string, reason: string, downloadId?: number | undefined, correlationId?: string);
}
export declare class FileDownloadProgress extends EventResponse {
    readonly downloadId: number;
    readonly bytesReceived: number;
    readonly totalBytes: number;
    readonly percentage: number;
    readonly speed: number;
    readonly responseType = "FileDownloadProgress";
    constructor(downloadId: number, bytesReceived: number, totalBytes: number, percentage: number, speed: number, // bytes per second
    correlationId: string);
}
export declare class TrainingModeRequested extends DomainEvent {
    readonly website: string;
    readonly eventType = "TrainingModeRequested";
    constructor(website: string, correlationId?: string);
}
export declare class TrainingModeEnabled extends EventResponse {
    readonly sessionId: string;
    readonly website: string;
    readonly existingPatterns: number;
    readonly responseType = "TrainingModeEnabled";
    constructor(sessionId: string, website: string, existingPatterns: number, correlationId: string);
}
export declare class TrainingModeDisabled extends EventResponse {
    readonly sessionId: string;
    readonly reason: string;
    readonly patternsLearned: number;
    readonly responseType = "TrainingModeDisabled";
    constructor(sessionId: string, reason: string, patternsLearned: number, correlationId: string);
}
export declare class AutomationPatternListRequested extends DomainEvent {
    readonly filters?: {
        website?: string;
        messageType?: string;
        confidenceThreshold?: number;
    } | undefined;
    readonly eventType = "AutomationPatternListRequested";
    constructor(filters?: {
        website?: string;
        messageType?: string;
        confidenceThreshold?: number;
    } | undefined, correlationId?: string);
}
export declare class AutomationPatternListProvided extends EventResponse {
    readonly patterns: AutomationPattern[];
    readonly totalCount: number;
    readonly filters: any;
    readonly responseType = "AutomationPatternListProvided";
    constructor(patterns: AutomationPattern[], totalCount: number, filters: any, correlationId: string);
}
export interface AutomationPattern {
    id: string;
    messageType: string;
    selector: string;
    confidence: number;
    usageCount: number;
    successfulExecutions: number;
    lastUsed: Date;
    context: {
        website: string;
        pageUrl: string;
        elementContext: any;
        learnedAt: Date;
    };
    metadata: {
        userProvided: boolean;
        autoGenerated: boolean;
        verified: boolean;
        notes?: string;
    };
}
export interface ExecutionContext {
    website: string;
    pageUrl: string;
    pageTitle: string;
    elementContext: any;
    timestamp: Date;
}
export interface ChatGPTWorkflow {
    projectName: string;
    chatTitle?: string;
    promptText: string;
    expectedResponseType?: 'code' | 'text' | 'markdown' | 'json';
    timeout?: number;
}
export interface ChatGPTWorkflowResult {
    projectSelection: ProjectSelected | ProjectSelectionFailed;
    chatSelection?: ChatSelected | ChatSelectionFailed;
    promptSubmission: PromptSubmitted | PromptSubmissionFailed;
    responseRetrieval: ResponseRetrieved | ResponseRetrievalFailed;
    totalTime: number;
    success: boolean;
}
export interface GoogleImagesWorkflow {
    searchQuery: string;
    imageSelectors: string[];
    downloadOptions: {
        baseFilename?: string;
        maxImages?: number;
        minResolution?: {
            width: number;
            height: number;
        };
        fileTypes?: string[];
    };
}
export interface GoogleImagesWorkflowResult {
    searchQuery: string;
    imagesFound: number;
    imagesDownloaded: number;
    downloadResults: Array<GoogleImageDownloadCompleted | GoogleImageDownloadFailed>;
    totalTime: number;
    totalSize: number;
}
export interface EventError extends Error {
    eventType: string;
    correlationId: string;
    phase: string;
    originalEvent?: DomainEvent;
    context?: any;
}
export interface WorkflowError extends Error {
    workflowType: string;
    completedSteps: string[];
    failedStep: string;
    partialResults: any;
}
export interface WebSocketMessage {
    type: 'event' | 'response' | 'error' | 'ping' | 'pong';
    correlationId?: string;
    payload: any;
    timestamp: Date;
}
export interface WebSocketConfig {
    url: string;
    protocols?: string[];
    reconnectAttempts?: number;
    heartbeatInterval?: number;
}
export type EventClass = new (...args: any[]) => DomainEvent;
export type ResponseClass = new (...args: any[]) => EventResponse;
export interface EventMapping {
    [eventType: string]: {
        requestClass: EventClass;
        responseClasses: ResponseClass[];
        action: string;
        endpoint?: string;
    };
}
export type AutomationEvent = ProjectSelectionRequested | ChatSelectionRequested | PromptSubmissionRequested | ResponseRetrievalRequested;
export type AutomationResponse = ProjectSelected | ProjectSelectionFailed | ChatSelected | ChatSelectionFailed | PromptSubmitted | PromptSubmissionFailed | ResponseRetrieved | ResponseRetrievalFailed;
export type DownloadEvent = GoogleImageDownloadRequested | FileDownloadRequested;
export type DownloadResponse = GoogleImageDownloadCompleted | GoogleImageDownloadFailed | FileDownloadStarted | FileDownloadCompleted | FileDownloadFailed | FileDownloadProgress;
export type TrainingEvent = TrainingModeRequested | AutomationPatternListRequested;
export type TrainingResponse = TrainingModeEnabled | TrainingModeDisabled | AutomationPatternListProvided;
export type AllEvents = AutomationEvent | DownloadEvent | TrainingEvent;
export type AllResponses = AutomationResponse | DownloadResponse | TrainingResponse;
//# sourceMappingURL=types.d.ts.map