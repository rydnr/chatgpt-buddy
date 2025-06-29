// A unique identifier for tracking a request through the system
type CorrelationId = string;

// The type of action to be performed in the content script
type ActionType = 'SELECT_PROJECT' | 'SELECT_CHAT' | 'GET_RESPONSE' | 'FILL_PROMPT' | 'DOWNLOAD_IMAGE';

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

// Specific Message Types
export type SelectProjectMessage = BaseMessage<'SELECT_PROJECT', SelectProjectPayload>;
export type SelectChatMessage = BaseMessage<'SELECT_CHAT', SelectChatPayload>;
export type GetResponseMessage = BaseMessage<'GET_RESPONSE', GetResponsePayload>;
export type FillPromptMessage = BaseMessage<'FILL_PROMPT', FillPromptPayload>;
export type DownloadImageMessage = BaseMessage<'DOWNLOAD_IMAGE', DownloadImagePayload>;


// Union type for all possible messages sent to a content script
export type AgentMessage = SelectProjectMessage | SelectChatMessage | GetResponseMessage | FillPromptMessage | DownloadImageMessage;

// Response message from content script to background/server
export interface ActionResponse {
    correlationId: CorrelationId;
    status: 'success' | 'error';
    data?: any; // e.g., the page title, or text content
    error?: string; // A descriptive error message
}
