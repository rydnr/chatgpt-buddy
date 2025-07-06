/**
 * @fileoverview Playwright integration for Web-Buddy ATDD framework
 * @description Manages browser automation, extension loading, and test environment setup
 */
import { Browser, BrowserContext, Page } from '@playwright/test';
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
    viewport?: {
        width: number;
        height: number;
    };
    extensionPath?: string;
    serverUrl: string;
    timeout: number;
    slowMo?: number;
    devtools?: boolean;
}
/**
 * Web-Buddy test environment that manages browser lifecycle and server communication
 */
export declare class WebBuddyTestEnvironment {
    protected config: TestEnvironmentConfig;
    protected implementationName: string;
    protected browser: Browser | null;
    protected context: BrowserContext | null;
    protected page: Page | null;
    protected webBuddyClient: WebBuddyClient | null;
    protected extensionId: string | null;
    constructor(config: TestEnvironmentConfig, implementationName: string);
    /**
     * Initialize the test environment
     */
    initialize(): Promise<void>;
    /**
     * Launch browser based on configuration
     */
    protected launchBrowser(): Promise<void>;
    /**
     * Get browser-specific launch arguments
     */
    protected getBrowserArgs(): string[];
    /**
     * Create browser context
     */
    protected createContext(): Promise<void>;
    /**
     * Create page
     */
    protected createPage(): Promise<void>;
    /**
     * Set up page event listeners for debugging and monitoring
     */
    protected setupPageEventListeners(): void;
    /**
     * Initialize Web-Buddy client
     */
    protected initializeWebBuddyClient(): void;
    /**
     * Load Web-Buddy browser extension
     */
    protected loadExtension(): Promise<void>;
    /**
     * Test extension connectivity
     */
    protected testExtensionConnectivity(): Promise<void>;
    /**
     * Navigate to a URL
     */
    navigateTo(url: string, options?: {
        waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    }): Promise<void>;
    /**
     * Wait for Web-Buddy extension to be ready
     */
    waitForExtensionReady(): Promise<void>;
    /**
     * Take screenshot for debugging
     */
    takeScreenshot(name: string): Promise<string>;
    /**
     * Get current page information
     */
    getPageInfo(): Promise<{
        url: string;
        title: string;
        viewport: {
            width: number;
            height: number;
        } | null;
    }>;
    /**
     * Get Web-Buddy client instance
     */
    getWebBuddyClient(): WebBuddyClient;
    /**
     * Get page instance
     */
    getPage(): Page;
    /**
     * Get browser instance
     */
    getBrowser(): Browser;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
    /**
     * Check if environment is ready
     */
    isReady(): boolean;
}
/**
 * Factory function to create test environment with default settings
 */
export declare function createTestEnvironment(implementationName: string, options?: Partial<TestEnvironmentConfig>): WebBuddyTestEnvironment;
/**
 * Quick setup function for common test scenarios
 */
export declare function quickSetup(implementationName: string, url: string, options?: Partial<TestEnvironmentConfig>): Promise<{
    environment: WebBuddyTestEnvironment;
    client: WebBuddyClient;
    page: Page;
}>;
//# sourceMappingURL=playwright-integration.d.ts.map