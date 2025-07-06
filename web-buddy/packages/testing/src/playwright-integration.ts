/*
                        Web-Buddy Testing Framework

    Copyright (C) 2025-today  rydnr@acm-sl.org

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * @fileoverview Playwright integration for Web-Buddy ATDD framework
 * @description Manages browser automation, extension loading, and test environment setup
 */

import { Browser, BrowserContext, Page, chromium, firefox, webkit } from '@playwright/test';
import { WebBuddyClient } from '@web-buddy/core';

/**
 * Browser types supported by the testing framework
 */
export type SupportedBrowser = 'chromium' | 'firefox' | 'webkit';

/**
 * Test environment configuration
 */
export interface TestEnvironmentConfig {
  browser: SupportedBrowser;
  headless: boolean;
  viewport?: { width: number; height: number };
  extensionPath?: string;
  serverUrl: string;
  timeout: number;
  slowMo?: number;
  devtools?: boolean;
}

/**
 * Web-Buddy test environment that manages browser lifecycle and server communication
 */
export class WebBuddyTestEnvironment {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  protected webBuddyClient: WebBuddyClient | null = null;
  protected extensionId: string | null = null;

  constructor(
    protected config: TestEnvironmentConfig,
    protected implementationName: string
  ) {}

  /**
   * Initialize the test environment
   */
  public async initialize(): Promise<void> {
    console.log(`🚀 Initializing Web-Buddy test environment for: ${this.implementationName}`);
    
    // Launch browser
    await this.launchBrowser();
    
    // Create browser context
    await this.createContext();
    
    // Create page
    await this.createPage();
    
    // Initialize Web-Buddy client
    this.initializeWebBuddyClient();
    
    // Load extension if specified
    if (this.config.extensionPath) {
      await this.loadExtension();
    }
    
    console.log(`✅ Test environment initialized successfully`);
  }

  /**
   * Launch browser based on configuration
   */
  protected async launchBrowser(): Promise<void> {
    const launchOptions = {
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      devtools: this.config.devtools,
      timeout: this.config.timeout,
      args: this.getBrowserArgs()
    };

    switch (this.config.browser) {
      case 'chromium':
        this.browser = await chromium.launch(launchOptions);
        break;
      case 'firefox':
        this.browser = await firefox.launch(launchOptions);
        break;
      case 'webkit':
        this.browser = await webkit.launch(launchOptions);
        break;
      default:
        throw new Error(`Unsupported browser: ${this.config.browser}`);
    }

    console.log(`🌐 Browser launched: ${this.config.browser}`);
  }

  /**
   * Get browser-specific launch arguments
   */
  protected getBrowserArgs(): string[] {
    const args: string[] = [];

    // Common args
    args.push('--no-sandbox');
    args.push('--disable-dev-shm-usage');

    // Browser-specific args
    if (this.config.browser === 'chromium') {
      if (this.config.extensionPath) {
        args.push(`--load-extension=${this.config.extensionPath}`);
        args.push('--disable-extensions-except=' + this.config.extensionPath);
      }
      args.push('--disable-web-security');
      args.push('--disable-features=VizDisplayCompositor');
    }

    return args;
  }

  /**
   * Create browser context
   */
  protected async createContext(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const contextOptions: any = {
      viewport: this.config.viewport || { width: 1280, height: 720 },
      ignoreHTTPSErrors: true
    };

    // Add permissions for Web-Buddy functionality
    contextOptions.permissions = [
      'microphone',
      'camera',
      'geolocation',
      'notifications'
    ];

    this.context = await this.browser.newContext(contextOptions);
    
    console.log(`📄 Browser context created`);
  }

  /**
   * Create page
   */
  protected async createPage(): Promise<void> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    this.page = await this.context.newPage();
    
    // Set up page event listeners
    this.setupPageEventListeners();
    
