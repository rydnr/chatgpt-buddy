// Web-Buddy Extension Popup Script (JavaScript version)
// Provides UI for connection management and status monitoring

class PopupController {
  constructor() {
    this.status = {
      connected: false,
      connecting: false,
      serverUrl: 'ws://localhost:3003/ws',
      extensionId: '',
      lastMessage: 'None',
      lastError: ''
    };

    this.initializeElements();
    this.bindEvents();
    this.loadInitialData();
    this.startStatusPolling();
  }

  initializeElements() {
    this.toggleButton = document.getElementById('toggleButton');
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    this.serverInput = document.getElementById('serverInput');
    this.extensionIdElement = document.getElementById('extensionId');
    this.currentTabElement = document.getElementById('currentTab');
    this.lastMessageElement = document.getElementById('lastMessage');
    this.logPanel = document.getElementById('logPanel');
    this.storageStatsElement = document.getElementById('storageStats');
    this.viewPatternsBtn = document.getElementById('viewPatternsBtn');
    this.clearOldDataBtn = document.getElementById('clearOldDataBtn');
  }

  bindEvents() {
    this.toggleButton.addEventListener('click', () => this.handleToggleConnection());
    this.serverInput.addEventListener('change', () => this.handleServerUrlChange());
    this.serverInput.addEventListener('input', () => this.handleServerUrlChange());
    this.viewPatternsBtn.addEventListener('click', () => this.handleViewPatterns());
    this.clearOldDataBtn.addEventListener('click', () => this.handleClearOldData());
  }

