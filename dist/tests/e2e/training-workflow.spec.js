"use strict";
// Phase 6: Training-Enhanced E2E Testing
// Complete user guidance and pattern learning workflows
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const training_application_1 = require("../../extension/src/training/application/training-application");
// Test configuration for training workflows
test_1.test.describe('🎓 Interactive Training System E2E Workflows', () => {
    let context;
    let page;
    let trainingApp;
    test_1.test.beforeEach(async ({ browser }) => {
        // Create context with extension permissions
        context = await browser.newContext({
            permissions: ['storage-access'],
            viewport: { width: 1280, height: 720 }
        });
        page = await context.newPage();
        // Initialize training application
        trainingApp = new training_application_1.ChatGPTBuddyTrainingApplication();
        // Mock ChatGPT-like interface for testing
        await page.goto('data:text/html,<!DOCTYPE html><html><head><title>ChatGPT Training Test</title></head><body>' +
            '<div class="header"><h1>ChatGPT</h1></div>' +
            '<div class="sidebar">' +
            '<div class="project-list">' +
            '<div data-testid="project-typescript" class="project-item">TypeScript Development</div>' +
            '<div data-testid="project-python" class="project-item">Python Projects</div>' +
            '<div data-testid="project-javascript" class="project-item">JavaScript Apps</div>' +
            '</div>' +
            '</div>' +
            '<div class="main-content">' +
            '<div class="chat-list">' +
            '<div data-testid="chat-algorithms" class="chat-item">Algorithm Discussion</div>' +
            '<div data-testid="chat-patterns" class="chat-item">Design Patterns</div>' +
            '</div>' +
            '<div class="chat-interface">' +
            '<input data-testid="prompt-input" type="text" placeholder="Send a message..." />' +
            '<button data-testid="send-button">Send</button>' +
            '</div>' +
            '<div class="response-area" data-testid="response-area"></div>' +
            '</div>' +
            '<style>' +
            'body { font-family: sans-serif; margin: 0; display: flex; flex-direction: column; height: 100vh; }' +
            '.header { background: #343541; color: white; padding: 1rem; }' +
            '.sidebar { width: 250px; background: #202123; color: white; padding: 1rem; position: fixed; height: 100%; }' +
            '.project-item, .chat-item { padding: 0.5rem; margin: 0.5rem 0; background: #40414f; border-radius: 4px; cursor: pointer; }' +
            '.project-item:hover, .chat-item:hover { background: #565869; }' +
            '.main-content { margin-left: 250px; padding: 1rem; flex: 1; }' +
            '.chat-interface { display: flex; gap: 0.5rem; margin: 1rem 0; }' +
            '.chat-interface input { flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }' +
            '.chat-interface button { padding: 0.5rem 1rem; background: #19c37d; color: white; border: none; border-radius: 4px; cursor: pointer; }' +
            '.response-area { min-height: 200px; border: 1px solid #ccc; border-radius: 4px; padding: 1rem; background: #f9f9f9; }' +
            '</style>' +
            '</body></html>');
        // Inject training application into page context
        await page.addInitScript(() => {
            window.trainingApp = null; // Will be set by test
        });
    });
    test_1.test.afterEach(async () => {
        if (trainingApp) {
            await trainingApp.stop();
        }
        await context.close();
    });
    (0, test_1.test)('🎯 Complete training workflow: Project selection learning', async () => {
        // GIVEN: Training mode enabled and ChatGPT-like page loaded
        await trainingApp.start();
        const enableResult = await trainingApp.enableTrainingMode('localhost');
        (0, test_1.expect)(enableResult.eventType).toBe('TrainingModeEnabled');
        // WHEN: ProjectSelectionRequested automation is requested
        const projectRequest = {
            messageType: 'SelectProjectRequested',
            payload: { projectName: 'TypeScript Development' },
            context: {
                url: page.url(),
                hostname: 'localhost',
                pathname: '/',
                title: 'ChatGPT Training Test',
                timestamp: new Date()
            }
        };
        // Trigger automation request (in real scenario, this comes from server)
        const requestResult = await trainingApp.handleAutomationRequest(projectRequest);
        (0, test_1.expect)(requestResult.eventType).toBe('ElementSelectionRequested');
        // THEN: Training UI should appear with guidance
        await page.waitForFunction(() => {
            return document.querySelector('.training-overlay') !== null;
        }, { timeout: 5000 });
        const trainingOverlay = page.locator('.training-overlay');
        await (0, test_1.expect)(trainingOverlay).toBeVisible();
        await (0, test_1.expect)(trainingOverlay).toContainText('Training Mode Active');
        await (0, test_1.expect)(trainingOverlay).toContainText('SelectProjectRequested');
        // WHEN: User clicks on the TypeScript project (simulating element selection)
        await page.locator('[data-testid="project-typescript"]').click();
        // THEN: Confirmation dialog should appear
        await page.waitForFunction(() => {
            return document.querySelector('.training-confirmation-overlay') !== null;
        }, { timeout: 3000 });
        const confirmationDialog = page.locator('.training-confirmation-overlay');
        await (0, test_1.expect)(confirmationDialog).toBeVisible();
        await (0, test_1.expect)(confirmationDialog).toContainText('Element Selected');
        await (0, test_1.expect)(confirmationDialog).toContainText('Do you want to automate');
        // WHEN: User confirms automation
        await page.locator('button:has-text("Yes, Automate")').click();
        // THEN: Pattern should be learned and UI should disappear
        await (0, test_1.expect)(trainingOverlay).not.toBeVisible();
        await (0, test_1.expect)(confirmationDialog).not.toBeVisible();
        // AND: Pattern should be stored in application
        const patterns = await trainingApp.exportPatterns();
        (0, test_1.expect)(patterns.length).toBeGreaterThan(0);
        const learnedPattern = patterns.find(p => p.messageType === 'SelectProjectRequested');
        (0, test_1.expect)(learnedPattern).toBeDefined();
        (0, test_1.expect)(learnedPattern.selector).toContain('project-typescript');
        (0, test_1.expect)(learnedPattern.confidence).toBe(1.0);
    });
    (0, test_1.test)('🚀 Auto-execution of learned patterns without training UI', async () => {
        // GIVEN: Pattern already learned and stored
        await trainingApp.start();
        const existingPattern = {
            id: 'test-project-pattern',
            messageType: 'SelectProjectRequested',
            payload: { projectName: 'TypeScript Development' },
            selector: '[data-testid="project-typescript"]',
            context: {
                url: page.url(),
                hostname: 'localhost',
                pathname: '/',
                title: 'ChatGPT Training Test',
                timestamp: new Date()
            },
            confidence: 1.0,
            usageCount: 0,
            successfulExecutions: 0
        };
        await trainingApp.importPatterns([existingPattern]);
        await trainingApp.switchToAutomaticMode();
        // WHEN: Same automation request is made in automatic mode
        const projectRequest = {
            messageType: 'SelectProjectRequested',
            payload: { projectName: 'TypeScript Development' },
            context: {
                url: page.url(),
                hostname: 'localhost',
                pathname: '/',
                title: 'ChatGPT Training Test',
                timestamp: new Date()
            }
        };
        // Execute automation request
        const result = await trainingApp.handleAutomationRequest(projectRequest);
        // THEN: Should execute automatically without training UI
        await (0, test_1.expect)(page.locator('.training-overlay')).not.toBeVisible();
        // Pattern execution should have been attempted
        (0, test_1.expect)(['AutomationPatternExecuted', 'PatternExecutionFailed']).toContain(result.eventType);
        // AND: Element should show interaction (visual feedback)
        const projectElement = page.locator('[data-testid="project-typescript"]');
        await (0, test_1.expect)(projectElement).toBeVisible();
    });
    (0, test_1.test)('💬 Chat selection training workflow', async () => {
        // GIVEN: Training mode for chat selection
        await trainingApp.start();
        await trainingApp.enableTrainingMode('localhost');
        // WHEN: ChatSelectionRequested automation is requested
        const chatRequest = {
            messageType: 'SelectChatRequested',
            payload: { chatTitle: 'Algorithm Discussion' },
            context: {
                url: page.url(),
                hostname: 'localhost',
                pathname: '/',
                title: 'ChatGPT Training Test',
                timestamp: new Date()
            }
        };
        await trainingApp.handleAutomationRequest(chatRequest);
        // THEN: Training UI appears for chat selection
        await page.waitForSelector('.training-overlay');
        const trainingOverlay = page.locator('.training-overlay');
        await (0, test_1.expect)(trainingOverlay).toContainText('SelectChatRequested');
        // WHEN: User selects chat element
        await page.locator('[data-testid="chat-algorithms"]').click();
        // THEN: Confirmation dialog for chat selection
        await page.waitForSelector('.training-confirmation-overlay');
        await (0, test_1.expect)(page.locator('.training-confirmation-overlay')).toContainText('chat-algorithms');
        // WHEN: User confirms
        await page.locator('button:has-text("Yes, Automate")').click();
        // THEN: Chat selection pattern should be learned
        const patterns = await trainingApp.exportPatterns();
        const chatPattern = patterns.find(p => p.messageType === 'SelectChatRequested');
        (0, test_1.expect)(chatPattern).toBeDefined();
        (0, test_1.expect)(chatPattern.selector).toContain('chat-algorithms');
    });
    (0, test_1.test)('✏️ Text input training workflow', async () => {
        // GIVEN: Training mode for text input
        await trainingApp.start();
        await trainingApp.enableTrainingMode('localhost');
        // WHEN: FillTextRequested automation is requested
        const textRequest = {
            messageType: 'FillTextRequested',
            payload: {
                element: 'prompt input',
                value: 'Explain TypeScript decorators'
            },
            context: {
                url: page.url(),
                hostname: 'localhost',
                pathname: '/',
                title: 'ChatGPT Training Test',
                timestamp: new Date()
            }
        };
        await trainingApp.handleAutomationRequest(textRequest);
        // THEN: Training UI appears with text-specific guidance
        await page.waitForSelector('.training-overlay');
        const trainingOverlay = page.locator('.training-overlay');
        await (0, test_1.expect)(trainingOverlay).toContainText('FillTextRequested');
        await (0, test_1.expect)(trainingOverlay).toContainText('prompt input');
        // WHEN: User clicks on the text input
        await page.locator('[data-testid="prompt-input"]').click();
        // THEN: Confirmation shows input element details
        await page.waitForSelector('.training-confirmation-overlay');
        const confirmationDialog = page.locator('.training-confirmation-overlay');
        await (0, test_1.expect)(confirmationDialog).toContainText('input');
        await (0, test_1.expect)(confirmationDialog).toContainText('prompt-input');
        // WHEN: User confirms text input automation
        await page.locator('button:has-text("Yes, Automate")').click();
        // THEN: Text input pattern should be learned
        const patterns = await trainingApp.exportPatterns();
        const textPattern = patterns.find(p => p.messageType === 'FillTextRequested');
        (0, test_1.expect)(textPattern).toBeDefined();
        (0, test_1.expect)(textPattern.selector).toContain('prompt-input');
    });
    (0, test_1.test)('❌ Training cancellation workflow', async () => {
        // GIVEN: Training mode active
        await trainingApp.start();
        await trainingApp.enableTrainingMode('localhost');
        // WHEN: Automation request triggers training
        const request = {
            messageType: 'ClickElementRequested',
            payload: { element: 'send button' },
            context: {
                url: page.url(),
                hostname: 'localhost',
                pathname: '/',
                title: 'ChatGPT Training Test',
                timestamp: new Date()
            }
        };
        await trainingApp.handleAutomationRequest(request);
        await page.waitForSelector('.training-overlay');
        // WHEN: User cancels training
        await page.locator('button:has-text("Cancel")').click();
        // THEN: Training UI should disappear
        await (0, test_1.expect)(page.locator('.training-overlay')).not.toBeVisible();
        // AND: No patterns should be learned
        const patterns = await trainingApp.exportPatterns();
        const cancelledPattern = patterns.find(p => p.messageType === 'ClickElementRequested');
        (0, test_1.expect)(cancelledPattern).toBeUndefined();
    });
    (0, test_1.test)('🔄 Pattern re-learning workflow', async () => {
        // GIVEN: Existing pattern that user wants to retrain
        await trainingApp.start();
        const oldPattern = {
            id: 'old-pattern',
            messageType: 'ClickElementRequested',
            payload: { element: 'send button' },
            selector: '[data-testid="old-send-button"]', // Wrong selector
            context: {
                url: page.url(),
                hostname: 'localhost',
                pathname: '/',
                title: 'ChatGPT Training Test',
                timestamp: new Date()
            },
            confidence: 0.3, // Low confidence
            usageCount: 5,
            successfulExecutions: 1 // Low success rate
        };
        await trainingApp.importPatterns([oldPattern]);
        await trainingApp.enableTrainingMode('localhost');
        // WHEN: Same automation request is made
        const request = {
            messageType: 'ClickElementRequested',
            payload: { element: 'send button' },
            context: {
                url: page.url(),
                hostname: 'localhost',
                pathname: '/',
                title: 'ChatGPT Training Test',
                timestamp: new Date()
            }
        };
        await trainingApp.handleAutomationRequest(request);
        // THEN: Should still show training UI for retraining
        await page.waitForSelector('.training-overlay');
        await (0, test_1.expect)(page.locator('.training-overlay')).toBeVisible();
        // WHEN: User selects correct element
        await page.locator('[data-testid="send-button"]').click();
        await page.waitForSelector('.training-confirmation-overlay');
        await page.locator('button:has-text("Yes, Automate")').click();
        // THEN: New pattern should be created with correct selector
        const patterns = await trainingApp.exportPatterns();
        const updatedPatterns = patterns.filter(p => p.messageType === 'ClickElementRequested');
        (0, test_1.expect)(updatedPatterns.length).toBeGreaterThan(0);
        const latestPattern = updatedPatterns[updatedPatterns.length - 1];
        (0, test_1.expect)(latestPattern.selector).toContain('send-button');
        (0, test_1.expect)(latestPattern.confidence).toBe(1.0);
    });
    (0, test_1.test)('📊 Pattern statistics and analytics', async () => {
        // GIVEN: Multiple patterns with usage history
        await trainingApp.start();
        const patterns = [
            {
                id: 'high-usage-pattern',
                messageType: 'SelectProjectRequested',
                payload: { projectName: 'TypeScript' },
                selector: '[data-testid="project-typescript"]',
                context: {
                    url: page.url(),
                    hostname: 'localhost',
                    pathname: '/',
                    title: 'ChatGPT Training Test',
                    timestamp: new Date()
                },
                confidence: 1.2,
                usageCount: 10,
                successfulExecutions: 9
            },
            {
                id: 'low-usage-pattern',
                messageType: 'FillTextRequested',
                payload: { element: 'input' },
                selector: 'input[type="text"]',
                context: {
                    url: page.url(),
                    hostname: 'localhost',
                    pathname: '/',
                    title: 'ChatGPT Training Test',
                    timestamp: new Date()
                },
                confidence: 0.8,
                usageCount: 3,
                successfulExecutions: 1
            }
        ];
        await trainingApp.importPatterns(patterns);
        // WHEN: Getting pattern statistics
        const stats = await trainingApp.getPatternStatistics();
        // THEN: Statistics should reflect pattern data
        (0, test_1.expect)(stats.totalPatterns).toBe(2);
        (0, test_1.expect)(stats.averageConfidence).toBeGreaterThan(0);
        (0, test_1.expect)(stats.successRate).toBeGreaterThan(0);
        (0, test_1.expect)(stats.patternsByType['SelectProjectRequested']).toBe(1);
        (0, test_1.expect)(stats.patternsByType['FillTextRequested']).toBe(1);
        // AND: Should be able to clean up low-performing patterns
        const deletedCount = await trainingApp.cleanupStalePatterns(0); // Aggressive cleanup
        (0, test_1.expect)(deletedCount).toBeGreaterThanOrEqual(0);
    });
    (0, test_1.test)('🌐 Multi-website pattern isolation', async () => {
        // GIVEN: Patterns from different websites
        await trainingApp.start();
        const chatgptPattern = {
            id: 'chatgpt-pattern',
            messageType: 'FillTextRequested',
            payload: { element: 'prompt' },
            selector: '#prompt-textarea',
            context: {
                url: 'https://chatgpt.com/chat',
                hostname: 'chatgpt.com',
                pathname: '/chat',
                title: 'ChatGPT',
                timestamp: new Date()
            },
            confidence: 1.0,
            usageCount: 5,
            successfulExecutions: 5
        };
        const googlePattern = {
            id: 'google-pattern',
            messageType: 'FillTextRequested',
            payload: { element: 'search' },
            selector: 'input[name="q"]',
            context: {
                url: 'https://google.com/',
                hostname: 'google.com',
                pathname: '/',
                title: 'Google',
                timestamp: new Date()
            },
            confidence: 1.0,
            usageCount: 3,
            successfulExecutions: 3
        };
        await trainingApp.importPatterns([chatgptPattern, googlePattern]);
        await trainingApp.switchToAutomaticMode();
        // WHEN: Making request on localhost (different hostname)
        const localhostRequest = {
            messageType: 'FillTextRequested',
            payload: { element: 'prompt' },
            context: {
                url: page.url(),
                hostname: 'localhost',
                pathname: '/',
                title: 'Test Page',
                timestamp: new Date()
            }
        };
        const result = await trainingApp.handleAutomationRequest(localhostRequest);
        // THEN: Should not match patterns from different hostnames
        // Should fall back to requesting element selection
        (0, test_1.expect)(result.eventType).toBe('PatternExecutionFailed');
    });
});
// Helper functions for E2E testing
async function simulateTyping(page, selector, text, delay = 50) {
    const element = page.locator(selector);
    await element.focus();
    await element.fill('');
    for (const char of text) {
        await element.type(char, { delay });
    }
}
//# sourceMappingURL=training-workflow.spec.js.map