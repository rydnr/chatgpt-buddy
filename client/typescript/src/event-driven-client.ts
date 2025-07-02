/*
                        Web-Buddy Framework
                        Event-Driven TypeScript Client

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

import { 
    DomainEvent,
    EventResponse,
    ClientConfig,
    ProjectSelectionRequested,
    ProjectSelected,
    ProjectSelectionFailed,
    ChatSelectionRequested,
    ChatSelected,
    ChatSelectionFailed,
    PromptSubmissionRequested,
    PromptSubmitted,
    PromptSubmissionFailed,
    ResponseRetrievalRequested,
    ResponseRetrieved,
    ResponseRetrievalFailed,
    GoogleImageDownloadRequested,
    GoogleImageDownloadCompleted,
    GoogleImageDownloadFailed,
    FileDownloadRequested,
    FileDownloadStarted,
    FileDownloadFailed,
    TrainingModeRequested,
    TrainingModeEnabled,
    AutomationPatternListRequested,
    AutomationPatternListProvided
} from './types';

/**
 * Event-Driven Web-Buddy Client
 * 
 * Pure event-driven interface following the Web-Buddy Framework's EDA principles.
 * All operations are performed by sending domain events and receiving event responses.
 */
export class EventDrivenWebBuddyClient {
    private config: ClientConfig;
    private eventQueue: Map<string, Promise<EventResponse>> = new Map();

    constructor(config: ClientConfig) {
        this.config = {
            timeout: 30000,
            retries: 3,
            ...config
        };
    }

    // === Core Event Sending Interface ===

    /**
     * Sends a domain event and waits for response
     * This is the low-level interface that all other methods use
     */
    public async sendEvent<TEvent extends DomainEvent, TResponse extends EventResponse>(
        event: TEvent,
        extensionId: string,
        tabId: number
    ): Promise<TResponse> {
        const correlationId = event.correlationId || this.generateCorrelationId();
        
        try {
            // Create the dispatch payload in Web-Buddy format
            const dispatchPayload = {
                target: {
                    extensionId,
                    tabId
                },
                message: {
                    action: this.mapEventToAction(event),
                    payload: this.extractEventPayload(event),
                    correlationId
                }
            };

            // Send HTTP request to server
            const response = await this.makeRequest('POST', '/api/dispatch', dispatchPayload);
            
            // Wait for and return the event response
            return await this.waitForEventResponse<TResponse>(correlationId);
            
        } catch (error) {
            throw new EventSendError(
                `Failed to send event ${event.constructor.name}: ${error.message}`,
                event,
                error
            );
        }
    }

    /**
     * Sends multiple events in sequence
     */
    public async sendEvents<TResponse extends EventResponse>(
        events: Array<{ event: DomainEvent; extensionId: string; tabId: number }>,
        options?: { parallel?: boolean; stopOnError?: boolean }
    ): Promise<TResponse[]> {
        const { parallel = false, stopOnError = true } = options || {};

        if (parallel) {
            const promises = events.map(({ event, extensionId, tabId }) => 
                this.sendEvent(event, extensionId, tabId)
            );
            return await Promise.all(promises);
        } else {
            const results: TResponse[] = [];
            for (const { event, extensionId, tabId } of events) {
                try {
                    const result = await this.sendEvent<DomainEvent, TResponse>(event, extensionId, tabId);
                    results.push(result);
                } catch (error) {
                    if (stopOnError) {
                        throw error;
                    }
                    // Continue with next event if not stopping on error
                    console.warn(`Event ${event.constructor.name} failed:`, error);
                }
            }
            return results;
        }
    }

    // === High-Level Convenience Methods ===
    // These provide a more user-friendly interface while maintaining event-driven architecture

