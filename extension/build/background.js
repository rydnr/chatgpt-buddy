"use strict";
// Browser extension background script for Web-Buddy integration
// Handles WebSocket communication with Web-Buddy server
let DEFAULT_SERVER_URL = 'ws://localhost:3003/ws';
let ws = null;
let extensionId = '';
let connectionStatus = {
    connected: false,
    connecting: false,
    serverUrl: DEFAULT_SERVER_URL,
    lastMessage: 'None',
    lastError: '',
    autoReconnect: false
};
// Store extension test data for E2E testing
globalThis.extensionTestData = {
    lastReceivedMessage: null,
    lastResponse: null,
    webSocketMessages: []
};

function connectWebSocket(serverUrl) {
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
    }
    catch (error) {
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
    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log('📨 Received message from server:', message);
            connectionStatus.lastMessage = `${message.type} (${new Date().toLocaleTimeString()})`;
            updateStatus();
            // Store for E2E testing
            globalThis.extensionTestData.lastReceivedMessage = message;
            globalThis.extensionTestData.webSocketMessages.push(message);
            // Handle different message types
            if (message.type === 'automationRequested') {
                handleAutomationRequest(message);
            }
            else if (message.type === 'ping') {
                handlePingMessage(message);
            }
            else if (message.type === 'registrationAck') {
                console.log('✅ Registration acknowledged by server');
                connectionStatus.lastMessage = 'Registered with server';
                updateStatus();
            }
            else if (message.type === 'heartbeatAck') {
                console.log('💓 Heartbeat acknowledged by server');
                connectionStatus.lastMessage = `Heartbeat (${new Date().toLocaleTimeString()})`;
                updateStatus();
            }
            else {
                console.log('⚠️ Unknown message type:', message.type);
            }
        }
        catch (error) {
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
let heartbeatInterval = null;
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
async function handleAutomationRequest(message) {
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
                const errorResponse = {
                    correlationId: message.correlationId,
                    status: 'error',
                    error: chrome.runtime.lastError.message || 'Content script not reachable',
                    timestamp: new Date().toISOString()
                };
                ws?.send(JSON.stringify(errorResponse));
                globalThis.extensionTestData.lastResponse = errorResponse;
            }
            else {
                console.log('✅ Received response from content script:', response);
                ws?.send(JSON.stringify(response));
                globalThis.extensionTestData.lastResponse = response;
            }
        });
    }
    catch (error) {
        console.error('❌ Error handling automation request:', error);
        const errorResponse = {
            correlationId: message.correlationId,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        ws?.send(JSON.stringify(errorResponse));
        globalThis.extensionTestData.lastResponse = errorResponse;
    }
}
function handlePingMessage(message) {
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
    globalThis.extensionTestData.lastResponse = pongResponse;
}
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
    
    // Handle storage management requests - simplified
    if (message.action === 'getStorageStats') {
        console.log('💾 Storage stats requested');
        sendResponse({ 
            success: true, 
            stats: { automationPatterns: 0, userInteractions: 0, websiteConfigs: 0 },
            note: 'Storage functionality will be implemented soon'
        });
        return true;
    }
    if (message.action === 'getAutomationPatterns') {
        console.log('💾 Automation patterns requested');
        sendResponse({ 
            success: true, 
            patterns: [],
            note: 'Storage functionality will be implemented soon'
        });
        return true;
    }
    if (message.action === 'clearOldData') {
        console.log('💾 Clear old data requested');
        sendResponse({ 
            success: true, 
            message: 'Storage functionality will be implemented soon'
        });
        return true;
    }
    
    // Forward responses to server if they have correlation IDs
    if (message.correlationId && message.status) {
        ws?.send(JSON.stringify(message));
        globalThis.extensionTestData.lastResponse = message;
    }
    // Handle content script readiness notifications
    if (message.type === 'CONTENT_SCRIPT_READY') {
        console.log('✅ Content script ready in tab:', sender.tab?.id, 'URL:', message.url);
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