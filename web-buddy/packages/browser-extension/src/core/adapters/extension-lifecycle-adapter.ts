/**
 * @fileoverview Extension lifecycle adapter for browser extension management
 * @description Handles extension installation, startup, shutdown, and lifecycle events
 * @author Web-Buddy Team
 */

import { Adapter, AdapterFor, Port } from '../../stubs/typescript-eda-stubs';

/**
 * Port interface for extension lifecycle management
 */
export abstract class ExtensionLifecyclePort extends Port {
  public readonly name = 'ExtensionLifecyclePort';
  
  public abstract initialize(): Promise<void>;
  public abstract onInstalled(callback: (details: chrome.runtime.InstalledDetails) => void): void;
  public abstract onStartup(callback: () => void): void;
  public abstract onSuspend(callback: () => void): void;
  public abstract getExtensionInfo(): Promise<ExtensionInfo>;
  public abstract checkPermissions(): Promise<PermissionStatus>;
}

/**
 * Interface for extension information
 */
export interface ExtensionInfo {
  id: string;
  version: string;
  name: string;
  description: string;
  permissions: string[];
  hostPermissions: string[];
  manifest: chrome.runtime.Manifest;
}

/**
 * Interface for permission status
 */
export interface PermissionStatus {
  granted: string[];
  missing: string[];
  optional: string[];
  hostPermissions: {
    granted: string[];
    missing: string[];
  };
}

/**
 * Extension lifecycle adapter using Chrome extension APIs
 * Manages extension lifecycle events and provides system information
 */
@AdapterFor(ExtensionLifecyclePort)
export class ExtensionLifecycleAdapter extends ExtensionLifecyclePort {
  private isInitialized = false;
  private installationHandlers: Array<(details: chrome.runtime.InstalledDetails) => void> = [];
  private startupHandlers: Array<() => void> = [];
  private suspendHandlers: Array<() => void> = [];

  /**
   * Initialize the extension lifecycle adapter
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Extension lifecycle adapter already initialized');
      return;
    }

    console.log('🔧 Initializing extension lifecycle adapter');
    
    this.setupLifecycleListeners();
    this.isInitialized = true;
    
    console.log('✅ Extension lifecycle adapter initialized');
  }

  /**
   * Register callback for extension installation events
   */
  public onInstalled(callback: (details: chrome.runtime.InstalledDetails) => void): void {
    this.installationHandlers.push(callback);
  }

  /**
   * Register callback for extension startup events
   */
  public onStartup(callback: () => void): void {
    this.startupHandlers.push(callback);
  }

  /**
   * Register callback for extension suspend events
   */
  public onSuspend(callback: () => void): void {
    this.suspendHandlers.push(callback);
  }

  /**
   * Get comprehensive extension information
   */
  public async getExtensionInfo(): Promise<ExtensionInfo> {
    const manifest = chrome.runtime.getManifest();
    const permissions = await this.getGrantedPermissions();
    
    return {
      id: chrome.runtime.id,
      version: manifest.version,
      name: manifest.name,
      description: manifest.description || '',
      permissions: permissions.granted,
      hostPermissions: permissions.hostPermissions.granted,
      manifest
    };
  }

  /**
   * Check current permission status
   */
  public async checkPermissions(): Promise<PermissionStatus> {
    const manifest = chrome.runtime.getManifest();
    const manifestPermissions = manifest.permissions || [];
    const manifestHostPermissions = manifest.host_permissions || [];
    
    // Check regular permissions
    const granted: string[] = [];
    const missing: string[] = [];
    
    for (const permission of manifestPermissions) {
      const hasPermission = await this.hasPermission(permission);
      if (hasPermission) {
        granted.push(permission);
      } else {
        missing.push(permission);
      }
    }
    
    // Check host permissions
    const grantedHosts: string[] = [];
    const missingHosts: string[] = [];
    
    for (const hostPermission of manifestHostPermissions) {
      const hasPermission = await this.hasHostPermission(hostPermission);
      if (hasPermission) {
        grantedHosts.push(hostPermission);
      } else {
        missingHosts.push(hostPermission);
      }
    }
    
    // Check optional permissions
    const optionalPermissions = manifest.optional_permissions || [];
    
    return {
      granted,
      missing,
      optional: optionalPermissions,
      hostPermissions: {
        granted: grantedHosts,
        missing: missingHosts
      }
    };
  }

