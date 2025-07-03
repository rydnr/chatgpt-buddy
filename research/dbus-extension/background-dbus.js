/**
 * ChatGPT-buddy D-Bus Integration Background Script
 * 
 * This background script demonstrates how to integrate D-Bus signals
 * with browser extension automation capabilities.
 */

class DBusIntegrationManager {
  constructor() {
    this.nativePort = null;
    this.dbusConnected = false;
    this.messageQueue = [];
    this.eventHandlers = new Map();
    this.connectionAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    this.init();
  }
  
  async init() {
    console.log('🚀 ChatGPT-buddy D-Bus integration initializing...');
    
    // Set up extension event listeners
    this.setupExtensionListeners();
    
    // Attempt to connect to D-Bus native host
    this.connectToDBusHost();
    
    // Set up periodic health checks
    this.startHealthCheck();
  }
  
  setupExtensionListeners() {
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.sendDBusEvent('TAB_UPDATED', {
          tabId: tabId,
          url: tab.url,
          title: tab.title
        });
      }
    });
    
    // Listen for window focus changes
    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        this.sendDBusEvent('WINDOW_FOCUSED', { windowId });
      }
    });
    
    // Listen for extension messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleExtensionMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }
  
  connectToDBusHost() {
    if (this.connectionAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max D-Bus connection attempts reached');
      return;
    }
    
    this.connectionAttempts++;
    console.log(`🔌 Attempting D-Bus connection (attempt ${this.connectionAttempts})`);
    
    try {
      // Connect to native messaging host
      this.nativePort = chrome.runtime.connectNative('chatgpt_buddy_dbus_host');
      
      if (this.nativePort) {
        this.setupNativePortListeners();
        this.dbusConnected = true;
        this.connectionAttempts = 0; // Reset on successful connection
        console.log('✅ Connected to D-Bus native host');
        
        // Send initial status request
        this.sendToNativeHost({
          type: 'GET_STATUS',
          timestamp: Date.now()
        });
        
      } else {
        console.error('❌ Failed to create native port');
        this.scheduleReconnect();
      }
      
    } catch (error) {
      console.error('❌ D-Bus connection error:', error);
      this.dbusConnected = false;
      this.scheduleReconnect();
    }
  }
  
  setupNativePortListeners() {
    this.nativePort.onMessage.addListener((message) => {
      this.handleDBusMessage(message);
    });
    
    this.nativePort.onDisconnect.addListener(() => {
      console.warn('⚠️ D-Bus native host disconnected');
      this.dbusConnected = false;
      this.nativePort = null;
      
      if (chrome.runtime.lastError) {
        console.error('D-Bus disconnect error:', chrome.runtime.lastError.message);
      }
      
      // Attempt to reconnect after delay
      this.scheduleReconnect();
    });
  }
  
  scheduleReconnect() {
    if (this.connectionAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
      console.log(`⏰ Scheduling D-Bus reconnect in ${delay}ms`);
      
      setTimeout(() => {
        this.connectToDBusHost();
      }, delay);
    }
  }
  
  handleDBusMessage(message) {
    console.log('📡 D-Bus message received:', message);
    
    try {
      switch (message.type) {
        case 'DBUS_AUTOMATION_SIGNAL':
          this.handleAutomationSignal(message);
          break;
          
        case 'DBUS_FIREFOX_SIGNAL':
          this.handleFirefoxSignal(message);
          break;
          
        case 'DBUS_METHOD_CALL':
          this.handleMethodCall(message);
          break;
          
        case 'STATUS_UPDATE':
          this.handleStatusUpdate(message);
          break;
          
        case 'LOG_MESSAGE':
          console.log(`📝 D-Bus Host: ${message.message}`);
          break;
          
        case 'MONITOR_STARTED':
          console.log('🔍 D-Bus monitoring started');
          break;
          
        case 'PONG':
          console.log('🏓 D-Bus ping response received');
          break;
          
        default:
          console.warn('❓ Unknown D-Bus message type:', message.type);
      }
      
    } catch (error) {
      console.error('❌ Error handling D-Bus message:', error);
    }
  }
  
  handleAutomationSignal(message) {
    console.log('🤖 Automation signal received via D-Bus:', message.args);
    
    // Parse automation event from D-Bus signal
    if (message.args && message.args.length >= 2) {
      const eventType = message.args[0];
      const eventDataStr = message.args[1];
      
      try {
        const eventData = JSON.parse(eventDataStr);
        this.executeAutomationEvent(eventData);
      } catch (error) {
        console.error('❌ Failed to parse automation event data:', error);
      }
    }
  }
  
  handleFirefoxSignal(message) {
    console.log('🦊 Firefox signal received via D-Bus:', message.args);
    // Handle Firefox-specific signals if needed
  }
  
  handleMethodCall(message) {
    console.log('📞 D-Bus method call received:', message);
    
    if (message.method === 'ExecuteAutomation' && message.args.length > 0) {
      try {
        const automationData = JSON.parse(message.args[0]);
        this.executeAutomationEvent(automationData);
      } catch (error) {
        console.error('❌ Failed to parse method call data:', error);
      }
    }
  }
  
  handleStatusUpdate(message) {
    console.log('📊 D-Bus status update:', {
      connected: message.dbus_connected,
      service_registered: message.service_registered,
      uptime: message.uptime,
      message_count: message.message_count
    });
  }
  
  async executeAutomationEvent(eventData) {
    console.log('🎯 Executing automation event:', eventData);
    
    try {
      const { action, payload, correlationId } = eventData;
      
      switch (action) {
        case 'SELECT_PROJECT':
          await this.selectProject(payload, correlationId);
          break;
          
        case 'FILL_PROMPT':
          await this.fillPrompt(payload, correlationId);
          break;
          
        case 'TAB_SWITCH':
          await this.switchTab(payload, correlationId);
          break;
          
        case 'GET_RESPONSE':
          await this.getResponse(payload, correlationId);
          break;
          
        default:
          console.warn('❓ Unknown automation action:', action);
          this.sendCompletionSignal(correlationId, false, `Unknown action: ${action}`);
      }
      
    } catch (error) {
      console.error('❌ Automation execution error:', error);
      this.sendCompletionSignal(eventData.correlationId, false, error.message);
    }
  }
  
  async selectProject(payload, correlationId) {
    console.log('🎯 Selecting project:', payload);
    
    // Get active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (activeTab) {
      // Send message to content script
      const response = await chrome.tabs.sendMessage(activeTab.id, {
        action: 'SELECT_PROJECT',
        payload: payload,
        correlationId: correlationId
      });
      
      this.sendCompletionSignal(correlationId, true, response);
    } else {
      this.sendCompletionSignal(correlationId, false, 'No active tab found');
    }
  }
  
  async fillPrompt(payload, correlationId) {
    console.log('✏️ Filling prompt:', payload);
    
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (activeTab) {
      const response = await chrome.tabs.sendMessage(activeTab.id, {
        action: 'FILL_PROMPT',
        payload: payload,
        correlationId: correlationId
      });
      
      this.sendCompletionSignal(correlationId, true, response);
    } else {
      this.sendCompletionSignal(correlationId, false, 'No active tab found');
    }
  }
  
  async switchTab(payload, correlationId) {
    console.log('🔄 Switching tab:', payload);
    
    try {
      // Find tab by title
      const tabs = await chrome.tabs.query({});
      const targetTab = tabs.find(tab => 
        tab.title && tab.title.toLowerCase().includes(payload.title.toLowerCase())
      );
      
      if (targetTab) {
        await chrome.tabs.update(targetTab.id, { active: true });
        await chrome.windows.update(targetTab.windowId, { focused: true });
        
        this.sendCompletionSignal(correlationId, true, { 
          tabId: targetTab.id, 
          title: targetTab.title 
        });
      } else {
        this.sendCompletionSignal(correlationId, false, `Tab with title '${payload.title}' not found`);
      }
      
    } catch (error) {
      this.sendCompletionSignal(correlationId, false, error.message);
    }
  }
  
  async getResponse(payload, correlationId) {
    console.log('📖 Getting response:', payload);
    
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (activeTab) {
      const response = await chrome.tabs.sendMessage(activeTab.id, {
        action: 'GET_RESPONSE',
        payload: payload,
        correlationId: correlationId
      });
      
      this.sendCompletionSignal(correlationId, true, response);
    } else {
      this.sendCompletionSignal(correlationId, false, 'No active tab found');
    }
  }
  
  sendCompletionSignal(correlationId, success, result) {
    console.log(`✅ Sending completion signal: ${correlationId} - ${success ? 'SUCCESS' : 'FAILED'}`);
    
    // Send completion signal back via D-Bus
    this.sendToNativeHost({
      type: 'SEND_DBUS_SIGNAL',
      signal: {
        interface: 'org.chatgpt.buddy.automation',
        member: 'AutomationCompleted',
        args: [JSON.stringify({
          correlationId: correlationId,
          success: success,
          result: result,
          timestamp: Date.now()
        })]
      }
    });
  }
  
  sendDBusEvent(eventType, eventData) {
    if (!this.dbusConnected) return;
    
    const signal = {
      interface: 'org.chatgpt.buddy.automation',
      member: 'AutomationEvent',
      args: [eventType, JSON.stringify({
        ...eventData,
        timestamp: Date.now(),
        source: 'browser-extension'
      })]
    };
    
    this.sendToNativeHost({
      type: 'SEND_DBUS_SIGNAL',
      signal: signal
    });
  }
  
  sendToNativeHost(message) {
    if (this.nativePort) {
      try {
        this.nativePort.postMessage(message);
      } catch (error) {
        console.error('❌ Failed to send message to native host:', error);
        this.dbusConnected = false;
      }
    } else {
      console.warn('⚠️ No native port available, queuing message');
      this.messageQueue.push(message);
    }
  }
  
  handleExtensionMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'GET_DBUS_STATUS':
        sendResponse({
          connected: this.dbusConnected,
          connectionAttempts: this.connectionAttempts,
          queueSize: this.messageQueue.length
        });
        break;
        
      case 'SEND_DBUS_TEST':
        this.sendDBusEvent('TEST_EVENT', { 
          test: true, 
          data: message.data 
        });
        sendResponse({ sent: true });
        break;
        
      case 'PING_DBUS':
        this.sendToNativeHost({ type: 'PING', timestamp: Date.now() });
        sendResponse({ pinged: true });
        break;
    }
  }
  
  startHealthCheck() {
    setInterval(() => {
      if (this.dbusConnected && this.nativePort) {
        // Send periodic ping to keep connection alive
        this.sendToNativeHost({
          type: 'PING',
          timestamp: Date.now()
        });
      }
    }, 30000); // Ping every 30 seconds
  }
}

// Initialize D-Bus integration when extension starts
const dbusManager = new DBusIntegrationManager();

// Export for debugging
if (typeof globalThis !== 'undefined') {
  globalThis.dbusManager = dbusManager;
}