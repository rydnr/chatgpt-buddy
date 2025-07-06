"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractTestRunner = void 0;
/**
 * Main contract test runner that validates automation contracts against real web pages
 */
class ContractTestRunner {
    webBuddyClient;
    timeout = 30000;
    retryAttempts = 3;
    retryDelay = 1000;
    constructor(webBuddyClient, options) {
        this.webBuddyClient = webBuddyClient;
        if (options?.timeout)
            this.timeout = options.timeout;
        if (options?.retryAttempts)
            this.retryAttempts = options.retryAttempts;
        if (options?.retryDelay)
            this.retryDelay = options.retryDelay;
    }
    /**
     * Execute all capabilities in a contract against a web page
     */
    async executeContractTests(contract, context) {
        console.log(`🧪 Testing contract: ${contract.title} (${contract.domain})`);
        const results = [];
        // Navigate to the domain
        await this.navigateToContractDomain(context, contract);
        // Test each capability
        for (const [capabilityName, capability] of Object.entries(contract.capabilities)) {
            console.log(`  🔍 Testing capability: ${capabilityName}`);
            const result = await this.testCapability(contract.domain, capabilityName, capability, context);
            results.push(result);
            if (!result.success) {
                console.log(`  ❌ Capability failed: ${capabilityName}`);
                console.log(`     Error: ${result.errors[0]?.message}`);
            }
            else {
                console.log(`  ✅ Capability passed: ${capabilityName} (${result.executionTime}ms)`);
            }
        }
        return results;
    }
    /**
     * Test a specific capability against the current page
     */
    async testCapability(contractDomain, capabilityName, capability, context) {
        const startTime = Date.now();
        const result = {
            contractDomain,
            capabilityName,
            success: false,
            executionTime: 0,
            errors: [],
            warnings: [],
            metadata: {
                browserUsed: context.browser.browserType().name(),
                url: context.page.url(),
                timestamp: new Date(),
                retryAttempts: 0
            }
        };
        try {
            // Validate pre-conditions
            await this.validatePreConditions(capability, context);
            // Execute capability with retry logic
            const executionResult = await this.executeCapabilityWithRetry(capabilityName, capability, context);
            result.success = executionResult.success;
            result.metadata.retryAttempts = executionResult.attempts;
            if (!executionResult.success && executionResult.error) {
                result.errors.push({
                    type: 'execution',
                    message: executionResult.error.message,
                    details: executionResult.error,
                    capability: capabilityName
                });
            }
            // Validate post-conditions if execution was successful
            if (result.success) {
                await this.validatePostConditions(capability, context);
            }
        }
        catch (error) {
            result.errors.push({
                type: 'validation',
                message: error.message || 'Unknown error during capability testing',
                details: error,
                capability: capabilityName
            });
        }
        result.executionTime = Date.now() - startTime;
        return result;
    }
    /**
     * Navigate to the contract's domain
     */
    async navigateToContractDomain(context, contract) {
        let targetUrl = context.baseUrl;
        // Use context URL patterns if available
        if (contract.context?.urlPatterns && contract.context.urlPatterns.length > 0) {
            targetUrl = contract.context.urlPatterns[0];
        }
        console.log(`🌐 Navigating to: ${targetUrl}`);
        await context.page.goto(targetUrl, {
            waitUntil: 'networkidle',
            timeout: this.timeout
        });
        // Wait for any dynamic content to load
        await context.page.waitForTimeout(1000);
    }
    /**
     * Execute capability with retry logic
     */
    async executeCapabilityWithRetry(capabilityName, capability, context) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`    🔄 Attempt ${attempt}/${this.retryAttempts}: ${capabilityName}`);
                await this.executeCapability(capabilityName, capability, context);
                console.log(`    ✅ Success on attempt ${attempt}`);
                return { success: true, attempts: attempt };
            }
            catch (error) {
                lastError = error;
                console.log(`    ⚠️ Attempt ${attempt} failed: ${error.message}`);
                if (attempt < this.retryAttempts) {
                    await context.page.waitForTimeout(this.retryDelay);
                }
            }
        }
        return {
            success: false,
            attempts: this.retryAttempts,
            error: lastError || new Error('Unknown error')
        };
    }
    /**
     * Execute a single capability through the Web-Buddy client
     */
    async executeCapability(capabilityName, capability, context) {
        // Generate test parameters if capability has examples
        const testParameters = this.generateTestParameters(capability);
        // Create the message based on capability type
        const message = this.createCapabilityMessage(capabilityName, capability, testParameters);
        console.log(`    📤 Sending message:`, JSON.stringify(message, null, 2));
        // Execute through Web-Buddy client
        const response = await this.webBuddyClient.sendMessage(message);
        console.log(`    📥 Received response:`, JSON.stringify(response, null, 2));
        // Validate response format
        this.validateResponse(response, capability);
        return response;
    }
    /**
     * Generate test parameters for capability
     */
    generateTestParameters(capability) {
        const parameters = {};
        if (capability.parameters) {
            for (const param of capability.parameters) {
                if (capability.examples && capability.examples.length > 0) {
                    // Use example parameters if available
                    const example = capability.examples[0];
                    parameters[param.name] = example.parameters[param.name];
                }
                else {
                    // Generate test data based on parameter type
                    parameters[param.name] = this.generateTestValue(param);
                }
            }
        }
        return parameters;
    }
    /**
     * Generate test value based on parameter definition
     */
    generateTestValue(param) {
        switch (param.type) {
            case 'string':
                return param.default || `test-${param.name}`;
            case 'number':
                return param.default || 42;
            case 'boolean':
                return param.default || true;
            case 'array':
                return param.default || [];
            case 'object':
                return param.default || {};
            default:
                return param.default || `test-value`;
        }
    }
    /**
     * Create Web-Buddy message for capability
     */
    createCapabilityMessage(capabilityName, capability, parameters) {
        // Convert capability name to message format (e.g., 'search' -> 'SEARCH')
        const messageType = capabilityName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        return {
            [messageType]: parameters
        };
    }
    /**
     * Validate capability response
     */
    validateResponse(response, capability) {
        if (!response) {
            throw new Error('No response received from capability execution');
        }
        if (response.error) {
            throw new Error(`Capability execution failed: ${response.error}`);
        }
        // Additional validation based on return type
        if (capability.returnType) {
            this.validateReturnType(response, capability.returnType);
        }
    }
    /**
     * Validate return type matches expected schema
     */
    validateReturnType(response, returnType) {
        // Basic type validation
        if (returnType.type === 'void') {
            return; // No validation needed for void return
        }
        if (returnType.type === 'object' && typeof response !== 'object') {
            throw new Error(`Expected object response, got ${typeof response}`);
        }
        if (returnType.type === 'array' && !Array.isArray(response)) {
            throw new Error(`Expected array response, got ${typeof response}`);
        }
        // TODO: Implement more sophisticated schema validation
    }
    /**
     * Validate pre-conditions before executing capability
     */
    async validatePreConditions(capability, context) {
        if (!capability.conditions)
            return;
        for (const condition of capability.conditions) {
            await this.validateCondition(condition, context);
        }
    }
    /**
     * Validate post-conditions after executing capability
     */
    async validatePostConditions(capability, context) {
        // Validate that the capability selector still exists (basic sanity check)
        if (typeof capability.selector === 'string') {
            try {
                await context.page.waitForSelector(capability.selector, {
                    timeout: 5000,
                    state: 'attached'
                });
            }
            catch (error) {
                console.log(`⚠️ Warning: Capability selector not found after execution: ${capability.selector}`);
            }
        }
    }
    /**
     * Validate a specific condition
     */
    async validateCondition(condition, context) {
        switch (condition.type) {
            case 'element':
                if (condition.selector) {
                    await context.page.waitForSelector(condition.selector, {
                        timeout: this.timeout
                    });
                }
                break;
            case 'url':
                if (condition.urlPattern) {
                    const currentUrl = context.page.url();
                    const regex = new RegExp(condition.urlPattern);
                    if (!regex.test(currentUrl)) {
                        throw new Error(`URL condition failed: ${currentUrl} does not match ${condition.urlPattern}`);
                    }
                }
                break;
            case 'text':
                if (condition.text && condition.selector) {
                    const element = await context.page.waitForSelector(condition.selector);
                    const textContent = await element?.textContent();
                    if (!textContent?.includes(condition.text)) {
                        throw new Error(`Text condition failed: "${condition.text}" not found in element`);
                    }
                }
                break;
        }
    }
    /**
     * Generate comprehensive test report
     */
    generateTestReport(results) {
        const totalTests = results.length;
        const passedTests = results.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
                totalExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0)
            },
            results: results,
            recommendations: this.generateRecommendations(results),
            timestamp: new Date()
        };
        return report;
    }
    /**
     * Generate recommendations based on test results
     */
    generateRecommendations(results) {
        const recommendations = [];
        const failedResults = results.filter(r => !r.success);
        if (failedResults.length > 0) {
            recommendations.push(`${failedResults.length} capabilities failed - review contract selectors and conditions`);
        }
        const slowResults = results.filter(r => r.executionTime > 10000);
        if (slowResults.length > 0) {
            recommendations.push(`${slowResults.length} capabilities took >10s - consider optimizing selectors or timeouts`);
        }
        const highRetryResults = results.filter(r => r.metadata.retryAttempts > 1);
        if (highRetryResults.length > 0) {
            recommendations.push(`${highRetryResults.length} capabilities required retries - review stability`);
        }
        return recommendations;
    }
}
exports.ContractTestRunner = ContractTestRunner;
//# sourceMappingURL=contract-test-runner.js.map