  async loadInitialData() {
    try {
      this.addLog('info', 'Loading initial popup data...');
      
      // Get extension ID
      this.status.extensionId = chrome.runtime.id;
      this.extensionIdElement.textContent = this.status.extensionId;
      this.addLog('info', `Extension ID: ${this.status.extensionId}`);

      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        this.currentTabElement.textContent = `${tab.title?.substring(0, 30)}... (${tab.id})`;
        this.addLog('info', `Current tab: ${tab.title} (${tab.id})`);
      }

      // Load saved server URL
      const result = await chrome.storage.local.get(['serverUrl']);
      if (result.serverUrl) {
        this.status.serverUrl = result.serverUrl;
        this.serverInput.value = result.serverUrl;
        this.addLog('info', `Loaded saved server URL: ${result.serverUrl}`);
      }

      // Get initial connection status from background script
      this.addLog('info', 'Requesting status from background script...');
      this.requestStatusFromBackground();
      
      // Load storage statistics
      this.loadStorageStats();

    } catch (error) {
      this.addLog('error', `Failed to load initial data: ${error}`);
    }
  }

  async handleToggleConnection() {
    if (this.status.connecting) {
      return; // Ignore clicks while connecting
    }

    try {
      if (this.status.connected) {
        await this.sendToBackground({ action: 'disconnect' });
        this.addLog('info', 'Disconnection requested');
      } else {
        await this.sendToBackground({ 
          action: 'connect', 
          serverUrl: this.serverInput.value 
        });
        this.addLog('info', `Connection requested to ${this.serverInput.value}`);
      }
    } catch (error) {
      this.addLog('error', `Toggle connection failed: ${error}`);
    }
  }

  handleServerUrlChange() {
    const url = this.serverInput.value.trim();
    this.status.serverUrl = url;
    
    // Save to storage
    chrome.storage.local.set({ serverUrl: url });
    
    if (url && this.isValidWebSocketUrl(url)) {
      this.addLog('info', `Server URL updated: ${url}`);
    }
  }

  isValidWebSocketUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'ws:' || urlObj.protocol === 'wss:';
    } catch {
      return false;
    }
  }

  async sendToBackground(message) {
    return new Promise((resolve, reject) => {
      // Add timeout to catch hanging requests
      const timeout = setTimeout(() => {
        reject(new Error('Background script request timed out after 5 seconds'));
      }, 5000);
      
      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          console.log('❌ Chrome runtime error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('✅ Received response from background:', response);
          resolve(response);
        }
      });
    });
  }

  requestStatusFromBackground() {
    console.log('📞 Requesting status from background script...');
    this.sendToBackground({ action: 'getStatus' })
      .then((response) => {
        console.log('📨 Status response from background:', response);
        if (response && response.status) {
          console.log('✅ Updating status with:', response.status);
          this.updateStatus(response.status);
          this.addLog('info', `Status updated: ${response.status.connected ? 'Connected' : 'Disconnected'}`);
        } else {
          console.log('❌ No status in response:', response);
          this.addLog('error', 'No status received from background script');
        }
      })
      .catch((error) => {
        console.log('❌ Status request failed:', error);
        this.addLog('error', `Failed to get status: ${error.message || error}`);
      });
  }

  updateStatus(newStatus) {
    console.log('🔄 Updating UI status. Current:', this.status, 'New:', newStatus);
    
    // Update status object
    Object.assign(this.status, newStatus);
    
    console.log('🔄 Status after merge:', this.status);

    // Update UI elements
    this.updateConnectionIndicator();
    this.updateToggleButton();
    
    if (newStatus.lastMessage && newStatus.lastMessage !== 'None') {
      this.lastMessageElement.textContent = newStatus.lastMessage;
    }
  }

  updateConnectionIndicator() {
    // Remove all status classes
    this.statusDot.classList.remove('connected', 'disconnected', 'connecting');
    
    console.log('🎨 Updating UI indicator. connecting:', this.status.connecting, 'connected:', this.status.connected);
    
    if (this.status.connecting) {
      this.statusDot.classList.add('connecting');
      this.statusText.textContent = 'Connecting...';
      console.log('🎨 Set to Connecting...');
    } else if (this.status.connected) {
      this.statusDot.classList.add('connected');
      this.statusText.textContent = 'Connected';
      console.log('🎨 Set to Connected');
    } else {
      this.statusDot.classList.add('disconnected');
      this.statusText.textContent = 'Disconnected';
      console.log('🎨 Set to Disconnected');
    }
  }

  updateToggleButton() {
    this.toggleButton.disabled = this.status.connecting;
    
    console.log('🔘 Updating button. connecting:', this.status.connecting, 'connected:', this.status.connected);
    
    if (this.status.connecting) {
      this.toggleButton.textContent = 'Connecting...';
      console.log('🔘 Set button to Connecting...');
    } else if (this.status.connected) {
      this.toggleButton.textContent = 'Disconnect';
      console.log('🔘 Set button to Disconnect');
    } else {
      this.toggleButton.textContent = 'Connect';
      console.log('🔘 Set button to Connect');
    }
  }

  addLog(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    this.logPanel.appendChild(logEntry);
    
    // Keep only last 20 log entries
    while (this.logPanel.children.length > 20) {
      this.logPanel.removeChild(this.logPanel.firstChild);
    }
    
    // Scroll to bottom
    this.logPanel.scrollTop = this.logPanel.scrollHeight;
  }

  startStatusPolling() {
    // Poll status every 2 seconds
    setInterval(() => {
      this.requestStatusFromBackground();
    }, 2000);
    
    // Also request status immediately on popup open
    setTimeout(() => {
      this.requestStatusFromBackground();
    }, 100);
  }

  async loadStorageStats() {
    try {
      // Request storage stats from content script
      const response = await this.sendToBackground({ action: 'getStorageStats' });
      if (response && response.stats) {
        this.updateStorageStats(response.stats);
      } else {
        this.storageStatsElement.textContent = 'No data available';
      }
    } catch (error) {
      console.error('Failed to load storage stats:', error);
      this.storageStatsElement.textContent = 'Failed to load';
    }
  }

  updateStorageStats(stats) {
    const { automationPatterns = 0, userInteractions = 0, websiteConfigs = 0 } = stats;
    this.storageStatsElement.textContent = `${automationPatterns} patterns, ${userInteractions} interactions, ${websiteConfigs} configs`;
  }

  async handleViewPatterns() {
    try {
      this.addLog('info', 'Requesting automation patterns...');
      const response = await this.sendToBackground({ action: 'getAutomationPatterns', limit: 10 });
      
      if (response && response.patterns) {
        this.displayPatterns(response.patterns);
      } else {
        this.addLog('error', 'No patterns found');
      }
    } catch (error) {
      this.addLog('error', `Failed to get patterns: ${error.message || error}`);
    }
  }

  displayPatterns(patterns) {
    const patternText = patterns.map(pattern => 
      `${pattern.action} on ${pattern.domain} (${pattern.success ? '✅' : '❌'})`
    ).join(', ');
    
    this.addLog('info', `Recent patterns: ${patternText}`);
  }

  async handleClearOldData() {
    try {
      this.addLog('info', 'Clearing old data (30+ days)...');
      const response = await this.sendToBackground({ action: 'clearOldData', days: 30 });
      
      if (response && response.success) {
        this.addLog('success', 'Old data cleared successfully');
        this.loadStorageStats(); // Refresh stats
      } else {
        this.addLog('error', 'Failed to clear old data');
      }
    } catch (error) {
      this.addLog('error', `Failed to clear data: ${error.message || error}`);
    }
  }
}

// Listen for status updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'statusUpdate') {
    console.log('📨 Status update received in popup:', message.status);
    // Find the popup controller instance and update it
    if (window.popupController) {
      window.popupController.updateStatus(message.status);
      window.popupController.addLog('info', `Real-time update: ${message.status.connected ? 'Connected' : 'Disconnected'}`);
    } else {
      console.log('⚠️ PopupController not ready yet, status update will be handled on next poll');
    }
  }
  
  // Always send response to keep message channel open
  if (sendResponse) {
    sendResponse({ received: true });
  }
  
  return true; // Keep message channel open for async response
});

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.popupController = new PopupController();
});