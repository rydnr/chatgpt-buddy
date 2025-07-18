"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// E2E tests for tab switching functionality
const test_1 = require("@playwright/test");
const ws_1 = __importDefault(require("ws"));
test_1.test.describe('Tab Switching E2E Tests', () => {
    let browser;
    let context;
    let ws;
    let extensionId;
    test_1.test.beforeAll(async () => {
        // Start the test server
        console.log('🚀 Starting test server for tab switching tests...');
        // Launch browser with extension
        browser = await test_1.chromium.launch({
            headless: false, // Need visible browser for tab switching
            args: [
                `--disable-extensions-except=${process.cwd()}/extension`,
                `--load-extension=${process.cwd()}/extension`,
                '--no-first-run',
                '--disable-default-apps'
            ]
        });
        context = await browser.newContext();
    });
    test_1.test.afterAll(async () => {
        if (ws) {
            ws.close();
        }
        await context?.close();
        await browser?.close();
    });
    test_1.test.beforeEach(async () => {
        // Connect to WebSocket server
        ws = new ws_1.default('ws://localhost:3003/ws');
        await new Promise((resolve, reject) => {
            ws.on('open', resolve);
            ws.on('error', reject);
            setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
        });
    });
    test_1.test.afterEach(async () => {
        if (ws && ws.readyState === ws_1.default.OPEN) {
            ws.close();
        }
    });
    (0, test_1.test)('🔄 should switch to tab by title successfully', async () => {
        // Create multiple tabs with different titles
        const googlePage = await context.newPage();
        await googlePage.goto('https://www.google.com');
        await googlePage.waitForLoadState('domcontentloaded');
        const githubPage = await context.newPage();
        await githubPage.goto('https://github.com');
        await githubPage.waitForLoadState('domcontentloaded');
        const facebookPage = await context.newPage();
        await facebookPage.goto('https://www.facebook.com');
        await facebookPage.waitForLoadState('domcontentloaded');
        // Wait for extension to register
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Send tab switch request
        const tabSwitchMessage = {
            type: 'TabSwitchRequested',
            payload: {
                title: 'Google'
            },
            correlationId: 'e2e-tab-switch-test',
            timestamp: new Date().toISOString(),
            eventId: 'tab-switch-e2e-1'
        };
        // Listen for response
        const responsePromise = new Promise((resolve) => {
            ws.on('message', (data) => {
                const response = JSON.parse(data.toString());
                if (response.correlationId === 'e2e-tab-switch-test') {
                    resolve(response);
                }
            });
        });
        // Send the message
        ws.send(JSON.stringify(tabSwitchMessage));
        // Wait for response
        const response = await responsePromise;
        // Verify response
        (0, test_1.expect)(response.status).toBe('success');
        (0, test_1.expect)(response.data.action).toBe('TabSwitchRequested');
        (0, test_1.expect)(response.data.switchedTo.title).toContain('Google');
        (0, test_1.expect)(response.data.switchedTo.url).toContain('google.com');
        // Verify the tab is actually active
        const pages = context.pages();
        const activePage = pages.find(page => page.url().includes('google.com'));
        (0, test_1.expect)(activePage).toBeDefined();
        // Clean up
        await googlePage.close();
        await githubPage.close();
        await facebookPage.close();
    });
    (0, test_1.test)('🔍 should handle case-insensitive title matching', async () => {
        // Create tab with uppercase title
        const page = await context.newPage();
        await page.goto('https://www.github.com');
        await page.waitForLoadState('domcontentloaded');
        // Wait for extension to register
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Send tab switch request with lowercase
        const tabSwitchMessage = {
            type: 'TabSwitchRequested',
            payload: {
                title: 'github' // lowercase
            },
            correlationId: 'e2e-case-insensitive-test',
            timestamp: new Date().toISOString(),
            eventId: 'tab-switch-case-1'
        };
        // Listen for response
        const responsePromise = new Promise((resolve) => {
            ws.on('message', (data) => {
                const response = JSON.parse(data.toString());
                if (response.correlationId === 'e2e-case-insensitive-test') {
                    resolve(response);
                }
            });
        });
        // Send the message
        ws.send(JSON.stringify(tabSwitchMessage));
        // Wait for response
        const response = await responsePromise;
        // Verify response
        (0, test_1.expect)(response.status).toBe('success');
        (0, test_1.expect)(response.data.switchedTo.url).toContain('github.com');
        await page.close();
    });
    (0, test_1.test)('❌ should handle tab not found error', async () => {
        // Create a tab that won't match
        const page = await context.newPage();
        await page.goto('https://www.example.com');
        await page.waitForLoadState('domcontentloaded');
        // Wait for extension to register
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Send tab switch request for non-existent title
        const tabSwitchMessage = {
            type: 'TabSwitchRequested',
            payload: {
                title: 'NonExistentTabTitle'
            },
            correlationId: 'e2e-tab-not-found-test',
            timestamp: new Date().toISOString(),
            eventId: 'tab-switch-error-1'
        };
        // Listen for response
        const responsePromise = new Promise((resolve) => {
            ws.on('message', (data) => {
                const response = JSON.parse(data.toString());
                if (response.correlationId === 'e2e-tab-not-found-test') {
                    resolve(response);
                }
            });
        });
        // Send the message
        ws.send(JSON.stringify(tabSwitchMessage));
        // Wait for response
        const response = await responsePromise;
        // Verify error response
        (0, test_1.expect)(response.status).toBe('error');
        (0, test_1.expect)(response.error).toContain('No tab found with title containing');
        (0, test_1.expect)(response.error).toContain('NonExistentTabTitle');
        (0, test_1.expect)(response.availableTabs).toBeDefined();
        (0, test_1.expect)(Array.isArray(response.availableTabs)).toBe(true);
        await page.close();
    });
    (0, test_1.test)('📋 should provide available tabs in error response', async () => {
        // Create multiple tabs
        const googlePage = await context.newPage();
        await googlePage.goto('https://www.google.com');
        await googlePage.waitForLoadState('domcontentloaded');
        const githubPage = await context.newPage();
        await githubPage.goto('https://github.com');
        await githubPage.waitForLoadState('domcontentloaded');
        // Wait for extension to register
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Send tab switch request for non-existent title
        const tabSwitchMessage = {
            type: 'TabSwitchRequested',
            payload: {
                title: 'SomeRandomTitle'
            },
            correlationId: 'e2e-available-tabs-test',
            timestamp: new Date().toISOString(),
            eventId: 'tab-switch-available-1'
        };
        // Listen for response
        const responsePromise = new Promise((resolve) => {
            ws.on('message', (data) => {
                const response = JSON.parse(data.toString());
                if (response.correlationId === 'e2e-available-tabs-test') {
                    resolve(response);
                }
            });
        });
        // Send the message
        ws.send(JSON.stringify(tabSwitchMessage));
        // Wait for response
        const response = await responsePromise;
        // Verify available tabs are listed
        (0, test_1.expect)(response.status).toBe('error');
        (0, test_1.expect)(response.availableTabs).toBeDefined();
        (0, test_1.expect)(response.availableTabs.length).toBeGreaterThan(0);
        // Check that some of our created tabs are in the list
        const tabTitles = response.availableTabs.map((tab) => tab.title);
        const tabUrls = response.availableTabs.map((tab) => tab.url);
        (0, test_1.expect)(tabUrls.some((url) => url.includes('google.com'))).toBe(true);
        (0, test_1.expect)(tabUrls.some((url) => url.includes('github.com'))).toBe(true);
        await googlePage.close();
        await githubPage.close();
    });
    (0, test_1.test)('🎯 should switch to first matching tab when multiple matches exist', async () => {
        // Create multiple tabs with "test" in title
        const testPage1 = await context.newPage();
        await testPage1.goto('data:text/html,<title>Test Page 1</title><h1>First Test Page</h1>');
        const testPage2 = await context.newPage();
        await testPage2.goto('data:text/html,<title>Test Page 2</title><h1>Second Test Page</h1>');
        const testPage3 = await context.newPage();
        await testPage3.goto('data:text/html,<title>Another Test</title><h1>Third Test Page</h1>');
        // Wait for extension to register
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Send tab switch request
        const tabSwitchMessage = {
            type: 'TabSwitchRequested',
            payload: {
                title: 'Test'
            },
            correlationId: 'e2e-multiple-matches-test',
            timestamp: new Date().toISOString(),
            eventId: 'tab-switch-multiple-1'
        };
        // Listen for response
        const responsePromise = new Promise((resolve) => {
            ws.on('message', (data) => {
                const response = JSON.parse(data.toString());
                if (response.correlationId === 'e2e-multiple-matches-test') {
                    resolve(response);
                }
            });
        });
        // Send the message
        ws.send(JSON.stringify(tabSwitchMessage));
        // Wait for response
        const response = await responsePromise;
        // Verify response
        (0, test_1.expect)(response.status).toBe('success');
        (0, test_1.expect)(response.data.switchedTo.title).toContain('Test');
        (0, test_1.expect)(response.data.totalMatches).toBeGreaterThanOrEqual(3);
        await testPage1.close();
        await testPage2.close();
        await testPage3.close();
    });
    (0, test_1.test)('🔗 should handle special characters in tab titles', async () => {
        // Create tab with special characters
        const specialPage = await context.newPage();
        await specialPage.goto('data:text/html,<title>Test & Special [Characters] (123)</title><h1>Special Characters</h1>');
        // Wait for extension to register
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Send tab switch request
        const tabSwitchMessage = {
            type: 'TabSwitchRequested',
            payload: {
                title: 'Special [Characters]'
            },
            correlationId: 'e2e-special-chars-test',
            timestamp: new Date().toISOString(),
            eventId: 'tab-switch-special-1'
        };
        // Listen for response
        const responsePromise = new Promise((resolve) => {
            ws.on('message', (data) => {
                const response = JSON.parse(data.toString());
                if (response.correlationId === 'e2e-special-chars-test') {
                    resolve(response);
                }
            });
        });
        // Send the message
        ws.send(JSON.stringify(tabSwitchMessage));
        // Wait for response
        const response = await responsePromise;
        // Verify response
        (0, test_1.expect)(response.status).toBe('success');
        (0, test_1.expect)(response.data.switchedTo.title).toContain('Special [Characters]');
        await specialPage.close();
    });
});
//# sourceMappingURL=tab-switching.e2e.test.js.map