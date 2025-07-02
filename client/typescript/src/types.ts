/*
                        Web-Buddy Framework
                        Event-Driven TypeScript Client Types

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

// === Core Configuration ===

export interface ClientConfig {
    baseUrl: string;
    apiKey: string;
    timeout?: number;
    retries?: number;
    userAgent?: string;
}

// === Base Event Classes ===

export abstract class DomainEvent {
    public readonly id: string;
    public readonly timestamp: Date;
    
    constructor(
        public readonly correlationId: string
    ) {
        this.id = `${this.constructor.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.timestamp = new Date();
    }

    abstract get eventType(): string;
}

export abstract class EventResponse {
    constructor(
        public readonly correlationId: string,
        public readonly success: boolean,
        public readonly timestamp: Date = new Date()
    ) {}

    abstract get responseType(): string;
}

// === ChatGPT Automation Events ===

export class ProjectSelectionRequested extends DomainEvent {
    public readonly eventType = 'ProjectSelectionRequested';
    
    constructor(
        public readonly projectName: string,
        public readonly selector?: string,
        correlationId?: string
    ) {
        super(correlationId || `project-${Date.now()}`);
    }
}

export class ProjectSelected extends EventResponse {
    public readonly responseType = 'ProjectSelected';
    
    constructor(
        public readonly projectName: string,
        public readonly actualSelector: string,
        correlationId: string
    ) {
        super(correlationId, true);
    }
}

export class ProjectSelectionFailed extends EventResponse {
    public readonly responseType = 'ProjectSelectionFailed';
    
    constructor(
        public readonly projectName: string,
        public readonly reason: string,
        public readonly selector?: string,
        correlationId?: string
    ) {
        super(correlationId || '', false);
    }
}

export class ChatSelectionRequested extends DomainEvent {
    public readonly eventType = 'ChatSelectionRequested';
    
    constructor(
        public readonly chatTitle: string,
        public readonly selector?: string,
        correlationId?: string
    ) {
        super(correlationId || `chat-${Date.now()}`);
    }
}

export class ChatSelected extends EventResponse {
    public readonly responseType = 'ChatSelected';
    
    constructor(
        public readonly chatTitle: string,
        public readonly actualSelector: string,
        correlationId: string
    ) {
        super(correlationId, true);
    }
}

export class ChatSelectionFailed extends EventResponse {
    public readonly responseType = 'ChatSelectionFailed';
    
    constructor(
        public readonly chatTitle: string,
        public readonly reason: string,
        correlationId: string
    ) {
        super(correlationId, false);
    }
}

export class PromptSubmissionRequested extends DomainEvent {
    public readonly eventType = 'PromptSubmissionRequested';
    
    constructor(
        public readonly promptText: string,
        public readonly selector: string = '#prompt-textarea',
        correlationId?: string
    ) {
        super(correlationId || `prompt-${Date.now()}`);
    }
}

export class PromptSubmitted extends EventResponse {
    public readonly responseType = 'PromptSubmitted';
    
    constructor(
        public readonly promptText: string,
        public readonly actualSelector: string,
        correlationId: string
    ) {
        super(correlationId, true);
    }
}

export class PromptSubmissionFailed extends EventResponse {
    public readonly responseType = 'PromptSubmissionFailed';
    
    constructor(
        public readonly promptText: string,
        public readonly reason: string,
        correlationId: string
    ) {
        super(correlationId, false);
    }
}

export class ResponseRetrievalRequested extends DomainEvent {
    public readonly eventType = 'ResponseRetrievalRequested';
    
    constructor(
        public readonly selector: string = '[data-message-author-role="assistant"]',
        public readonly timeout: number = 30000,
        correlationId?: string
    ) {
        super(correlationId || `response-${Date.now()}`);
    }
}

export class ResponseRetrieved extends EventResponse {
    public readonly responseType = 'ResponseRetrieved';
    
    constructor(
        public readonly content: string,
        public readonly metadata: {
            selector: string;
            messageIndex?: number;
            timestamp?: string;
            wordCount?: number;
        },
        correlationId: string
    ) {
        super(correlationId, true);
    }
}

export class ResponseRetrievalFailed extends EventResponse {
    public readonly responseType = 'ResponseRetrievalFailed';
    
    constructor(
        public readonly reason: string,
        public readonly timeout: number,
        correlationId: string
    ) {
        super(correlationId, false);
    }
}

// === Google Images Download Events ===

export interface GoogleImageElement {
    src: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
}

export class GoogleImageDownloadRequested extends DomainEvent {
    public readonly eventType = 'GoogleImageDownloadRequested';
    
    constructor(
        public readonly imageElement: GoogleImageElement,
        public readonly searchQuery?: string,
        public readonly filename?: string,
        correlationId?: string
    ) {
        super(correlationId || `google-img-${Date.now()}`);
    }
}

export class GoogleImageDownloadCompleted extends EventResponse {
    public readonly responseType = 'GoogleImageDownloadCompleted';
    
    constructor(
        public readonly downloadId: number,
        public readonly originalUrl: string,
        public readonly highResUrl: string,
        public readonly filename: string,
        public readonly filepath: string,
        public readonly metadata: {
            searchQuery?: string;
            extractedAt: Date;
            fileSize: number;
            mimeType: string;
            dimensions?: { width: number; height: number };
        },
        correlationId: string
    ) {
        super(correlationId, true);
    }
}

export class GoogleImageDownloadFailed extends EventResponse {
    public readonly responseType = 'GoogleImageDownloadFailed';
    
    constructor(
        public readonly originalUrl: string,
        public readonly reason: string,
        public readonly phase: 'url_extraction' | 'download_initiation' | 'download_completion',
        correlationId: string
    ) {
        super(correlationId, false);
    }
}

// === File Download Events ===

export class FileDownloadRequested extends DomainEvent {
    public readonly eventType = 'FileDownloadRequested';
    
    constructor(
        public readonly url: string,
        public readonly filename?: string,
        public readonly conflictAction?: 'uniquify' | 'overwrite' | 'prompt',
        public readonly saveAs?: boolean,
        correlationId?: string
    ) {
        super(correlationId || `download-${Date.now()}`);
    }
}

export class FileDownloadStarted extends EventResponse {
    public readonly responseType = 'FileDownloadStarted';
    
    constructor(
        public readonly downloadId: number,
        public readonly url: string,
        public readonly filename: string,
        public readonly estimatedSize?: number,
        correlationId?: string
    ) {
        super(correlationId || '', true);
    }
}

export class FileDownloadCompleted extends EventResponse {
    public readonly responseType = 'FileDownloadCompleted';
    
    constructor(
        public readonly downloadId: number,
        public readonly url: string,
        public readonly filename: string,
        public readonly filepath: string,
        public readonly fileSize: number,
        public readonly downloadTime: number,
        correlationId: string
    ) {
        super(correlationId, true);
    }
}

export class FileDownloadFailed extends EventResponse {
    public readonly responseType = 'FileDownloadFailed';
    
    constructor(
        public readonly url: string,
        public readonly reason: string,
        public readonly downloadId?: number,
        correlationId?: string
    ) {
        super(correlationId || '', false);
    }
}

export class FileDownloadProgress extends EventResponse {
    public readonly responseType = 'FileDownloadProgress';
    
    constructor(
        public readonly downloadId: number,
        public readonly bytesReceived: number,
        public readonly totalBytes: number,
        public readonly percentage: number,
        public readonly speed: number, // bytes per second
        correlationId: string
    ) {
        super(correlationId, true);
    }
}

// === Training System Events ===

export class TrainingModeRequested extends DomainEvent {
    public readonly eventType = 'TrainingModeRequested';
    
    constructor(
        public readonly website: string,
        correlationId?: string
    ) {
        super(correlationId || `training-${Date.now()}`);
    }
}

export class TrainingModeEnabled extends EventResponse {
    public readonly responseType = 'TrainingModeEnabled';
    
    constructor(
        public readonly sessionId: string,
        public readonly website: string,
        public readonly existingPatterns: number,
        correlationId: string
    ) {
        super(correlationId, true);
    }
}

export class TrainingModeDisabled extends EventResponse {
    public readonly responseType = 'TrainingModeDisabled';
    
    constructor(
        public readonly sessionId: string,
        public readonly reason: string,
        public readonly patternsLearned: number,
        correlationId: string
    ) {
        super(correlationId, true);
    }
}

export class AutomationPatternListRequested extends DomainEvent {
    public readonly eventType = 'AutomationPatternListRequested';
    
    constructor(
        public readonly filters?: {
            website?: string;
            messageType?: string;
            confidenceThreshold?: number;
        },
        correlationId?: string
    ) {
        super(correlationId || `patterns-${Date.now()}`);
    }
}

export class AutomationPatternListProvided extends EventResponse {
    public readonly responseType = 'AutomationPatternListProvided';
    
    constructor(
        public readonly patterns: AutomationPattern[],
        public readonly totalCount: number,
        public readonly filters: any,
        correlationId: string
    ) {
        super(correlationId, true);
    }
}

// === Pattern Management Types ===

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

// === Workflow Types ===

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
        minResolution?: { width: number; height: number };
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

// === Error Types ===

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

// === WebSocket Types (for future real-time implementation) ===

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

// === Utility Types ===

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

// === Export Union Types for Convenience ===

export type AutomationEvent = 
    | ProjectSelectionRequested 
    | ChatSelectionRequested 
    | PromptSubmissionRequested 
    | ResponseRetrievalRequested;

export type AutomationResponse = 
    | ProjectSelected | ProjectSelectionFailed
    | ChatSelected | ChatSelectionFailed
    | PromptSubmitted | PromptSubmissionFailed
    | ResponseRetrieved | ResponseRetrievalFailed;

export type DownloadEvent = 
    | GoogleImageDownloadRequested 
    | FileDownloadRequested;

export type DownloadResponse = 
    | GoogleImageDownloadCompleted | GoogleImageDownloadFailed
    | FileDownloadStarted | FileDownloadCompleted | FileDownloadFailed
    | FileDownloadProgress;

export type TrainingEvent = 
    | TrainingModeRequested 
    | AutomationPatternListRequested;

export type TrainingResponse = 
    | TrainingModeEnabled | TrainingModeDisabled
    | AutomationPatternListProvided;

export type AllEvents = AutomationEvent | DownloadEvent | TrainingEvent;
export type AllResponses = AutomationResponse | DownloadResponse | TrainingResponse;