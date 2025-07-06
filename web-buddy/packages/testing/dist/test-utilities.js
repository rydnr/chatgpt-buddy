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
exports.TestUtilities = void 0;
exports.createTestSuite = createTestSuite;
exports.runContractTests = runContractTests;
const contract_test_runner_1 = require("./contract-test-runner");
const playwright_integration_1 = require("./playwright-integration");
const contract_discovery_1 = require("./contract-discovery");
/**
 * Comprehensive test utilities for Web-Buddy automation
 */
class TestUtilities {
    /**
     * Create a comprehensive test scenario for domain automation
     */
    static async createDomainTestScenario(domain, urls, expectedCapabilities) {
        console.log(`🎯 Creating test scenario for domain: ${domain}`);
        const environment = (0, playwright_integration_1.createTestEnvironment)(domain, { headless: true });
        await environment.initialize();
        try {
            const contracts = [];
            const discovery = new contract_discovery_1.ContractDiscovery();
            const recommendations = [];
            // Discover contracts from each URL
            for (const url of urls) {
                await environment.navigateTo(url);
                const discoveryResult = await discovery.discoverFromPage(environment.getPage());
                contracts.push(...discoveryResult.contracts);
                if (discoveryResult.warnings.length > 0) {
                    recommendations.push(`${url}: ${discoveryResult.warnings.join(', ')}`);
                }
            }
            // Analyze coverage
            const foundCapabilities = this.extractCapabilities(contracts);
            const missingCapabilities = expectedCapabilities.filter(cap => !foundCapabilities.includes(cap));
            if (missingCapabilities.length > 0) {
                recommendations.push(`Missing expected capabilities: ${missingCapabilities.join(', ')}`);
            }
            // Create test plan
            const testPlan = this.generateTestPlan(domain, contracts, urls);
            console.log(`✅ Test scenario created with ${contracts.length} contracts`);
            return { contracts, testPlan, recommendations };
        }
        finally {
            await environment.cleanup();
        }
    }
    /**
     * Extract all capabilities from contracts
     */
    static extractCapabilities(contracts) {
        const capabilities = [];
        for (const contract of contracts) {
            capabilities.push(...Object.keys(contract.capabilities));
        }
        return [...new Set(capabilities)]; // Remove duplicates
    }
    /**
     * Generate comprehensive test plan
     */
    static generateTestPlan(domain, contracts, urls) {
        return {
            domain,
            phases: [
                {
                    name: 'Discovery Validation',
                    description: 'Validate contract discovery and structure',
                    tests: contracts.map(contract => ({
                        name: `Validate ${contract.title}`,
                        type: 'contract-validation',
                        target: contract.domain
                    }))
                },
                {
                    name: 'Capability Testing',
                    description: 'Test all automation capabilities',
                    tests: contracts.flatMap(contract => Object.keys(contract.capabilities).map(capability => ({
                        name: `Test ${capability}`,
                        type: 'capability-execution',
                        target: capability
                    })))
                },
                {
                    name: 'Cross-URL Validation',
                    description: 'Validate capabilities work across different URLs',
                    tests: urls.map(url => ({
                        name: `Cross-validation on ${url}`,
                        type: 'cross-url-test',
                        target: url
                    }))
                },
                {
                    name: 'Error Recovery',
                    description: 'Test error handling and recovery',
                    tests: [
                        {
                            name: 'Network failure recovery',
                            type: 'error-simulation',
                            target: 'network'
                        },
                        {
                            name: 'Element not found recovery',
                            type: 'error-simulation',
                            target: 'missing-element'
                        }
                    ]
                }
            ]
        };
    }
    /**
     * Execute comprehensive cross-browser testing
     */
    static async runCrossBrowserTests(contracts, testUrl, browsers = ['chromium', 'firefox', 'webkit']) {
        console.log(`🌐 Running cross-browser tests on ${browsers.length} browsers`);
        const results = new Map();
        for (const browser of browsers) {
            console.log(`  🔍 Testing on ${browser}...`);
            const browserResults = [];
            for (const contract of contracts) {
                const environment = (0, playwright_integration_1.createTestEnvironment)(contract.domain, {
                    browser,
                    headless: true,
                    timeout: 30000
                });
                try {
                    await environment.initialize();
                    await environment.navigateTo(testUrl);
                    const testRunner = new contract_test_runner_1.ContractTestRunner(environment.getWebBuddyClient());
                    const testContext = {
                        browser: environment.getBrowser(),
                        page: environment.getPage(),
                        webBuddyClient: environment.getWebBuddyClient(),
                        contract,
                        baseUrl: testUrl,
                        timeout: 30000
                    };
                    const testResults = await testRunner.executeContractTests(contract, testContext);
                    const report = testRunner.generateTestReport(testResults);
                    browserResults.push(report);
                }
                catch (error) {
                    console.error(`❌ Error testing ${contract.domain} on ${browser}:`, error.message);
                }
                finally {
                    await environment.cleanup();
                }
            }
            results.set(browser, browserResults);
            console.log(`  ✅ ${browser} testing complete`);
        }
        return results;
    }
    /**
     * Generate performance benchmarks for automation
     */
    static async benchmarkPerformance(contract, testUrl, iterations = 5) {
        console.log(`⚡ Benchmarking performance for ${contract.domain} (${iterations} iterations)`);
        const results = [];
        const capabilityTimes = new Map();
        for (let i = 0; i < iterations; i++) {
            const environment = (0, playwright_integration_1.createTestEnvironment)(contract.domain, {
                headless: true,
                timeout: 60000
            });
            try {
                const startTime = Date.now();
                await environment.initialize();
                await environment.navigateTo(testUrl);
                const testRunner = new contract_test_runner_1.ContractTestRunner(environment.getWebBuddyClient());
                const testContext = {
                    browser: environment.getBrowser(),
                    page: environment.getPage(),
                    webBuddyClient: environment.getWebBuddyClient(),
                    contract,
                    baseUrl: testUrl,
                    timeout: 60000
                };
                const testResults = await testRunner.executeContractTests(contract, testContext);
                const totalTime = Date.now() - startTime;
                results.push(totalTime);
                // Track individual capability times
                for (const result of testResults) {
                    if (!capabilityTimes.has(result.capabilityName)) {
                        capabilityTimes.set(result.capabilityName, []);
                    }
                    capabilityTimes.get(result.capabilityName).push(result.executionTime);
                }
            }
            finally {
                await environment.cleanup();
            }
        }
        return this.calculateBenchmarkStats(results, capabilityTimes);
    }
    /**
     * Calculate benchmark statistics
     */
    static calculateBenchmarkStats(results, capabilityTimes) {
        const calculateStats = (times) => ({
            min: Math.min(...times),
            max: Math.max(...times),
            avg: times.reduce((a, b) => a + b, 0) / times.length,
            median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)]
        });
        const overall = calculateStats(results);
        const capabilities = {};
        for (const [capability, times] of capabilityTimes) {
            capabilities[capability] = calculateStats(times);
        }
        return {
            overall,
            capabilities,
            iterations: results.length,
            timestamp: new Date()
        };
    }
    /**
     * Create accessibility testing scenario
     */
    static async createAccessibilityTests(contract, testUrl) {
        console.log(`♿ Creating accessibility tests for ${contract.domain}`);
        const environment = (0, playwright_integration_1.createTestEnvironment)(contract.domain, {
            headless: true,
            timeout: 30000
        });
        try {
            await environment.initialize();
            await environment.navigateTo(testUrl);
            const accessibilityReport = await this.runAccessibilityChecks(environment.getPage(), contract);
            return accessibilityReport;
        }
        finally {
            await environment.cleanup();
        }
    }
    /**
     * Run accessibility checks on contract capabilities
     */
    static async runAccessibilityChecks(page, contract) {
        const issues = [];
        const recommendations = [];
        for (const [capabilityName, capability] of Object.entries(contract.capabilities)) {
            try {
                const selector = typeof capability.selector === 'string' ? capability.selector : capability.selector.primary;
                const element = await page.$(selector);
                if (element) {
                    // Check for ARIA labels
                    const ariaLabel = await element.getAttribute('aria-label');
                    const ariaLabelledBy = await element.getAttribute('aria-labelledby');
                    if (!ariaLabel && !ariaLabelledBy) {
                        issues.push({
                            capability: capabilityName,
                            type: 'missing-aria-label',
                            severity: 'medium',
                            message: 'Element lacks accessible name (aria-label or aria-labelledby)',
                            selector: selector
                        });
                    }
                    // Check keyboard accessibility
                    const tabIndex = await element.getAttribute('tabindex');
                    const isInteractive = await element.evaluate(el => {
                        const tag = el.tagName.toLowerCase();
                        return ['button', 'input', 'select', 'textarea', 'a'].includes(tag);
                    });
                    if (isInteractive && tabIndex === '-1') {
                        issues.push({
                            capability: capabilityName,
                            type: 'keyboard-inaccessible',
                            severity: 'high',
                            message: 'Interactive element is not keyboard accessible',
                            selector: selector
                        });
                    }
                }
            }
            catch (error) {
                // Element not found - this should be caught by contract validation
            }
        }
        // Generate recommendations
        if (issues.length > 0) {
            recommendations.push('Add proper ARIA labels to interactive elements');
            recommendations.push('Ensure all interactive elements are keyboard accessible');
            recommendations.push('Consider implementing focus management for dynamic content');
        }
        return {
            contract: contract.domain,
            issues,
            recommendations,
            score: Math.max(0, 100 - (issues.length * 10)),
            timestamp: new Date()
        };
    }
}
exports.TestUtilities = TestUtilities;
/**
 * Create a comprehensive test suite
 */
