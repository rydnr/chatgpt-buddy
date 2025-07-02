// A unique identifier for tracking a request through the system
type CorrelationId = string;

// The type of action to be performed in the content script
type ActionType = 'SELECT_PROJECT' | 'SELECT_CHAT' | 'GET_RESPONSE' | 'FILL_PROMPT' | 'DOWNLOAD_IMAGE' | 'DOWNLOAD_FILE' | 'GET_DOWNLOAD_STATUS' | 'LIST_DOWNLOADS';

// Base interface for all messages
interface BaseMessage<T extends ActionType, P> {
  action: T;
  payload: P;
  correlationId: CorrelationId;
}

// Example Payloads
interface SelectProjectPayload {
  selector: string;
}

interface SelectChatPayload {
  selector: string;
}

interface GetResponsePayload {
  selector: string;
}

interface FillPromptPayload {
  selector: string;
  value: string;
}

interface DownloadImagePayload {
  selector: string;
}

interface DownloadFilePayload {
  url: string;
  filename?: string;
  conflictAction?: 'uniquify' | 'overwrite' | 'prompt';
  saveAs?: boolean;
}

interface GetDownloadStatusPayload {
  downloadId: number;
}

interface ListDownloadsPayload {
  query?: {
    orderBy?: string[];
    limit?: number;
    state?: 'in_progress' | 'interrupted' | 'complete';
  };
}

// Specific Message Types
export type SelectProjectMessage = BaseMessage<'SELECT_PROJECT', SelectProjectPayload>;
export type SelectChatMessage = BaseMessage<'SELECT_CHAT', SelectChatPayload>;
export type GetResponseMessage = BaseMessage<'GET_RESPONSE', GetResponsePayload>;
export type FillPromptMessage = BaseMessage<'FILL_PROMPT', FillPromptPayload>;
export type DownloadImageMessage = BaseMessage<'DOWNLOAD_IMAGE', DownloadImagePayload>;
export type DownloadFileMessage = BaseMessage<'DOWNLOAD_FILE', DownloadFilePayload>;
export type GetDownloadStatusMessage = BaseMessage<'GET_DOWNLOAD_STATUS', GetDownloadStatusPayload>;
export type ListDownloadsMessage = BaseMessage<'LIST_DOWNLOADS', ListDownloadsPayload>;


// Union type for all possible messages sent to a content script
export type AgentMessage = SelectProjectMessage | SelectChatMessage | GetResponseMessage | FillPromptMessage | DownloadImageMessage | DownloadFileMessage | GetDownloadStatusMessage | ListDownloadsMessage;

// Response message from content script to background/server
export interface ActionResponse {
    correlationId: CorrelationId;
    status: 'success' | 'error';
    data?: any; // e.g., the page title, or text content
    error?: string; // A descriptive error message
}

// Download-specific response types
export interface DownloadStartedResponse extends ActionResponse {
    data: {
        downloadId: number;
        url: string;
        filename: string;
        state: 'in_progress';
    };
}

export interface DownloadStatusResponse extends ActionResponse {
    data: {
        downloadId: number;
        url: string;
        filename: string;
        state: 'in_progress' | 'interrupted' | 'complete';
        bytesReceived: number;
        totalBytes: number;
        exists?: boolean;
        paused?: boolean;
        error?: string;
    };
}

export interface DownloadListResponse extends ActionResponse {
    data: {
        downloads: Array<{
            id: number;
            url: string;
            filename: string;
            state: 'in_progress' | 'interrupted' | 'complete';
            bytesReceived: number;
            totalBytes: number;
            startTime: string;
            endTime?: string;
        }>;
    };
}

// File system types for downloaded files
export interface DownloadedFile {
    id: number;
    filename: string;
    filepath: string;
    url: string;
    mimeType?: string;
    size: number;
    downloadedAt: Date;
}
