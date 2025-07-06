/**
 * @fileoverview Tab management adapter for browser extension
 * @description Handles browser tab operations using Chrome APIs with event-driven patterns
 * @author Web-Buddy Team
 */

import { Adapter, AdapterFor, Port } from '../../stubs/typescript-eda-stubs';
import { TabSwitchedEvent, TabSwitchRequestedEvent } from '../events/background-events';

/**
 * Interface for tab information
 */
export interface TabInfo {
  id: number;
  title: string;
  url: string;
  windowId: number;
  active: boolean;
  index: number;
}

/**
 * Port interface for tab management operations
 */
export abstract class TabManagementPort extends Port {
  public readonly name = 'TabManagementPort';
  
  public abstract getAllTabs(): Promise<TabInfo[]>;
  public abstract getActiveTab(): Promise<TabInfo | null>;
  public abstract switchToTab(tabId: number): Promise<void>;
  public abstract findTabsByTitle(title: string): Promise<TabInfo[]>;
  public abstract createTab(url: string): Promise<TabInfo>;
  public abstract closeTab(tabId: number): Promise<void>;
}

/**
 * Tab management adapter using Chrome extension APIs
 * Provides high-level tab operations with error handling
 */
@AdapterFor(TabManagementPort)
export class TabManagementAdapter extends TabManagementPort {
  
  /**
   * Get all open tabs across all windows
   */
  public async getAllTabs(): Promise<TabInfo[]> {
    try {
      const chromeTabs = await chrome.tabs.query({});
      return chromeTabs.map(tab => this.chromeTabToTabInfo(tab));
    } catch (error) {
      console.error('❌ Error getting all tabs:', error);
      throw new Error(`Failed to get all tabs: ${error}`);
    }
  }

  /**
   * Get the currently active tab in the current window
   */
  public async getActiveTab(): Promise<TabInfo | null> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab ? this.chromeTabToTabInfo(tab) : null;
    } catch (error) {
      console.error('❌ Error getting active tab:', error);
      throw new Error(`Failed to get active tab: ${error}`);
    }
  }

  /**
   * Switch to a specific tab by ID
   */
  public async switchToTab(tabId: number): Promise<void> {
    try {
      // First get the tab to ensure it exists
      const tab = await chrome.tabs.get(tabId);
      
      if (!tab) {
        throw new Error(`Tab with ID ${tabId} not found`);
      }

      // Update the tab to make it active
      await chrome.tabs.update(tabId, { active: true });
      
      // Focus the window containing the tab
      if (tab.windowId) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      
      console.log(`🎯 Successfully switched to tab: "${tab.title}" (ID: ${tabId})`);
      
    } catch (error) {
      console.error(`❌ Error switching to tab ${tabId}:`, error);
      throw new Error(`Failed to switch to tab ${tabId}: ${error}`);
    }
  }

  /**
   * Find tabs by title using partial, case-insensitive matching
   */
  public async findTabsByTitle(title: string): Promise<TabInfo[]> {
    try {
      const allTabs = await this.getAllTabs();
      
      // Filter tabs with matching titles (case-insensitive, partial match)
      const matchingTabs = allTabs.filter(tab => 
        tab.title && tab.title.toLowerCase().includes(title.toLowerCase())
      );
      
      console.log(`🔍 Found ${matchingTabs.length} tabs matching title: "${title}"`);
      
      return matchingTabs;
    } catch (error) {
      console.error(`❌ Error finding tabs by title "${title}":`, error);
      throw new Error(`Failed to find tabs by title: ${error}`);
    }
  }

  /**
   * Create a new tab with the specified URL
   */
  public async createTab(url: string): Promise<TabInfo> {
    try {
      const tab = await chrome.tabs.create({ url, active: true });
      
      if (!tab) {
        throw new Error('Failed to create tab');
      }
      
      console.log(`📄 Created new tab: "${tab.title || 'Loading...'}" (ID: ${tab.id})`);
      
      return this.chromeTabToTabInfo(tab);
    } catch (error) {
      console.error(`❌ Error creating tab with URL "${url}":`, error);
      throw new Error(`Failed to create tab: ${error}`);
    }
  }

  /**
   * Close a specific tab by ID
   */
  public async closeTab(tabId: number): Promise<void> {
    try {
      await chrome.tabs.remove(tabId);
      console.log(`🗑️ Closed tab with ID: ${tabId}`);
    } catch (error) {
      console.error(`❌ Error closing tab ${tabId}:`, error);
      throw new Error(`Failed to close tab ${tabId}: ${error}`);
    }
  }

  /**
   * Switch to tab by title (convenience method)
   */
  public async switchToTabByTitle(title: string): Promise<TabInfo> {
    const matchingTabs = await this.findTabsByTitle(title);
    
    if (matchingTabs.length === 0) {
      throw new Error(`No tab found with title containing: "${title}"`);
    }
    
    // Use the first matching tab
    const targetTab = matchingTabs[0];
    await this.switchToTab(targetTab.id);
    
    return targetTab;
  }

  /**
   * Get tab statistics
   */
  public async getTabStatistics(): Promise<{
    total: number;
    activeWindows: number;
    pinnedTabs: number;
    audibleTabs: number;
  }> {
    try {
      const allTabs = await chrome.tabs.query({});
      const windows = await chrome.windows.getAll();
      
      const stats = {
        total: allTabs.length,
        activeWindows: windows.filter(w => w.focused).length,
        pinnedTabs: allTabs.filter(tab => tab.pinned).length,
        audibleTabs: allTabs.filter(tab => tab.audible).length
      };
      
      console.log('📊 Tab statistics:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting tab statistics:', error);
      throw new Error(`Failed to get tab statistics: ${error}`);
    }
  }

  /**
   * Convert Chrome tab object to our TabInfo interface
   */
  private chromeTabToTabInfo(chromeTab: chrome.tabs.Tab): TabInfo {
    return {
      id: chromeTab.id!,
      title: chromeTab.title || 'Untitled',
      url: chromeTab.url || 'about:blank',
      windowId: chromeTab.windowId!,
      active: chromeTab.active,
      index: chromeTab.index
    };
  }

  /**
   * Set up Chrome API event listeners for tab changes
   */
  private setupTabEventListeners(): void {
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        console.log(`📄 Tab updated: "${tab.title}" (ID: ${tabId})`);
      }
    });

    // Listen for tab activation
    chrome.tabs.onActivated.addListener((activeInfo) => {
      console.log(`🎯 Tab activated: ID ${activeInfo.tabId}`);
    });

    // Listen for tab creation
    chrome.tabs.onCreated.addListener((tab) => {
      console.log(`📄 Tab created: "${tab.title || 'New Tab'}" (ID: ${tab.id})`);
    });

    // Listen for tab removal
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      console.log(`🗑️ Tab removed: ID ${tabId}`);
    });
  }

  /**
   * Initialize the adapter and set up event listeners
   */
  public async initialize(): Promise<void> {
    console.log('🔧 Tab management adapter initialized');
    this.setupTabEventListeners();
  }

  /**
   * Cleanup the adapter
   */
  public async shutdown(): Promise<void> {
    console.log('🔌 Tab management adapter shut down');
  }

  /**
   * Check adapter health
   */
  public async isHealthy(): Promise<boolean> {
    try {
      // Test basic tab access
      await chrome.tabs.query({ currentWindow: true });
      return true;
    } catch (error) {
      console.error('❌ Tab management adapter health check failed:', error);
      return false;
    }
  }
}