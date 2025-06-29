import WebSocket from 'ws';
import { AgentMessage, ActionResponse } from '../../shared/types';

const SERVER_URL = 'ws://localhost:3000'; // Replace with your server URL
let ws: WebSocket | null = null;

function connectWebSocket() {
  ws = new WebSocket(SERVER_URL);

  ws.onopen = () => {
    console.log('Connected to server');
    // Register the extension with the server
    // In a real app, this would involve an authentication token
    ws?.send(JSON.stringify({ type: 'REGISTER', extensionId: chrome.runtime.id, secret: 'your-super-secret-extension-key' }));
  };

  ws.onmessage = (event) => {
    const { tabId, message }: { tabId: number; message: AgentMessage } = JSON.parse(event.data as string);
    console.log('Received message from server:', message);

    // Forward the message to the content script of the target tab
    chrome.tabs.sendMessage(tabId, message, (response: ActionResponse) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message to content script:', chrome.runtime.lastError.message);
        // Send an error response back to the server if content script is not ready
        ws?.send(JSON.stringify({
          correlationId: message.correlationId,
          status: 'error',
          error: chrome.runtime.lastError.message || 'Content script not reachable',
        }));
      } else {
        console.log('Received response from content script:', response);
        ws?.send(JSON.stringify(response));
      }
    });
  };

  ws.onclose = () => {
    console.log('Disconnected from server. Attempting to reconnect in 5 seconds...');
    setTimeout(connectWebSocket, 5000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    ws?.close();
  };
}

// Connect when the background script starts
connectWebSocket();

// Listen for messages from content scripts (e.g., initial handshake or unsolicited messages)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message from content script:', message);
  // If it's an ActionResponse, forward it to the server
  if (message.correlationId && message.status) {
    ws?.send(JSON.stringify(message));
  }
  // You might want to handle other types of messages from content scripts here
});