    /**
     * Requests ChatGPT project selection
     */
    public async requestProjectSelection(
        extensionId: string,
        tabId: number,
        projectName: string,
        options?: { selector?: string }
    ): Promise<ProjectSelected | ProjectSelectionFailed> {
        const event = new ProjectSelectionRequested(
            projectName,
            options?.selector,
            this.generateCorrelationId()
        );

        return await this.sendEvent<ProjectSelectionRequested, ProjectSelected | ProjectSelectionFailed>(
            event, extensionId, tabId
        );
    }

    /**
     * Requests chat selection
     */
    public async requestChatSelection(
        extensionId: string,
        tabId: number,
        chatTitle: string,
        options?: { selector?: string }
    ): Promise<ChatSelected | ChatSelectionFailed> {
        const event = new ChatSelectionRequested(
            chatTitle,
            options?.selector,
            this.generateCorrelationId()
        );

        return await this.sendEvent<ChatSelectionRequested, ChatSelected | ChatSelectionFailed>(
            event, extensionId, tabId
        );
    }

    /**
     * Requests prompt submission
     */
    public async requestPromptSubmission(
        extensionId: string,
        tabId: number,
        promptText: string,
        options?: { selector?: string }
    ): Promise<PromptSubmitted | PromptSubmissionFailed> {
        const event = new PromptSubmissionRequested(
            promptText,
            options?.selector || '#prompt-textarea',
            this.generateCorrelationId()
        );

        return await this.sendEvent<PromptSubmissionRequested, PromptSubmitted | PromptSubmissionFailed>(
            event, extensionId, tabId
        );
    }

    /**
     * Requests response retrieval from ChatGPT
     */
    public async requestResponseRetrieval(
        extensionId: string,
        tabId: number,
        options?: { selector?: string; timeout?: number }
    ): Promise<ResponseRetrieved | ResponseRetrievalFailed> {
        const event = new ResponseRetrievalRequested(
            options?.selector || '[data-message-author-role="assistant"]',
            options?.timeout || 30000,
            this.generateCorrelationId()
        );

        return await this.sendEvent<ResponseRetrievalRequested, ResponseRetrieved | ResponseRetrievalFailed>(
            event, extensionId, tabId
        );
    }

    /**
     * Requests Google Images download
     */
    public async requestGoogleImageDownload(
        extensionId: string,
        tabId: number,
        imageElement: {
            src: string;
            alt?: string;
            title?: string;
            width?: number;
            height?: number;
        },
        options?: {
            searchQuery?: string;
            filename?: string;
        }
    ): Promise<GoogleImageDownloadCompleted | GoogleImageDownloadFailed> {
        const event = new GoogleImageDownloadRequested(
            imageElement,
            options?.searchQuery,
            options?.filename,
            this.generateCorrelationId()
        );

        return await this.sendEvent<GoogleImageDownloadRequested, GoogleImageDownloadCompleted | GoogleImageDownloadFailed>(
            event, extensionId, tabId
        );
    }

    /**
     * Requests file download
     */
    public async requestFileDownload(
        extensionId: string,
        tabId: number,
        url: string,
        options?: {
            filename?: string;
            conflictAction?: 'uniquify' | 'overwrite' | 'prompt';
            saveAs?: boolean;
        }
    ): Promise<FileDownloadStarted | FileDownloadFailed> {
        const event = new FileDownloadRequested(
            url,
            options?.filename,
            options?.conflictAction,
            options?.saveAs,
            this.generateCorrelationId()
        );

        return await this.sendEvent<FileDownloadRequested, FileDownloadStarted | FileDownloadFailed>(
            event, extensionId, tabId
        );
    }

    /**
     * Requests training mode activation
     */
    public async requestTrainingMode(
        website: string
    ): Promise<TrainingModeEnabled> {
        const event = new TrainingModeRequested(
            website,
            this.generateCorrelationId()
        );

        // Training mode requests go directly to server, not through extension
        return await this.sendTrainingEvent(event);
    }

