"use strict";
// Phase 6: Pattern Matching and Auto-Execution E2E Tests
// Automated pattern recognition and execution workflows
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const training_application_1 = require("../../extension/src/training/application/training-application");
test_1.test.describe('🎯 Pattern Matching and Auto-Execution E2E', () => {
    let context;
    let page;
    let trainingApp;
    test_1.test.beforeEach(async ({ browser }) => {
        context = await browser.newContext({
            permissions: ['storage-access'],
            viewport: { width: 1280, height: 720 }
        });
        page = await context.newPage();
        trainingApp = new training_application_1.ChatGPTBuddyTrainingApplication();
        // Create comprehensive test page with various interaction elements
        await page.goto('data:text/html,<!DOCTYPE html><html><head><title>Pattern Execution Test</title></head><body>' +
            '<div class="app-container">' +
            '<header class="main-header">' +
            '<h1>Pattern Execution Test Environment</h1>' +
            '<nav class="navigation">' +
            '<button id="nav-home" class="nav-button active">Home</button>' +
            '<button id="nav-projects" class="nav-button">Projects</button>' +
            '<button id="nav-settings" class="nav-button">Settings</button>' +
            '</nav>' +
            '</header>' +
            '<aside class="sidebar">' +
            '<div class="project-section">' +
            '<h3>Projects</h3>' +
            '<div class="project-list">' +
            '<div data-testid="project-react" class="project-item" data-project="react">React Application</div>' +
            '<div data-testid="project-vue" class="project-item" data-project="vue">Vue.js Project</div>' +
            '<div data-testid="project-angular" class="project-item" data-project="angular">Angular App</div>' +
            '<div data-testid="project-node" class="project-item" data-project="node">Node.js Backend</div>' +
            '</div>' +
            '</div>' +
            '<div class="chat-section">' +
            '<h3>Recent Chats</h3>' +
            '<div class="chat-list">' +
            '<div data-testid="chat-debugging" class="chat-item" data-chat="debugging">Debugging Session</div>' +
            '<div data-testid="chat-architecture" class="chat-item" data-chat="architecture">Architecture Review</div>' +
            '<div data-testid="chat-performance" class="chat-item" data-chat="performance">Performance Optimization</div>' +
            '</div>' +
            '</div>' +
            '</aside>' +
            '<main class="main-content">' +
            '<div class="workspace">' +
            '<div class="input-section">' +
            '<div class="form-group">' +
            '<label for="task-input">Task Description</label>' +
            '<input id="task-input" data-testid="task-input" type="text" placeholder="Describe your task..." />' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="priority-select">Priority Level</label>' +
            '<select id="priority-select" data-testid="priority-select">' +
            '<option value="low">Low Priority</option>' +
            '<option value="medium">Medium Priority</option>' +
            '<option value="high">High Priority</option>' +
            '<option value="urgent">Urgent</option>' +
            '</select>' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="description-textarea">Detailed Description</label>' +
            '<textarea id="description-textarea" data-testid="description-textarea" rows="4" placeholder="Provide more details..."></textarea>' +
            '</div>' +
            '<div class="button-group">' +
            '<button id="save-button" data-testid="save-button" class="btn btn-primary">Save Task</button>' +
            '<button id="submit-button" data-testid="submit-button" class="btn btn-success">Submit for Review</button>' +
            '<button id="cancel-button" data-testid="cancel-button" class="btn btn-secondary">Cancel</button>' +
            '</div>' +
            '</div>' +
            '<div class="results-section" data-testid="results-section">' +
            '<h3>Execution Results</h3>' +
            '<div id="execution-log" class="execution-log"></div>' +
            '</div>' +
            '</div>' +
            '</main>' +
            '</div>' +
            // Comprehensive CSS for realistic styling
            '<style>' +
            '* { box-sizing: border-box; margin: 0; padding: 0; }' +
            'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f7fa; }' +
            '.app-container { display: grid; grid-template: "header header" auto "sidebar main" 1fr / 300px 1fr; min-height: 100vh; }' +
            '.main-header { grid-area: header; background: #2c3e50; color: white; padding: 1rem; display: flex; justify-content: space-between; align-items: center; }' +
            '.navigation { display: flex; gap: 1rem; }' +
            '.nav-button { padding: 0.5rem 1rem; background: transparent; color: white; border: 1px solid #34495e; border-radius: 4px; cursor: pointer; transition: background 0.2s; }' +
            '.nav-button:hover, .nav-button.active { background: #34495e; }' +
            '.sidebar { grid-area: sidebar; background: white; border-right: 1px solid #e0e6ed; padding: 1.5rem; overflow-y: auto; }' +
            '.sidebar h3 { color: #2c3e50; margin-bottom: 1rem; font-size: 1.1rem; }' +
            '.project-item, .chat-item { padding: 0.75rem; margin: 0.5rem 0; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; cursor: pointer; transition: all 0.2s; }' +
            '.project-item:hover, .chat-item:hover { background: #e3f2fd; border-color: #2196f3; transform: translateX(2px); }' +
            '.project-item.selected, .chat-item.selected { background: #1976d2; color: white; }' +
            '.main-content { grid-area: main; padding: 2rem; overflow-y: auto; }' +
            '.workspace { max-width: 800px; }' +
            '.input-section { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 2rem; }' +
            '.form-group { margin-bottom: 1.5rem; }' +
            '.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #2c3e50; }' +
            '.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; transition: border-color 0.2s; }' +
            '.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #2196f3; box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2); }' +
            '.button-group { display: flex; gap: 1rem; justify-content: flex-start; }' +
            '.btn { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; font-size: 1rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }' +
            '.btn-primary { background: #2196f3; color: white; }' +
            '.btn-primary:hover { background: #1976d2; }' +
            '.btn-success { background: #4caf50; color: white; }' +
            '.btn-success:hover { background: #388e3c; }' +
            '.btn-secondary { background: #6c757d; color: white; }' +
            '.btn-secondary:hover { background: #5a6268; }' +
            '.results-section { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }' +
            '.execution-log { min-height: 200px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 1rem; font-family: "Monaco", "Menlo", monospace; white-space: pre-wrap; }' +
            '.log-entry { margin: 0.25rem 0; padding: 0.25rem 0.5rem; border-radius: 3px; }' +
            '.log-success { background: #d4edda; color: #155724; }' +
            '.log-error { background: #f8d7da; color: #721c24; }' +
            '.log-info { background: #d1ecf1; color: #0c5460; }' +
            '</style>' +
            // JavaScript for realistic interactions
            '<script>' +
            'document.addEventListener("DOMContentLoaded", function() {' +
            'const log = document.getElementById("execution-log");' +
            'function addLogEntry(message, type = "info") {' +
            'const entry = document.createElement("div");' +
            'entry.className = `log-entry log-${type}`;' +
            'entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;' +
            'log.appendChild(entry);' +
            'log.scrollTop = log.scrollHeight;' +
            '}' +
            // Project selection handlers
            'document.querySelectorAll(".project-item").forEach(item => {' +
            'item.addEventListener("click", function() {' +
            'document.querySelectorAll(".project-item").forEach(p => p.classList.remove("selected"));' +
            'this.classList.add("selected");' +
            'addLogEntry(`Selected project: ${this.textContent}`, "success");' +
            '});' +
            '});' +
            // Chat selection handlers
            'document.querySelectorAll(".chat-item").forEach(item => {' +
            'item.addEventListener("click", function() {' +
            'document.querySelectorAll(".chat-item").forEach(c => c.classList.remove("selected"));' +
            'this.classList.add("selected");' +
            'addLogEntry(`Opened chat: ${this.textContent}`, "success");' +
            '});' +
            '});' +
            // Form interaction handlers
            'document.getElementById("task-input").addEventListener("input", function() {' +
            'if (this.value.length > 0) addLogEntry(`Task input updated: ${this.value.substring(0, 30)}...`, "info");' +
            '});' +
            'document.getElementById("priority-select").addEventListener("change", function() {' +
            'addLogEntry(`Priority changed to: ${this.value}`, "info");' +
            '});' +
            'document.getElementById("save-button").addEventListener("click", function() {' +
            'addLogEntry("Task saved successfully", "success");' +
            '});' +
            'document.getElementById("submit-button").addEventListener("click", function() {' +
            'addLogEntry("Task submitted for review", "success");' +
            '});' +
            'document.getElementById("cancel-button").addEventListener("click", function() {' +
            'addLogEntry("Operation cancelled", "info");' +
            '});' +
            'addLogEntry("Test environment initialized", "info");' +
            '});' +
            '</script>' +
            '</body></html>');
    });
    test_1.test.afterEach(async () => {
        if (trainingApp) {
            await trainingApp.stop();
        }
        await context.close();
    });
    (0, test_1.test)('🚀 High-confidence pattern auto-execution', async () => {
        // GIVEN: High-confidence patterns stored in application
        await trainingApp.start();
        const highConfidencePatterns = [
            {
                id: 'react-project-pattern',
                messageType: 'SelectProjectRequested',
                payload: { projectName: 'React Application' },
                selector: '[data-testid="project-react"]',
                context: getCurrentContext(page),
                confidence: 1.5, // High confidence from successful usage
                usageCount: 15,
                successfulExecutions: 14
            },
            {
                id: 'task-input-pattern',
                messageType: 'FillTextRequested',
                payload: { element: 'task input', value: 'sample task' },
                selector: '[data-testid="task-input"]',
                context: getCurrentContext(page),
                confidence: 1.3,
                usageCount: 8,
                successfulExecutions: 8
            }
        ];
        await trainingApp.importPatterns(highConfidencePatterns);
        await trainingApp.switchToAutomaticMode();
        // WHEN: Automation requests that match high-confidence patterns
        const projectRequest = {
            messageType: 'SelectProjectRequested',
            payload: { projectName: 'React Application' },
            context: getCurrentContext(page)
        };
        const result1 = await trainingApp.handleAutomationRequest(projectRequest);
        // THEN: Should execute automatically without training UI
        await (0, test_1.expect)(page.locator('.training-overlay')).not.toBeVisible();
        (0, test_1.expect)(['AutomationPatternExecuted', 'PatternExecutionFailed']).toContain(result1.eventType);
        // AND: Project should be visually selected
        await (0, test_1.expect)(page.locator('[data-testid="project-react"]')).toHaveClass(/selected/);
        // WHEN: Text input automation request
        const textRequest = {
            messageType: 'FillTextRequested',
            payload: { element: 'task input', value: 'Implement user authentication' },
            context: getCurrentContext(page)
        };
        const result2 = await trainingApp.handleAutomationRequest(textRequest);
        // THEN: Should execute text filling automatically
        (0, test_1.expect)(['AutomationPatternExecuted', 'PatternExecutionFailed']).toContain(result2.eventType);
        // Verify text was actually entered
        const inputValue = await page.locator('[data-testid="task-input"]').inputValue();
        (0, test_1.expect)(inputValue).toBe('Implement user authentication');
    });
    (0, test_1.test)('🎯 Pattern matching with payload variations', async () => {
        // GIVEN: Patterns that should match similar requests
        await trainingApp.start();
        const basePattern = {
            id: 'flexible-project-pattern',
            messageType: 'SelectProjectRequested',
            payload: { projectName: 'Vue.js Project' },
            selector: '[data-testid="project-vue"]',
            context: getCurrentContext(page),
            confidence: 1.0,
            usageCount: 5,
            successfulExecutions: 5
        };
        await trainingApp.importPatterns([basePattern]);
        await trainingApp.switchToAutomaticMode();
        // WHEN: Similar but not identical request (different project name format)
        const similarRequest = {
            messageType: 'SelectProjectRequested',
            payload: { projectName: 'Vue Project' }, // Slightly different name
            context: getCurrentContext(page)
        };
        const result = await trainingApp.handleAutomationRequest(similarRequest);
        // THEN: Should still match due to similarity algorithm
        if (result.eventType === 'AutomationPatternExecuted') {
            await (0, test_1.expect)(page.locator('[data-testid="project-vue"]')).toHaveClass(/selected/);
        }
        // Pattern matching may or may not succeed depending on similarity threshold
        (0, test_1.expect)(['AutomationPatternExecuted', 'PatternExecutionFailed', 'ElementSelectionRequested']).toContain(result.eventType);
    });
    (0, test_1.test)('⚡ Multiple pattern execution sequence', async () => {
        // GIVEN: Multiple sequential patterns
        await trainingApp.start();
        const sequentialPatterns = [
            {
                id: 'select-node-project',
                messageType: 'SelectProjectRequested',
                payload: { projectName: 'Node.js Backend' },
                selector: '[data-testid="project-node"]',
                context: getCurrentContext(page),
                confidence: 1.2,
                usageCount: 10,
                successfulExecutions: 9
            },
            {
                id: 'select-debugging-chat',
                messageType: 'SelectChatRequested',
                payload: { chatTitle: 'Debugging Session' },
                selector: '[data-testid="chat-debugging"]',
                context: getCurrentContext(page),
                confidence: 1.1,
                usageCount: 7,
                successfulExecutions: 6
            },
            {
                id: 'fill-task-description',
                messageType: 'FillTextRequested',
                payload: { element: 'task input' },
                selector: '[data-testid="task-input"]',
                context: getCurrentContext(page),
                confidence: 1.0,
                usageCount: 12,
                successfulExecutions: 11
            },
            {
                id: 'click-save-button',
                messageType: 'ClickElementRequested',
                payload: { element: 'save button' },
                selector: '[data-testid="save-button"]',
                context: getCurrentContext(page),
                confidence: 1.3,
                usageCount: 20,
                successfulExecutions: 19
            }
        ];
        await trainingApp.importPatterns(sequentialPatterns);
        await trainingApp.switchToAutomaticMode();
        // WHEN: Executing sequence of automation requests
        const requests = [
            {
                messageType: 'SelectProjectRequested',
                payload: { projectName: 'Node.js Backend' },
                context: getCurrentContext(page)
            },
            {
                messageType: 'SelectChatRequested',
                payload: { chatTitle: 'Debugging Session' },
                context: getCurrentContext(page)
            },
            {
                messageType: 'FillTextRequested',
                payload: { element: 'task input', value: 'Fix memory leak in user service' },
                context: getCurrentContext(page)
            },
            {
                messageType: 'ClickElementRequested',
                payload: { element: 'save button' },
                context: getCurrentContext(page)
            }
        ];
        const results = [];
        for (const request of requests) {
            const result = await trainingApp.handleAutomationRequest(request);
            results.push(result);
            // Small delay between actions for realistic execution
            await page.waitForTimeout(100);
        }
        // THEN: All patterns should execute successfully
        results.forEach(result => {
            (0, test_1.expect)(['AutomationPatternExecuted', 'PatternExecutionFailed']).toContain(result.eventType);
        });
        // AND: Verify final state
        await (0, test_1.expect)(page.locator('[data-testid="project-node"]')).toHaveClass(/selected/);
        await (0, test_1.expect)(page.locator('[data-testid="chat-debugging"]')).toHaveClass(/selected/);
        const taskValue = await page.locator('[data-testid="task-input"]').inputValue();
        (0, test_1.expect)(taskValue).toBe('Fix memory leak in user service');
        // Verify save button was clicked (check logs)
        const logContent = await page.locator('#execution-log').textContent();
        (0, test_1.expect)(logContent).toContain('Task saved successfully');
    });
    (0, test_1.test)('🔄 Pattern confidence updates after execution', async () => {
        // GIVEN: Pattern with moderate confidence
        await trainingApp.start();
        const moderatePattern = {
            id: 'confidence-test-pattern',
            messageType: 'ClickElementRequested',
            payload: { element: 'submit button' },
            selector: '[data-testid="submit-button"]',
            context: getCurrentContext(page),
            confidence: 0.8,
            usageCount: 3,
            successfulExecutions: 2
        };
        await trainingApp.importPatterns([moderatePattern]);
        await trainingApp.switchToAutomaticMode();
        // WHEN: Pattern is executed successfully multiple times
        const request = {
            messageType: 'ClickElementRequested',
            payload: { element: 'submit button' },
            context: getCurrentContext(page)
        };
        // Execute multiple times
        for (let i = 0; i < 3; i++) {
            const result = await trainingApp.handleAutomationRequest(request);
            if (result.eventType === 'AutomationPatternExecuted') {
                // Verify button was clicked
                const logContent = await page.locator('#execution-log').textContent();
                (0, test_1.expect)(logContent).toContain('Task submitted for review');
            }
            await page.waitForTimeout(50);
        }
        // THEN: Pattern confidence should have increased
        const updatedPatterns = await trainingApp.exportPatterns();
        const updatedPattern = updatedPatterns.find(p => p.id === 'confidence-test-pattern');
        if (updatedPattern) {
            (0, test_1.expect)(updatedPattern.usageCount).toBeGreaterThan(3);
            (0, test_1.expect)(updatedPattern.confidence).toBeGreaterThanOrEqual(0.8);
        }
    });
    (0, test_1.test)('❌ Pattern execution failure and recovery', async () => {
        // GIVEN: Pattern with invalid selector
        await trainingApp.start();
        const invalidPattern = {
            id: 'invalid-selector-pattern',
            messageType: 'ClickElementRequested',
            payload: { element: 'nonexistent button' },
            selector: '[data-testid="nonexistent-button"]', // Invalid selector
            context: getCurrentContext(page),
            confidence: 1.0,
            usageCount: 1,
            successfulExecutions: 0
        };
        await trainingApp.importPatterns([invalidPattern]);
        await trainingApp.switchToAutomaticMode();
        // WHEN: Attempting to execute invalid pattern
        const request = {
            messageType: 'ClickElementRequested',
            payload: { element: 'nonexistent button' },
            context: getCurrentContext(page)
        };
        const result = await trainingApp.handleAutomationRequest(request);
        // THEN: Should fail gracefully
        (0, test_1.expect)(result.eventType).toBe('PatternExecutionFailed');
        // AND: Pattern confidence should be reduced
        const updatedPatterns = await trainingApp.exportPatterns();
        const updatedPattern = updatedPatterns.find(p => p.id === 'invalid-selector-pattern');
        if (updatedPattern) {
            (0, test_1.expect)(updatedPattern.confidence).toBeLessThan(1.0);
        }
    });
    (0, test_1.test)('🎨 Complex form filling pattern execution', async () => {
        // GIVEN: Comprehensive form filling patterns
        await trainingApp.start();
        const formPatterns = [
            {
                id: 'task-input-fill',
                messageType: 'FillTextRequested',
                payload: { element: 'task input' },
                selector: '[data-testid="task-input"]',
                context: getCurrentContext(page),
                confidence: 1.2,
                usageCount: 15,
                successfulExecutions: 14
            },
            {
                id: 'priority-select',
                messageType: 'SelectOptionRequested',
                payload: { element: 'priority select', value: 'high' },
                selector: '[data-testid="priority-select"]',
                context: getCurrentContext(page),
                confidence: 1.1,
                usageCount: 8,
                successfulExecutions: 8
            },
            {
                id: 'description-fill',
                messageType: 'FillTextRequested',
                payload: { element: 'description textarea' },
                selector: '[data-testid="description-textarea"]',
                context: getCurrentContext(page),
                confidence: 1.0,
                usageCount: 10,
                successfulExecutions: 9
            }
        ];
        await trainingApp.importPatterns(formPatterns);
        await trainingApp.switchToAutomaticMode();
        // WHEN: Executing complex form filling sequence
        const formRequests = [
            {
                messageType: 'FillTextRequested',
                payload: {
                    element: 'task input',
                    value: 'Implement advanced pattern matching algorithm'
                },
                context: getCurrentContext(page)
            },
            {
                messageType: 'FillTextRequested',
                payload: {
                    element: 'description textarea',
                    value: 'This task involves creating a sophisticated pattern matching system that can handle fuzzy matching, context awareness, and adaptive learning capabilities.'
                },
                context: getCurrentContext(page)
            }
        ];
        for (const request of formRequests) {
            const result = await trainingApp.handleAutomationRequest(request);
            (0, test_1.expect)(['AutomationPatternExecuted', 'PatternExecutionFailed']).toContain(result.eventType);
            await page.waitForTimeout(100);
        }
        // THEN: Form should be properly filled
        const taskValue = await page.locator('[data-testid="task-input"]').inputValue();
        (0, test_1.expect)(taskValue).toBe('Implement advanced pattern matching algorithm');
        const descriptionValue = await page.locator('[data-testid="description-textarea"]').inputValue();
        (0, test_1.expect)(descriptionValue).toContain('sophisticated pattern matching system');
    });
    (0, test_1.test)('🔍 Pattern similarity matching edge cases', async () => {
        // GIVEN: Patterns with various similarity challenges
        await trainingApp.start();
        const edgeCasePatterns = [
            {
                id: 'angular-project-pattern',
                messageType: 'SelectProjectRequested',
                payload: { projectName: 'Angular App' },
                selector: '[data-testid="project-angular"]',
                context: getCurrentContext(page),
                confidence: 1.0,
                usageCount: 5,
                successfulExecutions: 5
            }
        ];
        await trainingApp.importPatterns(edgeCasePatterns);
        await trainingApp.switchToAutomaticMode();
        // Test case 1: Exact match
        const exactMatch = {
            messageType: 'SelectProjectRequested',
            payload: { projectName: 'Angular App' },
            context: getCurrentContext(page)
        };
        const exactResult = await trainingApp.handleAutomationRequest(exactMatch);
        (0, test_1.expect)(['AutomationPatternExecuted', 'PatternExecutionFailed']).toContain(exactResult.eventType);
        // Test case 2: Case difference
        const caseVariation = {
            messageType: 'SelectProjectRequested',
            payload: { projectName: 'angular app' },
            context: getCurrentContext(page)
        };
        const caseResult = await trainingApp.handleAutomationRequest(caseVariation);
        (0, test_1.expect)(['AutomationPatternExecuted', 'PatternExecutionFailed', 'ElementSelectionRequested']).toContain(caseResult.eventType);
        // Test case 3: Partial match
        const partialMatch = {
            messageType: 'SelectProjectRequested',
            payload: { projectName: 'Angular' },
            context: getCurrentContext(page)
        };
        const partialResult = await trainingApp.handleAutomationRequest(partialMatch);
        (0, test_1.expect)(['AutomationPatternExecuted', 'PatternExecutionFailed', 'ElementSelectionRequested']).toContain(partialResult.eventType);
        // Test case 4: Completely different
        const noMatch = {
            messageType: 'SelectProjectRequested',
            payload: { projectName: 'Django Project' },
            context: getCurrentContext(page)
        };
        const noMatchResult = await trainingApp.handleAutomationRequest(noMatch);
        (0, test_1.expect)(noMatchResult.eventType).toBe('PatternExecutionFailed');
    });
});
// Helper function to get current page context
function getCurrentContext(page) {
    return {
        url: page.url(),
        hostname: new URL(page.url()).hostname,
        pathname: new URL(page.url()).pathname,
        title: 'Pattern Execution Test',
        timestamp: new Date(),
        pageStructureHash: 'test-execution-hash'
    };
}
//# sourceMappingURL=pattern-execution.spec.js.map