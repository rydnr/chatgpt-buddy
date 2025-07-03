/**
 * Web-Buddy Client - Core infrastructure for web automation
 * 
 * Provides generic message-passing infrastructure that can be extended
 * for specific website automation implementations.
 */

import { 
  WebBuddyClientConfig, 
  WebBuddyMessage, 
  WebBuddyResponse, 
  CorrelationId 
} from '../types/web-buddy-types';

export class WebBuddyClient {
  private config: WebBuddyClientConfig;
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor(config: WebBuddyClientConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      preferredTransport: 'auto',
      ...config
    };
  }

  /**
   * Send a message to the browser extension for execution
   * This is the core method that all domain-specific clients build upon
   */
  async sendMessage(message: WebBuddyMessage): Promise<WebBuddyResponse> {
    const correlationId = message.correlationId || this.generateCorrelationId();
    
    const messageWithDefaults: WebBuddyMessage = {
      ...message,
      correlationId,
      timestamp: Date.now()
    };

    try {
      // Ensure connection is established
      await this.ensureConnection();

      // Send message via appropriate transport
      const response = await this.sendViaTransport(messageWithDefaults);
      
      return {
        success: true,
        data: response,
        correlationId,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Send multiple messages efficiently
   * Useful for batch operations or complex workflows
   */
  async sendMessages(messages: WebBuddyMessage[]): Promise<WebBuddyResponse[]> {
    const promises = messages.map(message => this.sendMessage(message));
    return Promise.all(promises);
  }

  /**
   * Generate a unique correlation ID for message tracking
   */
  generateCorrelationId(): CorrelationId {
    return `wb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current connection status and transport information
   */
  async getTransportInfo(): Promise<{
    type: string;
    status: string;
    averageLatency?: number;
  }> {
    // This would be implemented based on the actual transport
    return {
      type: this.config.preferredTransport || 'websocket',
      status: this.connectionState,
      averageLatency: 0
    };
  }

  /**
   * Ensure connection is established based on preferred transport
   */
  private async ensureConnection(): Promise<void> {
    if (this.connectionState === 'connected') {
      return;
    }

    if (this.connectionState === 'connecting') {
      // Wait for existing connection attempt
      await this.waitForConnection();
      return;
    }

    this.connectionState = 'connecting';
    
    try {
      // Detect and establish best available transport
      await this.establishConnection();
      this.connectionState = 'connected';
    } catch (error) {
      this.connectionState = 'disconnected';
      throw error;
    }
  }

  /**
   * Establish connection using the best available transport
   */
  private async establishConnection(): Promise<void> {
    const transport = await this.detectBestTransport();
    
    switch (transport) {
      case 'websocket':
        await this.connectWebSocket();
        break;
      case 'dbus':
        await this.connectDBus();
        break;
      default:
        throw new Error(`Unsupported transport: ${transport}`);
    }
  }

  /**
   * Detect the best available transport for current environment
   */
  private async detectBestTransport(): Promise<string> {
    if (this.config.preferredTransport !== 'auto') {
      return this.config.preferredTransport;
    }

    // Auto-detection logic
    if (this.isLinuxDesktop() && await this.isDBusAvailable()) {
      return 'dbus';
    }

    return 'websocket';
  }

  /**
   * Send message via the established transport
   */
  private async sendViaTransport(message: WebBuddyMessage): Promise<any> {
    // This would delegate to the appropriate transport implementation
    // For now, simulate HTTP POST to server
    const response = await fetch(`${this.config.serverUrl}/api/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify({
        target: {
          extensionId: 'web-buddy-extension',
          tabId: null // Will be determined by server
        },
        message
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Platform detection utilities
   */
  private isLinuxDesktop(): boolean {
    return typeof process !== 'undefined' && process.platform === 'linux';
  }

  private async isDBusAvailable(): Promise<boolean> {
    // Simple check for D-Bus availability
    try {
      const { exec } = await import('child_process');
      return new Promise((resolve) => {
        exec('which dbus-send', (error) => {
          resolve(!error);
        });
      });
    } catch {
      return false;
    }
  }

  /**
   * Transport-specific connection methods
   */
  private async connectWebSocket(): Promise<void> {
    // WebSocket connection implementation
    // This would establish connection to the server
  }

  private async connectDBus(): Promise<void> {
    // D-Bus connection implementation
    // This would connect directly to browser extension via D-Bus
  }

  /**
   * Wait for existing connection attempt to complete
   */
  private async waitForConnection(): Promise<void> {
    const maxWait = 10000; // 10 seconds
    const checkInterval = 100; // 100ms
    let waited = 0;

    while (this.connectionState === 'connecting' && waited < maxWait) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    if (this.connectionState !== 'connected') {
      throw new Error('Connection timeout');
    }
  }
}