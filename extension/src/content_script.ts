import { AgentMessage, ActionResponse } from '../../shared/types';

chrome.runtime.onMessage.addListener((message: AgentMessage, sender, sendResponse) => {
  console.log('Content script received message:', message);

  let response: ActionResponse;

  try {
    switch (message.action) {
      case 'SELECT_PROJECT':
      case 'SELECT_CHAT':
      case 'GET_RESPONSE':
      case 'FILL_PROMPT':
      case 'DOWNLOAD_IMAGE':
        // Placeholder for actual DOM manipulation logic
        console.log(`Action ${message.action} with payload:`, message.payload);
        response = {
          correlationId: message.correlationId,
          status: 'success',
          data: `Action ${message.action} executed successfully (placeholder).`,
        };
        break;
      default:
        const unknownAction: never = message.action;
        throw new Error(`Unknown action type: ${unknownAction}`);
    }
  } catch (e: any) {
    response = {
      correlationId: message.correlationId,
      status: 'error',
      error: e.message,
    };
  }

  sendResponse(response);
  return true; // Indicates that sendResponse will be called asynchronously
});

// Optional: Send a message to the background script when the content script is injected
// This can be useful for the background script to know when a tab is ready.
// chrome.runtime.sendMessage({ type: "CONTENT_SCRIPT_READY", tabId: sender.tab?.id });
