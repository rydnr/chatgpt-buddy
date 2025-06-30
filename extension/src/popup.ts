// Web-Buddy Extension Popup Script
// Provides UI for connection management and status monitoring

interface ConnectionStatus {
  connected: boolean;
  connecting: boolean;
  serverUrl: string;
  extensionId: string;
  lastMessage: string;
  lastError: string;
}

class PopupController {
  private toggleButton: HTMLButtonElement;
  private statusDot: HTMLElement;
  private statusText: HTMLElement;
  private serverInput: HTMLInputElement;
  private extensionIdElement: HTMLElement;
  private currentTabElement: HTMLElement;
  private lastMessageElement: HTMLElement;
  private logPanel: HTMLElement;
  
  private status: ConnectionStatus = {
    connected: false,
    connecting: false,
    serverUrl: 'ws://localhost:3003/ws',
    extensionId: '',
    lastMessage: 'None',
    lastError: ''
  };

  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.loadInitialData();
    this.startStatusPolling();
  }

  private initializeElements(): void {
    this.toggleButton = document.getElementById('toggleButton') as HTMLButtonElement;
    this.statusDot = document.getElementById('statusDot') as HTMLElement;
    this.statusText = document.getElementById('statusText') as HTMLElement;
    this.serverInput = document.getElementById('serverInput') as HTMLInputElement;
    this.extensionIdElement = document.getElementById('extensionId') as HTMLElement;
    this.currentTabElement = document.getElementById('currentTab') as HTMLElement;
    this.lastMessageElement = document.getElementById('lastMessage') as HTMLElement;
    this.logPanel = document.getElementById('logPanel') as HTMLElement;
  }

  private bindEvents(): void {
    this.toggleButton.addEventListener('click', () => this.handleToggleConnection());
    this.serverInput.addEventListener('change', () => this.handleServerUrlChange());
    this.serverInput.addEventListener('input', () => this.handleServerUrlChange());
  }

  private async loadInitialData(): Promise<void> {
    try {
      // Get extension ID
      this.status.extensionId = chrome.runtime.id;
      this.extensionIdElement.textContent = this.status.extensionId;

      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        this.currentTabElement.textContent = `${tab.title?.substring(0, 30)}... (${tab.id})`;
      }

      // Load saved server URL
      const result = await chrome.storage.local.get(['serverUrl']);
      if (result.serverUrl) {
        this.status.serverUrl = result.serverUrl;
        this.serverInput.value = result.serverUrl;
      }

      // Get initial connection status from background script
      this.requestStatusFromBackground();

    } catch (error) {
      this.addLog('error', `Failed to load initial data: ${error}`);
    }
  }

  private async handleToggleConnection(): Promise<void> {
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

  private handleServerUrlChange(): void {
    const url = this.serverInput.value.trim();
    this.status.serverUrl = url;
    
    // Save to storage
    chrome.storage.local.set({ serverUrl: url });
    
    if (url && this.isValidWebSocketUrl(url)) {
      this.addLog('info', `Server URL updated: ${url}`);
    }
  }

  private isValidWebSocketUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'ws:' || urlObj.protocol === 'wss:';
    } catch {
      return false;
    }
  }

  private async sendToBackground(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  private requestStatusFromBackground(): void {
    this.sendToBackground({ action: 'getStatus' })
      .then((response) => {
        if (response && response.status) {
          this.updateStatus(response.status);
        }
      })
      .catch((error) => {
        this.addLog('error', `Failed to get status: ${error}`);
      });
  }

  private updateStatus(newStatus: Partial<ConnectionStatus>): void {
    // Update status object
    Object.assign(this.status, newStatus);

    // Update UI elements
    this.updateConnectionIndicator();
    this.updateToggleButton();
    
    if (newStatus.lastMessage && newStatus.lastMessage !== 'None') {
      this.lastMessageElement.textContent = newStatus.lastMessage;
    }
  }

  private updateConnectionIndicator(): void {
    // Remove all status classes
    this.statusDot.classList.remove('connected', 'disconnected', 'connecting');
    
    if (this.status.connecting) {
      this.statusDot.classList.add('connecting');
      this.statusText.textContent = 'Connecting...';
    } else if (this.status.connected) {
      this.statusDot.classList.add('connected');
      this.statusText.textContent = 'Connected';
    } else {
      this.statusDot.classList.add('disconnected');
      this.statusText.textContent = 'Disconnected';
    }
  }

  private updateToggleButton(): void {
    this.toggleButton.disabled = this.status.connecting;
    
    if (this.status.connecting) {
      this.toggleButton.textContent = 'Connecting...';
    } else if (this.status.connected) {
      this.toggleButton.textContent = 'Disconnect';
    } else {
      this.toggleButton.textContent = 'Connect';
    }
  }

  private addLog(type: 'info' | 'success' | 'error', message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    this.logPanel.appendChild(logEntry);
    
    // Keep only last 20 log entries
    while (this.logPanel.children.length > 20) {
      this.logPanel.removeChild(this.logPanel.firstChild!);
    }
    
    // Scroll to bottom
    this.logPanel.scrollTop = this.logPanel.scrollHeight;
  }

  private startStatusPolling(): void {
    // Poll status every 2 seconds
    setInterval(() => {
      this.requestStatusFromBackground();
    }, 2000);
  }
}

// Listen for status updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'statusUpdate') {
    // This will be handled by the PopupController instance
    console.log('Status update received in popup:', message.status);
  }
});

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});