  /**
   * Request additional permissions if needed
   */
  public async requestPermissions(permissions: string[]): Promise<boolean> {
    try {
      const granted = await chrome.permissions.request({
        permissions
      });
      
      if (granted) {
        console.log(`✅ Permissions granted: ${permissions.join(', ')}`);
      } else {
        console.log(`❌ Permissions denied: ${permissions.join(', ')}`);
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Request additional host permissions if needed
   */
  public async requestHostPermissions(origins: string[]): Promise<boolean> {
    try {
      const granted = await chrome.permissions.request({
        origins
      });
      
      if (granted) {
        console.log(`✅ Host permissions granted: ${origins.join(', ')}`);
      } else {
        console.log(`❌ Host permissions denied: ${origins.join(', ')}`);
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Error requesting host permissions:', error);
      return false;
    }
  }

  /**
   * Get extension usage statistics
   */
  public async getUsageStatistics(): Promise<UsageStatistics> {
    const installTime = await this.getInstallTime();
    const uptime = await this.getUptime();
    const sessionCount = await this.getSessionCount();
    
    return {
      installTime,
      uptime,
      sessionCount,
      lastActivity: new Date(),
      version: chrome.runtime.getManifest().version
    };
  }

  /**
   * Restart the extension (if supported)
   */
  public async restartExtension(): Promise<void> {
    console.log('🔄 Restarting extension...');
    
    // Notify all components of restart
    this.suspendHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        console.error('❌ Error in suspend handler:', error);
      }
    });
    
    // In Manifest V3, we can't actually restart the service worker
    // but we can simulate it by reloading the extension
    if (chrome.runtime.reload) {
      chrome.runtime.reload();
    } else {
      console.log('⚠️ Extension restart not supported in this environment');
    }
  }

  /**
   * Set up Chrome extension lifecycle listeners
   */
  private setupLifecycleListeners(): void {
    // Handle installation and updates
    chrome.runtime.onInstalled.addListener((details) => {
      console.log(`📦 Extension ${details.reason}:`, details);
      
      this.handleInstallation(details);
      
      // Notify registered handlers
      this.installationHandlers.forEach(handler => {
        try {
          handler(details);
        } catch (error) {
          console.error('❌ Error in installation handler:', error);
        }
      });
    });

    // Handle extension startup
    chrome.runtime.onStartup.addListener(() => {
      console.log('🚀 Extension startup');
      
      this.handleStartup();
      
      // Notify registered handlers
      this.startupHandlers.forEach(handler => {
        try {
          handler();
        } catch (error) {
          console.error('❌ Error in startup handler:', error);
        }
      });
    });

    // Handle service worker suspend (Manifest V3)
    if (chrome.runtime.onSuspend) {
      chrome.runtime.onSuspend.addListener(() => {
        console.log('💤 Extension suspending');
        
        // Notify registered handlers
        this.suspendHandlers.forEach(handler => {
          try {
            handler();
          } catch (error) {
            console.error('❌ Error in suspend handler:', error);
          }
        });
      });
    }

    // Handle service worker suspend cancellation
    if (chrome.runtime.onSuspendCanceled) {
      chrome.runtime.onSuspendCanceled.addListener(() => {
        console.log('↩️ Extension suspend cancelled');
      });
    }

    // Handle permission changes
    if (chrome.permissions && chrome.permissions.onAdded) {
      chrome.permissions.onAdded.addListener((permissions) => {
        console.log('➕ Permissions added:', permissions);
      });
    }

    if (chrome.permissions && chrome.permissions.onRemoved) {
      chrome.permissions.onRemoved.addListener((permissions) => {
        console.log('➖ Permissions removed:', permissions);
      });
    }
  }

  /**
   * Handle extension installation/update
   */
  private async handleInstallation(details: chrome.runtime.InstalledDetails): Promise<void> {
    switch (details.reason) {
      case 'install':
        await this.handleFirstInstall();
        break;
      case 'update':
        await this.handleUpdate(details.previousVersion);
        break;
      case 'chrome_update':
      case 'shared_module_update':
        await this.handleSystemUpdate();
        break;
    }
  }

  /**
   * Handle first-time installation
   */
  private async handleFirstInstall(): Promise<void> {
    console.log('🎉 First-time installation detected');
    
    // Set installation timestamp
    await chrome.storage.local.set({
      installTime: Date.now(),
      sessionCount: 0
    });
    
    // Initialize default settings
    await this.initializeDefaultSettings();
    
    // Show welcome message or onboarding
    await this.showWelcomeMessage();
  }

  /**
   * Handle extension update
   */
  private async handleUpdate(previousVersion?: string): Promise<void> {
    console.log(`🔄 Extension updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
    
    // Run migration scripts if needed
    await this.runMigrations(previousVersion);
    
    // Update settings if needed
    await this.updateSettings();
    
    // Show update notification if significant changes
    await this.showUpdateNotification(previousVersion);
  }

  /**
   * Handle system updates (Chrome/browser update)
   */
  private async handleSystemUpdate(): Promise<void> {
    console.log('🔄 System update detected');
    
    // Verify compatibility
    await this.verifyCompatibility();
    
    // Refresh cached data if needed
    await this.refreshCachedData();
  }

  /**
   * Handle extension startup
   */
  private async handleStartup(): Promise<void> {
    // Increment session count
    const { sessionCount = 0 } = await chrome.storage.local.get('sessionCount');
    await chrome.storage.local.set({ sessionCount: sessionCount + 1 });
    
    // Perform startup validation
    await this.validateExtensionState();
    
    // Clean up temporary data
    await this.cleanupTemporaryData();
  }

  /**
   * Check if extension has a specific permission
   */
  private async hasPermission(permission: string): Promise<boolean> {
    if (!chrome.permissions) return true; // Assume granted if API not available
    
    try {
      return await chrome.permissions.contains({ permissions: [permission] });
    } catch (error) {
      console.error(`❌ Error checking permission ${permission}:`, error);
      return false;
    }
  }

  /**
   * Check if extension has a specific host permission
   */
  private async hasHostPermission(origin: string): Promise<boolean> {
    if (!chrome.permissions) return true; // Assume granted if API not available
    
    try {
      return await chrome.permissions.contains({ origins: [origin] });
    } catch (error) {
      console.error(`❌ Error checking host permission ${origin}:`, error);
      return false;
    }
  }

  /**
   * Get all currently granted permissions
   */
  private async getGrantedPermissions(): Promise<{granted: string[], hostPermissions: {granted: string[]}}> {
    if (!chrome.permissions) {
      return { granted: [], hostPermissions: { granted: [] } };
    }
    
    try {
      const permissions = await chrome.permissions.getAll();
      return {
        granted: permissions.permissions || [],
        hostPermissions: {
          granted: permissions.origins || []
        }
      };
    } catch (error) {
      console.error('❌ Error getting permissions:', error);
      return { granted: [], hostPermissions: { granted: [] } };
    }
  }

  /**
   * Initialize default extension settings
   */
  private async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = {
      autoConnectEnabled: false,
      serverUrl: 'ws://localhost:3003/ws',
      trainingMode: 'assisted',
      patternSharing: false,
      analytics: true,
      debugMode: false
    };
    
    await chrome.storage.sync.set({ settings: defaultSettings });
    console.log('⚙️ Default settings initialized');
  }

  /**
   * Show welcome message for new users
   */
  private async showWelcomeMessage(): Promise<void> {
    // This could open a welcome tab or show a notification
    console.log('👋 Welcome to Web-Buddy Browser Extension!');
  }

  /**
   * Run database/settings migrations for updates
   */
  private async runMigrations(previousVersion?: string): Promise<void> {
    if (!previousVersion) return;
    
    console.log(`🔄 Running migrations from version ${previousVersion}`);
    
    // Example migration logic
    if (this.isVersionLessThan(previousVersion, '1.1.0')) {
      await this.migrateToV1_1_0();
    }
    
    if (this.isVersionLessThan(previousVersion, '2.0.0')) {
      await this.migrateToV2_0_0();
    }
  }

  /**
   * Utility methods for extension management
   */
  private async getInstallTime(): Promise<Date> {
    const { installTime } = await chrome.storage.local.get('installTime');
    return new Date(installTime || Date.now());
  }

  private async getUptime(): Promise<number> {
    const installTime = await this.getInstallTime();
    return Date.now() - installTime.getTime();
  }

  private async getSessionCount(): Promise<number> {
    const { sessionCount } = await chrome.storage.local.get('sessionCount');
    return sessionCount || 0;
  }

  private isVersionLessThan(version1: string, version2: string): boolean {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return true;
      if (v1Part > v2Part) return false;
    }
    
    return false;
  }

  // Placeholder migration methods
  private async migrateToV1_1_0(): Promise<void> {
    console.log('🔄 Migrating to version 1.1.0');
    // Migration logic here
  }

  private async migrateToV2_0_0(): Promise<void> {
    console.log('🔄 Migrating to version 2.0.0'); 
    // Migration logic here
  }

  private async updateSettings(): Promise<void> {
    // Update settings schema if needed
  }

  private async showUpdateNotification(previousVersion?: string): Promise<void> {
    // Show update notification if needed
  }

  private async verifyCompatibility(): Promise<void> {
    // Check browser compatibility
  }

  private async refreshCachedData(): Promise<void> {
    // Refresh any cached data
  }

  private async validateExtensionState(): Promise<void> {
    // Validate extension state on startup
  }

  private async cleanupTemporaryData(): Promise<void> {
    // Clean up temporary files/data
  }

  /**
   * Health check for the adapter
   */
  public async isHealthy(): Promise<boolean> {
    try {
      // Basic health checks
      const manifest = chrome.runtime.getManifest();
      const permissions = await this.checkPermissions();
      
      return !!(manifest && permissions);
    } catch (error) {
      console.error('❌ Extension lifecycle adapter health check failed:', error);
      return false;
    }
  }

  /**
   * Cleanup the adapter
   */
  public async shutdown(): Promise<void> {
    console.log('🔌 Extension lifecycle adapter shutting down');
    
    // Clear handlers
    this.installationHandlers = [];
    this.startupHandlers = [];
    this.suspendHandlers = [];
    
    this.isInitialized = false;
  }
}

/**
 * Interface for extension usage statistics
 */
export interface UsageStatistics {
  installTime: Date;
  uptime: number;
  sessionCount: number;
  lastActivity: Date;
  version: string;
}