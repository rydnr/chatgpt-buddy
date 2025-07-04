/**
 * @fileoverview Background script for Web-Buddy browser extension
 * @description Handles WebSocket communication with Web-Buddy server using event-driven architecture
 * @author Web-Buddy Team
 */

import { Application, Enable } from '@typescript-eda/application';
import { listen } from '@typescript-eda/domain';
import { WebSocketConnectionAdapter } from '../core/adapters/websocket-connection-adapter';
import { MessageStoreAdapter } from '../storage/adapters/message-store-adapter';
import { TabManagementAdapter } from '../core/adapters/tab-management-adapter';
import { ExtensionLifecycleAdapter } from '../core/adapters/extension-lifecycle-adapter';
import {
  ConnectionRequestedEvent,
  MessageReceivedEvent,
  TabSwitchRequestedEvent,
  AutomationRequestedEvent,
  HeartbeatReceivedEvent
} from '../core/events/background-events';

/**
 * Background application that orchestrates browser extension functionality
 * Uses TypeScript-EDA patterns for event-driven architecture
 */
@Enable(WebSocketConnectionAdapter)
@Enable(MessageStoreAdapter)
@Enable(TabManagementAdapter)
@Enable(ExtensionLifecycleAdapter)
export class BackgroundApplication extends Application {
  public readonly metadata = new Map([
    ['name', 'Web-Buddy Background Application'],
    ['description', 'Browser extension background service for web automation'],
    ['version', '1.0.0'],
    ['capabilities', ['websocket', 'tabManagement', 'messageStore', 'automation']]
  ]);

  private extensionId: string = '';
  private connectionStatus = {
    connected: false,
    connecting: false,
    serverUrl: 'ws://localhost:3003/ws',
    lastMessage: 'None',
    lastError: '',
    autoReconnect: false
  };

  constructor() {
    super();
    this.extensionId = chrome.runtime.id;
  }

  /**
   * Handle connection requests from popup or other extension components
   */
  @listen(ConnectionRequestedEvent)
  public async handleConnectionRequest(event: ConnectionRequestedEvent): Promise<void> {
    console.log(`🔌 Connection requested to: ${event.serverUrl}`);
    
    if (this.connectionStatus.connecting || this.connectionStatus.connected) {
      console.log('⚠️ Already connected or connecting');
      return;
    }

    this.connectionStatus.connecting = true;
    this.connectionStatus.serverUrl = event.serverUrl;
    this.connectionStatus.lastError = '';
    
    await this.updateConnectionStatus();
  }

  /**
   * Handle incoming WebSocket messages with event-driven dispatch
   */
  @listen(MessageReceivedEvent)
  public async handleIncomingMessage(event: MessageReceivedEvent): Promise<void> {
    console.log('📨 Processing incoming message:', event.messageType);
    
    this.connectionStatus.lastMessage = `${event.messageType} (${new Date().toLocaleTimeString()})`;
    await this.updateConnectionStatus();

    // Route message to appropriate handler based on type
    switch (event.messageType) {
      case 'AutomationRequested':
        await this.handleAutomationRequest(event);
        break;
      case 'TabSwitchRequested':
        await this.handleTabSwitchRequest(event);
        break;
      case 'HeartbeatAck':
        await this.handleHeartbeatAck(event);
        break;
      default:
        console.log(`⚠️ Unknown message type: ${event.messageType}`);
    }
  }

  /**
   * Handle automation requests by forwarding to content scripts
   */
  private async handleAutomationRequest(event: MessageReceivedEvent): Promise<void> {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }
      
