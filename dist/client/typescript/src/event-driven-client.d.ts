import { DomainEvent, EventResponse, ClientConfig, ProjectSelected, ProjectSelectionFailed, ChatSelected, ChatSelectionFailed, PromptSubmitted, PromptSubmissionFailed, ResponseRetrieved, ResponseRetrievalFailed, GoogleImageDownloadCompleted, GoogleImageDownloadFailed, FileDownloadStarted, FileDownloadFailed, TrainingModeEnabled, AutomationPatternListProvided } from './types';
/**
 * Event-Driven Web-Buddy Client
 *
 * Pure event-driven interface following the Web-Buddy Framework's EDA principles.
 * All operations are performed by sending domain events and receiving event responses.
 */
export declare class EventDrivenWebBuddyClient {
    private config;
    private eventQueue;
    constructor(config: ClientConfig);
    /**
     * Sends a domain event and waits for response
     * This is the low-level interface that all other methods use
     */
    sendEvent<TEvent extends DomainEvent, TResponse extends EventResponse>(event: TEvent, extensionId: string, tabId: number): Promise<TResponse>;
    /**
     * Sends multiple events in sequence
     */
    sendEvents<TResponse extends EventResponse>(events: Array<{
        event: DomainEvent;
        extensionId: string;
        tabId: number;
    }>, options?: {
        parallel?: boolean;
        stopOnError?: boolean;
    }): Promise<TResponse[]>;
    /**
     * Requests ChatGPT project selection
     */
    requestProjectSelection(extensionId: string, tabId: number, projectName: string, options?: {
        selector?: string;
    }): Promise<ProjectSelected | ProjectSelectionFailed>;
    /**
     * Requests chat selection
     */
    requestChatSelection(extensionId: string, tabId: number, chatTitle: string, options?: {
        selector?: string;
    }): Promise<ChatSelected | ChatSelectionFailed>;
    /**
     * Requests prompt submission
     */
    requestPromptSubmission(extensionId: string, tabId: number, promptText: string, options?: {
        selector?: string;
    }): Promise<PromptSubmitted | PromptSubmissionFailed>;
    /**
     * Requests response retrieval from ChatGPT
     */
    requestResponseRetrieval(extensionId: string, tabId: number, options?: {
        selector?: string;
        timeout?: number;
    }): Promise<ResponseRetrieved | ResponseRetrievalFailed>;
    /**
     * Requests Google Images download
     */
    requestGoogleImageDownload(extensionId: string, tabId: number, imageElement: {
        src: string;
        alt?: string;
        title?: string;
        width?: number;
        height?: number;
    }, options?: {
        searchQuery?: string;
        filename?: string;
    }): Promise<GoogleImageDownloadCompleted | GoogleImageDownloadFailed>;
    /**
     * Requests file download
     */
    requestFileDownload(extensionId: string, tabId: number, url: string, options?: {
        filename?: string;
        conflictAction?: 'uniquify' | 'overwrite' | 'prompt';
        saveAs?: boolean;
    }): Promise<FileDownloadStarted | FileDownloadFailed>;
    /**
     * Requests training mode activation
     */
    requestTrainingMode(website: string): Promise<TrainingModeEnabled>;
    /**
     * Requests automation pattern list
     */
    requestAutomationPatterns(filters?: {
        website?: string;
        messageType?: string;
        confidenceThreshold?: number;
    }): Promise<AutomationPatternListProvided>;
    /**
     * Complete ChatGPT workflow: select project, submit prompt, get response
     */
    executeFullChatGPTWorkflow(extensionId: string, tabId: number, workflow: {
        projectName: string;
        promptText: string;
        chatTitle?: string;
    }): Promise<{
        projectSelection: ProjectSelected | ProjectSelectionFailed;
        chatSelection?: ChatSelected | ChatSelectionFailed;
        promptSubmission: PromptSubmitted | PromptSubmissionFailed;
        responseRetrieval: ResponseRetrieved | ResponseRetrievalFailed;
    }>;
    /**
     * Batch Google Images download
     */
    downloadMultipleGoogleImages(extensionId: string, tabId: number, images: Array<{
        element: any;
        searchQuery?: string;
        filename?: string;
    }>, options?: {
        parallel?: boolean;
        delayBetween?: number;
    }): Promise<Array<GoogleImageDownloadCompleted | GoogleImageDownloadFailed>>;
    /**
     * Tests connectivity with a simple ping event
     */
    ping(): Promise<{
        success: boolean;
        latency: number;
    }>;
    /**
     * Gets client configuration
     */
    getConfig(): ClientConfig;
    /**
     * Updates client configuration
     */
    updateConfig(updates: Partial<ClientConfig>): void;
    private generateCorrelationId;
    private mapEventToAction;
    private extractEventPayload;
    private makeRequest;
    private fetchWithRetry;
    private waitForEventResponse;
    private sendTrainingEvent;
    private getTrainingEndpoint;
    private delay;
}
export declare class EventSendError extends Error {
    readonly event: DomainEvent;
    readonly cause?: Error | undefined;
    constructor(message: string, event: DomainEvent, cause?: Error | undefined);
}
export declare class WorkflowError extends Error {
    readonly partialResults: any;
    constructor(message: string, partialResults: any);
}
export default EventDrivenWebBuddyClient;
//# sourceMappingURL=event-driven-client.d.ts.map