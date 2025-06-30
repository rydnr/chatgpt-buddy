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

// Track which tabs have content scripts ready
const readyTabs = new Map(); // Map<tabId, {url, storageReady, timestamp}>
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
    
    // Handle storage management requests
    if (message.action === 'getStorageStats' || message.action === 'getAutomationPatterns' || message.action === 'clearOldData') {
        console.log('💾 Forwarding storage request:', message.action);
        
        // First check if we have any ready tabs
        console.log('💾 Ready tabs:', Array.from(readyTabs.entries()));
        
        if (readyTabs.size > 0) {
            // Use the first ready tab
            const [tabId, tabInfo] = readyTabs.entries().next().value;
            console.log('💾 Using ready tab for storage request:', tabInfo.url, 'ID:', tabId);
            
            chrome.tabs.sendMessage(tabId, {
                type: 'storageRequest',
                action: message.action,
                payload: message,
                correlationId: `storage-${Date.now()}`
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Error with ready tab:', chrome.runtime.lastError.message);
                    // Remove failed tab from ready list
                    readyTabs.delete(tabId);
                    // Fall back to searching all tabs
                    searchAllTabsForStorage();
                } else {
                    console.log('✅ Storage request response from ready tab:', response);
                    sendResponse(response);
                }
            });
        } else {
            // Fall back to searching all tabs
            searchAllTabsForStorage();
        }
        
        function searchAllTabsForStorage() {
            chrome.tabs.query({}, (allTabs) => {
                console.log('💾 All tabs:', allTabs.map(tab => ({ id: tab.id, url: tab.url })));
                
                const regularTabs = allTabs.filter(tab => 
                    tab.url && 
                    !tab.url.startsWith('chrome://') && 
                    !tab.url.startsWith('chrome-extension://') &&
                    !tab.url.startsWith('moz-extension://') &&
                    !tab.url.startsWith('edge://') &&
                    !tab.url.startsWith('about:')
                );
                
                console.log('💾 Regular tabs found:', regularTabs.map(tab => ({ id: tab.id, url: tab.url })));
                
                if (regularTabs.length > 0) {
                    // Use the first regular tab
                    const targetTab = regularTabs[0];
                    console.log('💾 Using fallback tab for storage request:', targetTab.url, 'ID:', targetTab.id);
                
                chrome.tabs.sendMessage(targetTab.id, {
                    type: 'storageRequest',
                    action: message.action,
                    payload: message,
                    correlationId: `storage-${Date.now()}`
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('❌ Error forwarding storage request:', chrome.runtime.lastError.message);
                        // If content script not ready, return default empty data
                        if (message.action === 'getStorageStats') {
                            sendResponse({ 
                                success: true, 
                                stats: { automationPatterns: 0, userInteractions: 0, websiteConfigs: 0 },
                                note: 'Content script not ready, showing default values'
                            });
                        } else {
                            sendResponse({ success: false, error: 'Content script not available' });
                        }
                    } else {
                        console.log('✅ Storage request response:', response);
                        sendResponse(response);
                    }
                });
            } else {
                console.log('💾 No regular tabs found, returning default storage data');
                // No regular tabs available, return default data
                if (message.action === 'getStorageStats') {
                    sendResponse({ 
                        success: true, 
                        stats: { automationPatterns: 0, userInteractions: 0, websiteConfigs: 0 },
                        note: 'No web pages open, showing default values'
                    });
                } else if (message.action === 'getAutomationPatterns') {
                    sendResponse({ 
                        success: true, 
                        patterns: [],
                        note: 'No web pages open'
                    });
                } else {
                    sendResponse({ success: false, error: 'No web pages available for storage operations' });
                }
            }
        });
        return true; // Keep message channel open
    }
    
    // Forward responses to server if they have correlation IDs
    if (message.correlationId && message.status) {
        ws?.send(JSON.stringify(message));
        globalThis.extensionTestData.lastResponse = message;
    }
    // Handle content script readiness notifications
    if (message.type === 'CONTENT_SCRIPT_READY') {
        const tabId = sender.tab?.id;
        console.log('✅ Content script ready in tab:', tabId, 'URL:', message.url, 'Storage:', message.storageReady);
        
        // Register this tab as ready
        if (tabId) {
            readyTabs.set(tabId, {
                url: message.url,
                storageReady: message.storageReady,
                timestamp: Date.now()
            });
            console.log('📝 Registered ready tab:', tabId, 'Total ready tabs:', readyTabs.size);
            
            // Test the connection immediately
            setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                    type: 'ping',
                    correlationId: 'connection-test'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('❌ Content script ping failed:', chrome.runtime.lastError.message);
                        // Remove from ready tabs if ping fails
                        readyTabs.delete(tabId);
                    } else {
                        console.log('✅ Content script ping successful:', response);
                    }
                });
            }, 500);
        }
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