    /**
     * Requests automation pattern list
     */
    public async requestAutomationPatterns(
        filters?: {
            website?: string;
            messageType?: string;
            confidenceThreshold?: number;
        }
    ): Promise<AutomationPatternListProvided> {
        const event = new AutomationPatternListRequested(
            filters,
            this.generateCorrelationId()
        );

        return await this.sendTrainingEvent(event);
    }

    // === Workflow Convenience Methods ===

    /**
     * Complete ChatGPT workflow: select project, submit prompt, get response
     */
    public async executeFullChatGPTWorkflow(
        extensionId: string,
        tabId: number,
        workflow: {
            projectName: string;
            promptText: string;
            chatTitle?: string;
        }
    ): Promise<{
        projectSelection: ProjectSelected | ProjectSelectionFailed;
        chatSelection?: ChatSelected | ChatSelectionFailed;
        promptSubmission: PromptSubmitted | PromptSubmissionFailed;
        responseRetrieval: ResponseRetrieved | ResponseRetrievalFailed;
    }> {
        const results: any = {};

        // Step 1: Select project
        results.projectSelection = await this.requestProjectSelection(
            extensionId, tabId, workflow.projectName
        );

        if (results.projectSelection instanceof ProjectSelectionFailed) {
            throw new WorkflowError('Project selection failed', results);
        }

        // Step 2: Select chat (optional)
        if (workflow.chatTitle) {
            results.chatSelection = await this.requestChatSelection(
                extensionId, tabId, workflow.chatTitle
            );

            if (results.chatSelection instanceof ChatSelectionFailed) {
                throw new WorkflowError('Chat selection failed', results);
            }
        }

        // Step 3: Submit prompt
        results.promptSubmission = await this.requestPromptSubmission(
            extensionId, tabId, workflow.promptText
        );

        if (results.promptSubmission instanceof PromptSubmissionFailed) {
            throw new WorkflowError('Prompt submission failed', results);
        }

        // Step 4: Get response
        results.responseRetrieval = await this.requestResponseRetrieval(
            extensionId, tabId
        );

        return results;
    }

    /**
     * Batch Google Images download
     */
    public async downloadMultipleGoogleImages(
        extensionId: string,
        tabId: number,
        images: Array<{
            element: any;
            searchQuery?: string;
            filename?: string;
        }>,
        options?: {
            parallel?: boolean;
            delayBetween?: number;
        }
    ): Promise<Array<GoogleImageDownloadCompleted | GoogleImageDownloadFailed>> {
        const { parallel = false, delayBetween = 1000 } = options || {};

        const downloadEvents = images.map((img, index) => ({
            event: new GoogleImageDownloadRequested(
                img.element,
                img.searchQuery,
                img.filename || `image_${index + 1}`,
                this.generateCorrelationId()
            ),
            extensionId,
            tabId
        }));

        if (parallel) {
            return await this.sendEvents(downloadEvents, { parallel: true });
        } else {
            const results = [];
            for (const eventData of downloadEvents) {
                const result = await this.sendEvent(eventData.event, eventData.extensionId, eventData.tabId);
                results.push(result);
                
                if (delayBetween > 0) {
                    await this.delay(delayBetween);
                }
            }
            return results;
        }
    }

    // === Utility Methods ===

    /**
     * Tests connectivity with a simple ping event
     */
    public async ping(): Promise<{ success: boolean; latency: number }> {
        const start = Date.now();
        try {
            await this.makeRequest('GET', '/docs/health');
            return {
                success: true,
                latency: Date.now() - start
            };
        } catch (error) {
            return {
                success: false,
                latency: Date.now() - start
            };
        }
    }

    /**
     * Gets client configuration
     */
    public getConfig(): ClientConfig {
        return { ...this.config };
    }

    /**
     * Updates client configuration
     */
    public updateConfig(updates: Partial<ClientConfig>): void {
        this.config = { ...this.config, ...updates };
    }

    // === Private Helper Methods ===

