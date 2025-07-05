// Browser extension background script for Web-Buddy integration
// Handles WebSocket communication with Web-Buddy server

import { globalMessageStore, messageStoreActions } from './message-store.js';
import { globalTimeTravelUI } from './time-travel-ui.js';

let DEFAULT_SERVER_URL = 'ws://localhost:3003/ws';
let ws: WebSocket | null = null;
let extensionId: string = '';
let connectionStatus = {
  connected: false,
  connecting: false,
  serverUrl: DEFAULT_SERVER_URL,
  lastMessage: 'None',
  lastError: '',
  autoReconnect: false
};

// Store extension test data for E2E testing
(globalThis as any).extensionTestData = {
  lastReceivedMessage: null,
  lastResponse: null,
  webSocketMessages: []
};

function connectWebSocket(serverUrl?: string) {
  if (connectionStatus.connecting || connectionStatus.connected) {
    console.log('⚠️ Already connected or connecting');
    return;
  }

  const url = serverUrl || connectionStatus.serverUrl;
  connectionStatus.connecting = true;
  connectionStatus.serverUrl = url;
  connectionStatus.lastError = '';
  updateStatus();

  console.log(`🔌 Attempting to connect to: ${url}`);
  
  try {
    ws = new WebSocket(url);
  } catch (error) {
    console.error('❌ Failed to create WebSocket:', error);
    connectionStatus.connecting = false;
    connectionStatus.lastError = `Failed to create WebSocket: ${error}`;
    updateStatus();
    return;
  }

  ws.onopen = () => {
    console.log('✅ Connected to Web-Buddy server');
    extensionId = chrome.runtime.id;
    connectionStatus.connected = true;
    connectionStatus.connecting = false;
    connectionStatus.lastMessage = 'Connected successfully';
    updateStatus();
    
    // Register the extension with the server
    const registrationMessage = {
      type: 'extensionRegistered',
      payload: {
        extensionId: extensionId,
        version: chrome.runtime.getManifest().version,
        capabilities: ['domManipulation', 'webAutomation']
      },
      correlationId: `reg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventId: `ext-reg-${Date.now()}`
    };
    
    ws?.send(JSON.stringify(registrationMessage));
    
    // Send periodic heartbeat
    startHeartbeat();
  };

  ws.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('📨 Received message from server:', message);
      
      connectionStatus.lastMessage = `${message.type} (${new Date().toLocaleTimeString()})`;
      updateStatus();
      
      // Store for E2E testing
      (globalThis as any).extensionTestData.lastReceivedMessage = message;
      (globalThis as any).extensionTestData.webSocketMessages.push(message);
      
      // Add inbound message to message store for time-travel debugging
      const metadata = {
        extensionId: chrome.runtime.id,
        tabId: message.tabId,
        windowId: undefined,
        url: undefined,
        userAgent: navigator.userAgent
      };
      
      globalMessageStore.addInboundMessage(
        message.type || 'UNKNOWN_MESSAGE_TYPE',
        message,
        message.correlationId || `inbound-${Date.now()}`,
        metadata
      );
      
      // Handle different message types using double dispatch
      await messageDispatcher.dispatch(message);
      
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
      connectionStatus.lastError = `Message parsing error: ${error}`;
      updateStatus();
    }
  };

  ws.onclose = (event) => {
    console.log(`🔌 Disconnected from server (code: ${event.code})`);
    connectionStatus.connected = false;
    connectionStatus.connecting = false;
    connectionStatus.lastMessage = `Disconnected (${event.code})`;
    updateStatus();
    
    // Auto-reconnect if enabled and not a manual disconnect
    if (connectionStatus.autoReconnect && event.code !== 1000) {
      console.log('🔄 Auto-reconnecting in 5 seconds...');
      setTimeout(() => connectWebSocket(), 5000);
    }
  };

  ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
    connectionStatus.connecting = false;
    connectionStatus.lastError = 'Connection failed';
    updateStatus();
  };
}

function disconnectWebSocket() {
  connectionStatus.autoReconnect = false;
  
  if (ws) {
    ws.close(1000, 'Manual disconnect'); // Normal closure
    ws = null;
  }
  
  connectionStatus.connected = false;
  connectionStatus.connecting = false;
  connectionStatus.lastMessage = 'Manually disconnected';
  updateStatus();
  
  console.log('🔌 WebSocket disconnected manually');
}

let heartbeatInterval: any = null;

function startHeartbeat() {
  // Clear existing interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  // Send heartbeat every 10 seconds
  heartbeatInterval = setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'heartbeat',
        correlationId: `heartbeat-${Date.now()}`,
        timestamp: new Date().toISOString()
      }));
    }
  }, 10000);
}

function updateStatus() {
  // Update connection status based on actual WebSocket state
  const actuallyConnected = ws?.readyState === WebSocket.OPEN;
  connectionStatus.connected = actuallyConnected;
  
  console.log('🔄 Updating status:', {
    connected: connectionStatus.connected,
    connecting: connectionStatus.connecting,
    wsState: ws?.readyState,
    lastMessage: connectionStatus.lastMessage
  });
  
  // Notify popup of status change
  chrome.runtime.sendMessage({
    type: 'statusUpdate',
    status: {
      ...connectionStatus,
      extensionId: extensionId,
      connected: actuallyConnected
    }
  }).catch((error) => {
    // Popup might not be open, ignore error but log for debugging
    console.log('📨 Could not send status to popup (popup may be closed):', error?.message);
  });
}

// Message Handler Classes using Double Dispatch Pattern
abstract class MessageHandler {
  abstract handle(message: any): Promise<void> | void;
  
  // Helper method to send response and track in message store
  protected sendResponse(response: any, correlationId: string): void {
    try {
      // Add outbound message to message store
      const metadata = {
        extensionId: chrome.runtime.id,
        tabId: undefined,
        windowId: undefined,
        url: undefined,
        userAgent: navigator.userAgent
      };
      
      globalMessageStore.addOutboundMessage(
        response.type || 'RESPONSE',
        response,
        correlationId,
        metadata
      );
      
      // Send WebSocket response
      ws?.send(JSON.stringify(response));
      (globalThis as any).extensionTestData.lastResponse = response;
      
      // Mark the original message as successful
      globalMessageStore.markMessageSuccess(correlationId, response);
      
      console.log('📤 Response sent and tracked:', response);
      
    } catch (error) {
      console.error('❌ Failed to send response:', error);
      globalMessageStore.markMessageError(correlationId, error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  // Helper method to send error response and track in message store
  protected sendErrorResponse(correlationId: string, error: string, additionalData?: any): void {
    const errorResponse = {
      correlationId,
      status: 'error',
      error,
      timestamp: new Date().toISOString(),
      ...additionalData
    };
    
    try {
      // Add outbound error to message store
      const metadata = {
        extensionId: chrome.runtime.id,
        tabId: undefined,
        windowId: undefined,
        url: undefined,
        userAgent: navigator.userAgent
      };
      
      globalMessageStore.addOutboundMessage(
        'ERROR_RESPONSE',
        errorResponse,
        correlationId,
        metadata
      );
      
      // Send WebSocket error response
      ws?.send(JSON.stringify(errorResponse));
      (globalThis as any).extensionTestData.lastResponse = errorResponse;
      
      // Mark the original message as failed
      globalMessageStore.markMessageError(correlationId, error);
      
      console.log('📤 Error response sent and tracked:', errorResponse);
      
    } catch (sendError) {
      console.error('❌ Failed to send error response:', sendError);
    }
  }
}

class AutomationRequestedHandler extends MessageHandler {
  async handle(message: any): Promise<void> {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }
      
      // Forward to content script
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error sending to content script:', chrome.runtime.lastError.message);
          this.sendErrorResponse(
            message.correlationId,
            chrome.runtime.lastError.message || 'Content script not reachable'
          );
        } else {
          console.log('✅ Received response from content script:', response);
          this.sendResponse(response, message.correlationId);
        }
      });
      
    } catch (error) {
      console.error('❌ Error handling automation request:', error);
      this.sendErrorResponse(
        message.correlationId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}

class TabSwitchRequestedHandler extends MessageHandler {
  async handle(message: any): Promise<void> {
    try {
      const { payload, correlationId } = message;
      const { title } = payload;
      
      console.log(`🔄 Switching to tab with title: "${title}"`);
      
      // Query all tabs to find the one with matching title
      const tabs = await chrome.tabs.query({});
      console.log(`🔍 Found ${tabs.length} total tabs`);
      
      // Find tab with matching title (case-insensitive partial match)
      const matchingTabs = tabs.filter(tab => 
        tab.title && tab.title.toLowerCase().includes(title.toLowerCase())
      );
      
      if (matchingTabs.length === 0) {
        this.sendErrorResponse(
          correlationId,
          `No tab found with title containing: "${title}"`,
          { availableTabs: tabs.map(tab => ({ id: tab.id, title: tab.title, url: tab.url })) }
        );
        return;
      }
      
      // Use the first matching tab
      const targetTab = matchingTabs[0];
      console.log(`✅ Found matching tab: "${targetTab.title}" (ID: ${targetTab.id})`);
      
      // Switch to the tab by updating it (making it active) and focusing its window
      await chrome.tabs.update(targetTab.id!, { active: true });
      await chrome.windows.update(targetTab.windowId!, { focused: true });
      
      console.log(`🎯 Successfully switched to tab: "${targetTab.title}"`);
      
      const successResponse = {
        correlationId: correlationId,
        status: 'success',
        data: {
          action: 'TabSwitchRequested',
          switchedTo: {
            id: targetTab.id,
            title: targetTab.title,
            url: targetTab.url,
            windowId: targetTab.windowId
          },
          totalMatches: matchingTabs.length
        },
        timestamp: new Date().toISOString()
      };
      
      this.sendResponse(successResponse, correlationId);
      
    } catch (error) {
      console.error('❌ Error handling tab switch request:', error);
      this.sendErrorResponse(
        message.correlationId,
        error instanceof Error ? error.message : 'Unknown tab switch error'
      );
    }
  }
}

class PingHandler extends MessageHandler {
  handle(message: any): void {
    const pongResponse = {
      type: 'pong',
      correlationId: message.correlationId,
      payload: {
        originalMessage: message.payload || 'ping',
        extensionId: extensionId,
        timestamp: new Date().toISOString()
      }
    };
    ws?.send(JSON.stringify(pongResponse));
    (globalThis as any).extensionTestData.lastResponse = pongResponse;
  }
}

class RegistrationAckHandler extends MessageHandler {
  handle(message: any): void {
    console.log('✅ Registration acknowledged by server');
    connectionStatus.lastMessage = 'Registered with server';
    updateStatus();
  }
}

class HeartbeatAckHandler extends MessageHandler {
  handle(message: any): void {
    console.log('💓 Heartbeat acknowledged by server');
    connectionStatus.lastMessage = `Heartbeat (${new Date().toLocaleTimeString()})`;
    updateStatus();
  }
}

class ContractExecutionRequestedHandler extends MessageHandler {
  async handle(message: any): Promise<void> {
    try {
      console.log('📋 Handling contract execution request:', message);
      
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }
      
      // Forward to content script with contract execution type
      const contractMessage = {
        ...message,
        type: 'contractExecutionRequested'
      };
      
      chrome.tabs.sendMessage(tab.id, contractMessage, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error sending contract execution to content script:', chrome.runtime.lastError.message);
          this.sendErrorResponse(
            message.correlationId,
            chrome.runtime.lastError.message || 'Content script not reachable for contract execution'
          );
        } else {
          console.log('✅ Received contract execution response from content script:', response);
          this.sendResponse(response, message.correlationId);
        }
      });
      
    } catch (error) {
      console.error('❌ Error handling contract execution request:', error);
      this.sendErrorResponse(
        message.correlationId,
        error instanceof Error ? error.message : 'Unknown contract execution error'
      );
    }
  }
}

class ContractDiscoveryRequestedHandler extends MessageHandler {
  async handle(message: any): Promise<void> {
    try {
      console.log('🔍 Handling contract discovery request:', message);
      
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }
      
      // Forward to content script with contract discovery type
      const discoveryMessage = {
        ...message,
        type: 'contractDiscoveryRequested'
      };
      
      chrome.tabs.sendMessage(tab.id, discoveryMessage, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error sending contract discovery to content script:', chrome.runtime.lastError.message);
          this.sendErrorResponse(
            message.correlationId,
            chrome.runtime.lastError.message || 'Content script not reachable for contract discovery'
          );
        } else {
          console.log('✅ Received contract discovery response from content script:', response);
          this.sendResponse(response, message.correlationId);
        }
      });
      
    } catch (error) {
      console.error('❌ Error handling contract discovery request:', error);
      this.sendErrorResponse(
        message.correlationId,
        error instanceof Error ? error.message : 'Unknown contract discovery error'
      );
    }
  }
}

class ContractAvailabilityCheckHandler extends MessageHandler {
  async handle(message: any): Promise<void> {
    try {
      console.log('🔍 Handling contract availability check:', message);
      
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }
      
      // Forward to content script with availability check type
      const availabilityMessage = {
        ...message,
        type: 'contractAvailabilityCheck'
      };
      
      chrome.tabs.sendMessage(tab.id, availabilityMessage, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error sending contract availability check to content script:', chrome.runtime.lastError.message);
          this.sendErrorResponse(
            message.correlationId,
            chrome.runtime.lastError.message || 'Content script not reachable for availability check'
          );
        } else {
          console.log('✅ Received contract availability response from content script:', response);
          this.sendResponse(response, message.correlationId);
        }
      });
      
    } catch (error) {
      console.error('❌ Error handling contract availability check:', error);
      this.sendErrorResponse(
        message.correlationId,
        error instanceof Error ? error.message : 'Unknown contract availability error'
      );
    }
  }
}

class MessageDispatcher {
  private handlers: Map<string, MessageHandler> = new Map();

  constructor() {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Using camel case for consistency
    this.handlers.set('AutomationRequested', new AutomationRequestedHandler());
    this.handlers.set('TabSwitchRequested', new TabSwitchRequestedHandler());
    this.handlers.set('Ping', new PingHandler());
    this.handlers.set('RegistrationAck', new RegistrationAckHandler());
    this.handlers.set('HeartbeatAck', new HeartbeatAckHandler());
    
    // Contract-based handlers
    this.handlers.set('ContractExecutionRequested', new ContractExecutionRequestedHandler());
    this.handlers.set('ContractDiscoveryRequested', new ContractDiscoveryRequestedHandler());
    this.handlers.set('ContractAvailabilityCheck', new ContractAvailabilityCheckHandler());
    
    // Keep legacy names for backward compatibility
    this.handlers.set('automationRequested', new AutomationRequestedHandler());
    this.handlers.set('ping', new PingHandler());
    this.handlers.set('registrationAck', new RegistrationAckHandler());
    this.handlers.set('heartbeatAck', new HeartbeatAckHandler());
    
    // Contract-based handlers (snake_case for API compatibility)
    this.handlers.set('contractExecutionRequested', new ContractExecutionRequestedHandler());
    this.handlers.set('contractDiscoveryRequested', new ContractDiscoveryRequestedHandler());
    this.handlers.set('contractAvailabilityCheck', new ContractAvailabilityCheckHandler());
  }

  async dispatch(message: any): Promise<void> {
    const handler = this.handlers.get(message.type);
    
    if (handler) {
      await handler.handle(message);
    } else {
      console.log('⚠️ Unknown message type:', message.type);
      console.log('📋 Available handlers:', Array.from(this.handlers.keys()));
    }
  }

  // Method to register new handlers dynamically
  registerHandler(messageType: string, handler: MessageHandler): void {
    this.handlers.set(messageType, handler);
    console.log(`📝 Registered new handler for: ${messageType}`);
  }
}

// Initialize the message dispatcher
const messageDispatcher = new MessageDispatcher();

// Initialize extension (don't auto-connect)
extensionId = chrome.runtime.id;

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Received message:', message);
  
  // Handle popup commands
  if (message.action === 'connect') {
    connectWebSocket(message.serverUrl);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'disconnect') {
    disconnectWebSocket();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'showTimeTravelUI') {
    // Inject time travel UI into the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showTimeTravelUI' });
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true;
  }
  
  if (message.action === 'getMessageStoreState') {
    sendResponse({ 
      success: true, 
      state: globalMessageStore.getState(),
      statistics: globalMessageStore.getState().messages.length > 0 ? 
        (() => {
          const stats = { total: 0, success: 0, error: 0, pending: 0, inbound: 0, outbound: 0 };
          globalMessageStore.getState().messages.forEach(msg => {
            stats.total++;
            stats[msg.status]++;
            stats[msg.direction]++;
          });
          return stats;
        })() : { total: 0, success: 0, error: 0, pending: 0, inbound: 0, outbound: 0 }
    });
    return true;
  }
  
  if (message.action === 'getStatus') {
    console.log('📊 Status requested by popup, current internal status:', connectionStatus);
    console.log('📊 WebSocket actual state:', ws ? `readyState=${ws.readyState}` : 'WebSocket is null');
    
    const actuallyConnected = ws?.readyState === WebSocket.OPEN;
    const currentStatus = {
      ...connectionStatus,
      extensionId: extensionId,
      connected: actuallyConnected,
      connecting: connectionStatus.connecting
    };
    
    console.log('📊 Sending status response to popup:', currentStatus);
    sendResponse({ 
      success: true, 
      status: currentStatus
    });
    return true;
  }
  
  // Forward responses to server if they have correlation IDs
  if (message.correlationId && message.status) {
    ws?.send(JSON.stringify(message));
    (globalThis as any).extensionTestData.lastResponse = message;
  }
  
  // Handle content script readiness notifications
  if (message.type === 'CONTENT_SCRIPT_READY') {
    console.log('✅ Content script ready in tab:', sender.tab?.id);
  }
  
  return true; // Keep message channel open for async responses
});

// Handle extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 Web-Buddy extension installed');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 Web-Buddy extension starting up');
});