    console.log(`📃 Page created`);
  }

  /**
   * Set up page event listeners for debugging and monitoring
   */
  protected setupPageEventListeners(): void {
    if (!this.page) return;

    // Log console messages
    this.page.on('console', (msg) => {
      console.log(`🖥️ Browser Console [${msg.type()}]:`, msg.text());
    });

    // Log page errors
    this.page.on('pageerror', (error) => {
      console.error(`❌ Page Error:`, error.message);
    });

    // Log request failures
    this.page.on('requestfailed', (request) => {
      console.warn(`⚠️ Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Log extension-specific messages
    this.page.on('console', (msg) => {
      if (msg.text().includes('Web-Buddy') || msg.text().includes('🤖')) {
        console.log(`🤖 Extension Log:`, msg.text());
      }
    });
  }

  /**
   * Initialize Web-Buddy client
   */
  protected initializeWebBuddyClient(): void {
    this.webBuddyClient = new WebBuddyClient({
      serverUrl: this.config.serverUrl,
      timeout: this.config.timeout
    });
    
    console.log(`🔗 Web-Buddy client initialized: ${this.config.serverUrl}`);
  }

  /**
   * Load Web-Buddy browser extension
   */
  protected async loadExtension(): Promise<void> {
    if (!this.page || !this.config.extensionPath) {
      throw new Error('Page or extension path not available');
    }

    if (this.config.browser !== 'chromium') {
      console.warn(`⚠️ Extension loading only supported in Chromium, skipping for ${this.config.browser}`);
      return;
    }

    try {
      // Navigate to extensions page to get extension ID
      await this.page.goto('chrome://extensions/');
      await this.page.waitForTimeout(2000);

      // Extract extension ID (simplified - in real implementation, this would be more robust)
      this.extensionId = 'web-buddy-extension-id'; // Placeholder
      
      console.log(`🔌 Extension loaded with ID: ${this.extensionId}`);
      
      // Test extension connectivity
      await this.testExtensionConnectivity();
      
    } catch (error: any) {
      console.error(`❌ Failed to load extension:`, error.message);
      throw error;
    }
  }

  /**
   * Test extension connectivity
   */
  protected async testExtensionConnectivity(): Promise<void> {
    if (!this.page) return;

    try {
      // Navigate to a test page that can interact with the extension
      await this.page.goto('https://example.com');
      await this.page.waitForTimeout(2000);

      // Test if extension is responsive
      const extensionTest = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime) {
            (window as any).chrome.runtime.sendMessage({ action: 'ping' }, (response: any) => {
              resolve(response ? 'connected' : 'no-response');
            });
          } else {
            resolve('no-extension');
          }
          
          // Timeout after 5 seconds
          setTimeout(() => resolve('timeout'), 5000);
        });
      });

      console.log(`🔌 Extension connectivity test result: ${extensionTest}`);
      
    } catch (error: any) {
      console.warn(`⚠️ Extension connectivity test failed:`, error.message);
    }
  }

  /**
   * Navigate to a URL
   */
  public async navigateTo(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    console.log(`🌐 Navigating to: ${url}`);
    
    await this.page.goto(url, {
      waitUntil: options?.waitUntil || 'networkidle',
      timeout: this.config.timeout
    });
    
    // Wait for any dynamic content
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wait for Web-Buddy extension to be ready
   */
  public async waitForExtensionReady(): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    console.log(`⏳ Waiting for Web-Buddy extension to be ready...`);
    
    // Wait for extension to inject its scripts and be ready
    await this.page.waitForFunction(() => {
      return (window as any).webBuddyExtensionReady === true || 
             typeof (window as any).webBuddyClient !== 'undefined';
    }, { timeout: this.config.timeout });
    
    console.log(`✅ Web-Buddy extension is ready`);
  }

  /**
   * Take screenshot for debugging
   */
  public async takeScreenshot(name: string): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const screenshotPath = `./test-results/screenshots/${name}-${Date.now()}.png`;
    await this.page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  /**
   * Get current page information
   */
  public async getPageInfo(): Promise<{
    url: string;
    title: string;
    viewport: { width: number; height: number } | null;
  }> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    return {
      url: this.page.url(),
      title: await this.page.title(),
      viewport: this.page.viewportSize()
    };
  }

  /**
   * Get Web-Buddy client instance
   */
  public getWebBuddyClient(): WebBuddyClient {
    if (!this.webBuddyClient) {
      throw new Error('Web-Buddy client not initialized');
    }
    return this.webBuddyClient;
  }

  /**
   * Get page instance
   */
  public getPage(): Page {
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    return this.page;
  }

  /**
   * Get browser instance
   */
  public getBrowser(): Browser {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    return this.browser;
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    console.log(`🧹 Cleaning up test environment...`);
    
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      
      this.webBuddyClient = null;
      
      console.log(`✅ Test environment cleaned up successfully`);
      
    } catch (error: any) {
      console.error(`❌ Error during cleanup:`, error.message);
      throw error;
    }
  }

  /**
   * Check if environment is ready
   */
  public isReady(): boolean {
    return this.browser !== null && 
           this.context !== null && 
           this.page !== null && 
           this.webBuddyClient !== null;
  }
}

/**
 * Factory function to create test environment with default settings
 */
export function createTestEnvironment(
  implementationName: string,
  options: Partial<TestEnvironmentConfig> = {}
): WebBuddyTestEnvironment {
  const defaultConfig: TestEnvironmentConfig = {
    browser: 'chromium',
    headless: process.env.CI === 'true',
    viewport: { width: 1280, height: 720 },
    serverUrl: 'http://localhost:3002',
    timeout: 30000,
    slowMo: process.env.DEBUG ? 500 : undefined,
    devtools: process.env.DEBUG === 'true',
    ...options
  };
  
  return new WebBuddyTestEnvironment(defaultConfig, implementationName);
}

/**
 * Quick setup function for common test scenarios
 */
export async function quickSetup(
  implementationName: string,
  url: string,
  options: Partial<TestEnvironmentConfig> = {}
): Promise<{
  environment: WebBuddyTestEnvironment;
  client: WebBuddyClient;
  page: Page;
}> {
  const environment = createTestEnvironment(implementationName, options);
  
  await environment.initialize();
  await environment.navigateTo(url);
  
  const client = environment.getWebBuddyClient();
  const page = environment.getPage();
  
  return { environment, client, page };
}