    private generateCorrelationId(): string {
        return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private mapEventToAction(event: DomainEvent): string {
        const eventTypeMap: Record<string, string> = {
            'ProjectSelectionRequested': 'SELECT_PROJECT',
            'ChatSelectionRequested': 'SELECT_CHAT', 
            'PromptSubmissionRequested': 'FILL_PROMPT',
            'ResponseRetrievalRequested': 'GET_RESPONSE',
            'GoogleImageDownloadRequested': 'DOWNLOAD_IMAGE',
            'FileDownloadRequested': 'DOWNLOAD_FILE'
        };

        const action = eventTypeMap[event.constructor.name];
        if (!action) {
            throw new Error(`No action mapping found for event type: ${event.constructor.name}`);
        }
        return action;
    }

    private extractEventPayload(event: DomainEvent): any {
        // Extract payload based on event type
        if (event instanceof ProjectSelectionRequested) {
            return { 
                selector: event.selector || `[data-project-name="${event.projectName}"]`
            };
        }
        if (event instanceof PromptSubmissionRequested) {
            return {
                selector: event.selector,
                value: event.promptText
            };
        }
        if (event instanceof GoogleImageDownloadRequested) {
            return {
                selector: 'img', // Will be refined by the Google Images adapter
                imageElement: event.imageElement,
                searchQuery: event.searchQuery,
                filename: event.filename
            };
        }
        if (event instanceof FileDownloadRequested) {
            return {
                url: event.url,
                filename: event.filename,
                conflictAction: event.conflictAction,
                saveAs: event.saveAs
            };
        }
        
        // Default payload extraction
        return Object.fromEntries(
            Object.entries(event).filter(([key]) => key !== 'correlationId')
        );
    }

    private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
        const url = `${this.config.baseUrl}${endpoint}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'User-Agent': this.config.userAgent || 'WebBuddyEventDrivenSDK/1.0.0'
        };

        const options: RequestInit = {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined
        };

        const response = await this.fetchWithRetry(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    private async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
        let lastError: Error;
        
        for (let attempt = 0; attempt < (this.config.retries || 3); attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);
                
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                lastError = error as Error;
                
                if (attempt < (this.config.retries || 3) - 1) {
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
            }
        }
        
        throw lastError!;
    }

    private async waitForEventResponse<TResponse extends EventResponse>(
        correlationId: string
    ): Promise<TResponse> {
        // In a real implementation, this would listen for WebSocket responses
        // or poll for the response. For now, we'll simulate immediate response.
        
        // This is a placeholder - in the real implementation, this would:
        // 1. Listen on WebSocket for responses with matching correlationId
        // 2. Or poll a /api/responses/{correlationId} endpoint
        // 3. Or use Server-Sent Events for real-time updates
        
        return await new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    correlationId,
                    success: true,
                    timestamp: new Date()
                } as TResponse);
            }, 100);
        });
    }

    private async sendTrainingEvent<TEvent extends DomainEvent, TResponse extends EventResponse>(
        event: TEvent
    ): Promise<TResponse> {
        // Training events go to specific training endpoints
        const endpoint = this.getTrainingEndpoint(event);
        const payload = this.extractEventPayload(event);
        
        const response = await this.makeRequest('POST', endpoint, payload);
        return response as TResponse;
    }

    private getTrainingEndpoint(event: DomainEvent): string {
        if (event instanceof TrainingModeRequested) {
            return '/api/training/enable';
        }
        if (event instanceof AutomationPatternListRequested) {
            return '/api/training/patterns';
        }
        throw new Error(`No training endpoint for event: ${event.constructor.name}`);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// === Custom Error Types ===

export class EventSendError extends Error {
    constructor(
        message: string,
        public readonly event: DomainEvent,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'EventSendError';
    }
}

export class WorkflowError extends Error {
    constructor(
        message: string,
        public readonly partialResults: any
    ) {
        super(message);
        this.name = 'WorkflowError';
    }
}

export default EventDrivenWebBuddyClient;