      // Forward to content script
      chrome.tabs.sendMessage(tab.id, event.payload, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error sending to content script:', chrome.runtime.lastError.message);
        } else {
          console.log('✅ Received response from content script:', response);
        }
      });
      
    } catch (error) {
      console.error('❌ Error handling automation request:', error);
    }
  }

  /**
   * Handle tab switching requests with title-based matching
   */
  @listen(TabSwitchRequestedEvent)
  public async handleTabSwitchRequest(event: TabSwitchRequestedEvent): Promise<void> {
    try {
      console.log(`🔄 Switching to tab with title: "${event.title}"`);
      
      // Query all tabs to find the one with matching title
      const tabs = await chrome.tabs.query({});
      console.log(`🔍 Found ${tabs.length} total tabs`);
      
      // Find tab with matching title (case-insensitive partial match)
      const matchingTabs = tabs.filter(tab => 
        tab.title && tab.title.toLowerCase().includes(event.title.toLowerCase())
      );
      
      if (matchingTabs.length === 0) {
        throw new Error(`No tab found with title containing: "${event.title}"`);
      }
      
      // Use the first matching tab
      const targetTab = matchingTabs[0];
      console.log(`✅ Found matching tab: "${targetTab.title}" (ID: ${targetTab.id})`);
      
      // Switch to the tab by updating it (making it active) and focusing its window
      await chrome.tabs.update(targetTab.id!, { active: true });
      await chrome.windows.update(targetTab.windowId!, { focused: true });
      
      console.log(`🎯 Successfully switched to tab: "${targetTab.title}"`);
      
    } catch (error) {
      console.error('❌ Error handling tab switch request:', error);
    }
  }

  /**
   * Handle heartbeat acknowledgments from server
   */
  @listen(HeartbeatReceivedEvent)
  public async handleHeartbeatAck(event: HeartbeatReceivedEvent): Promise<void> {
    console.log('💓 Heartbeat acknowledged by server');
    this.connectionStatus.lastMessage = `Heartbeat (${new Date().toLocaleTimeString()})`;
    await this.updateConnectionStatus();
  }

  /**
   * Update connection status and notify components
   */
  private async updateConnectionStatus(): Promise<void> {
    console.log('🔄 Updating connection status:', this.connectionStatus);
    
    // Notify popup of status change
    try {
      await chrome.runtime.sendMessage({
        type: 'statusUpdate',
        status: {
          ...this.connectionStatus,
          extensionId: this.extensionId
        }
      });
    } catch (error) {
      // Popup might not be open, ignore error but log for debugging
      console.log('📨 Could not send status to popup (popup may be closed):', error?.message);
    }
  }

  /**
   * Initialize the background application
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing Web-Buddy background application');
    
    // Set up Chrome extension event listeners
    this.setupChromeListeners();
    
    // Start the application
    await this.start();
  }

  /**
   * Set up Chrome extension API event listeners
   */
  private setupChromeListeners(): void {
    // Listen for messages from popup and content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📨 Received Chrome runtime message:', message);
      
      // Handle different message types
      this.handleChromeMessage(message, sender, sendResponse);
      
      return true; // Keep message channel open for async responses
    });

    // Handle extension lifecycle
    chrome.runtime.onInstalled.addListener(() => {
      console.log('🚀 Web-Buddy extension installed');
    });

    chrome.runtime.onStartup.addListener(() => {
      console.log('🚀 Web-Buddy extension starting up');
    });
  }

  /**
   * Handle Chrome runtime messages from popup and content scripts
   */
  private async handleChromeMessage(message: any, sender: any, sendResponse: Function): Promise<void> {
    switch (message.action) {
      case 'connect':
        await this.handle(new ConnectionRequestedEvent(message.serverUrl));
        sendResponse({ success: true });
        break;
        
      case 'disconnect':
        // Handle disconnection logic
        sendResponse({ success: true });
        break;
        
      case 'getStatus':
        sendResponse({ 
          success: true, 
          status: {
            ...this.connectionStatus,
            extensionId: this.extensionId
          }
        });
        break;
        
      case 'showTimeTravelUI':
        // Handle time travel UI request
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'showTimeTravelUI' });
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'No active tab found' });
          }
        });
        break;
        
      default:
        console.log(`⚠️ Unknown Chrome message action: ${message.action}`);
    }
  }
}

// Initialize and start the background application
const backgroundApp = new BackgroundApplication();
backgroundApp.initialize().catch(error => {
  console.error('❌ Failed to initialize background application:', error);
});

// Export for testing
if (typeof globalThis !== 'undefined') {
  (globalThis as any).backgroundApp = backgroundApp;
}