async function createTestSuite(config) {
    console.log(`🧪 Creating test suite: ${config.name}`);
    const startTime = Date.now();
    const contractResults = new Map();
    const errors = [];
    let totalCapabilities = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    // Execute tests for each contract
    for (const contract of config.contracts) {
        try {
            totalCapabilities += Object.keys(contract.capabilities).length;
            for (const testUrl of config.testUrls) {
                const environment = (0, playwright_integration_1.createTestEnvironment)(contract.domain, {
                    browser: config.browser,
                    headless: config.headless,
                    timeout: config.timeout
                });
                try {
                    await environment.initialize();
                    await environment.navigateTo(testUrl);
                    const testRunner = new contract_test_runner_1.ContractTestRunner(environment.getWebBuddyClient(), {
                        timeout: config.timeout,
                        retryAttempts: config.retries
                    });
                    const testContext = {
                        browser: environment.getBrowser(),
                        page: environment.getPage(),
                        webBuddyClient: environment.getWebBuddyClient(),
                        contract,
                        baseUrl: testUrl,
                        timeout: config.timeout
                    };
                    const results = await testRunner.executeContractTests(contract, testContext);
                    const report = testRunner.generateTestReport(results);
                    contractResults.set(`${contract.domain}-${testUrl}`, report);
                    totalPassed += report.summary.passed;
                    totalFailed += report.summary.failed;
                }
                finally {
                    await environment.cleanup();
                }
            }
        }
        catch (error) {
            errors.push(`Contract ${contract.domain}: ${error.message}`);
        }
    }
    const endTime = Date.now();
    const duration = endTime - startTime;
    return {
        suite: config.name,
        summary: {
            totalContracts: config.contracts.length,
            totalCapabilities,
            passed: totalPassed,
            failed: totalFailed,
            skipped: 0,
            duration,
            successRate: totalCapabilities > 0 ? (totalPassed / totalCapabilities) * 100 : 0
        },
        contractResults,
        errors,
        metadata: {
            browser: config.browser,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            environment: process.env.NODE_ENV || 'test'
        }
    };
}
/**
 * Run contract tests with detailed reporting
 */
async function runContractTests(contracts, testUrl, options) {
    const reports = [];
    for (const contract of contracts) {
        const environment = (0, playwright_integration_1.createTestEnvironment)(contract.domain, {
            browser: options?.browser || 'chromium',
            headless: options?.headless ?? true,
            timeout: options?.timeout || 30000
        });
        try {
            await environment.initialize();
            await environment.navigateTo(testUrl);
            const testRunner = new contract_test_runner_1.ContractTestRunner(environment.getWebBuddyClient());
            const testContext = {
                browser: environment.getBrowser(),
                page: environment.getPage(),
                webBuddyClient: environment.getWebBuddyClient(),
                contract,
                baseUrl: testUrl,
                timeout: options?.timeout || 30000
            };
            const results = await testRunner.executeContractTests(contract, testContext);
            const report = testRunner.generateTestReport(results);
            reports.push(report);
        }
        finally {
            await environment.cleanup();
        }
    }
    return reports;
}
//# sourceMappingURL=test-utilities.js.map