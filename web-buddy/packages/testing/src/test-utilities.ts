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
 * @fileoverview Test utilities and helpers for Web-Buddy ATDD framework
 * @description Utilities for creating comprehensive test suites and automation testing workflows
 */

import { Page } from '@playwright/test';
import { WebBuddyClient } from '@web-buddy/core';
import { WebBuddyContract } from './types/contract-types';
import { ContractTestRunner, ContractTestResult, ContractTestReport } from './contract-test-runner';
import { WebBuddyTestEnvironment, createTestEnvironment, SupportedBrowser } from './playwright-integration';
import { ContractDiscovery } from './contract-discovery';

/**
 * Test suite configuration
 */
export interface TestSuiteConfig {
  name: string;
  description?: string;
  contracts: WebBuddyContract[];
  testUrls: string[];
  browser: SupportedBrowser;
  headless: boolean;
  timeout: number;
  retries: number;
  parallel: boolean;
  screenshots: boolean;
  reportPath?: string;
}

/**
 * Test execution result for entire suite
 */
export interface TestExecutionResult {
  suite: string;
  summary: {
    totalContracts: number;
    totalCapabilities: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    successRate: number;
  };
  contractResults: Map<string, ContractTestReport>;
  errors: string[];
  metadata: {
    browser: string;
    startTime: Date;
    endTime: Date;
    environment: string;
  };
}

/**
 * Comprehensive test utilities for Web-Buddy automation
 */
export class TestUtilities {
  /**
   * Create a comprehensive test scenario for domain automation
   */
  public static async createDomainTestScenario(
    domain: string,
    urls: string[],
    expectedCapabilities: string[]
  ): Promise<{
    contracts: WebBuddyContract[];
    testPlan: DomainTestPlan;
    recommendations: string[];
  }> {
    console.log(`🎯 Creating test scenario for domain: ${domain}`);

    const environment = createTestEnvironment(domain, { headless: true });
    await environment.initialize();

    try {
      const contracts: WebBuddyContract[] = [];
      const discovery = new ContractDiscovery();
      const recommendations: string[] = [];

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
      const missingCapabilities = expectedCapabilities.filter(
        cap => !foundCapabilities.includes(cap)
      );

      if (missingCapabilities.length > 0) {
        recommendations.push(
          `Missing expected capabilities: ${missingCapabilities.join(', ')}`
        );
      }

      // Create test plan
      const testPlan = this.generateTestPlan(domain, contracts, urls);

      console.log(`✅ Test scenario created with ${contracts.length} contracts`);

      return { contracts, testPlan, recommendations };

    } finally {
      await environment.cleanup();
    }
  }

  /**
   * Extract all capabilities from contracts
   */
  private static extractCapabilities(contracts: WebBuddyContract[]): string[] {
    const capabilities: string[] = [];
    
    for (const contract of contracts) {
      capabilities.push(...Object.keys(contract.capabilities));
    }
    
    return [...new Set(capabilities)]; // Remove duplicates
  }

  /**
   * Generate comprehensive test plan
   */
  private static generateTestPlan(
    domain: string,
    contracts: WebBuddyContract[],
    urls: string[]
  ): DomainTestPlan {
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
          tests: contracts.flatMap(contract =>
            Object.keys(contract.capabilities).map(capability => ({
              name: `Test ${capability}`,
              type: 'capability-execution',
              target: capability
            }))
          )
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
  public static async runCrossBrowserTests(
    contracts: WebBuddyContract[],
    testUrl: string,
    browsers: SupportedBrowser[] = ['chromium', 'firefox', 'webkit']
  ): Promise<Map<SupportedBrowser, ContractTestReport[]>> {
    console.log(`🌐 Running cross-browser tests on ${browsers.length} browsers`);

    const results = new Map<SupportedBrowser, ContractTestReport[]>();

    for (const browser of browsers) {
      console.log(`  🔍 Testing on ${browser}...`);
      
      const browserResults: ContractTestReport[] = [];
      
      for (const contract of contracts) {
        const environment = createTestEnvironment(contract.domain, {
          browser,
          headless: true,
          timeout: 30000
        });

        try {
          await environment.initialize();
          await environment.navigateTo(testUrl);

          const testRunner = new ContractTestRunner(environment.getWebBuddyClient());
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

        } catch (error: any) {
          console.error(`❌ Error testing ${contract.domain} on ${browser}:`, error.message);
        } finally {
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
  public static async benchmarkPerformance(
    contract: WebBuddyContract,
    testUrl: string,
    iterations: number = 5
  ): Promise<PerformanceBenchmark> {
    console.log(`⚡ Benchmarking performance for ${contract.domain} (${iterations} iterations)`);

    const results: number[] = [];
    const capabilityTimes: Map<string, number[]> = new Map();

    for (let i = 0; i < iterations; i++) {
      const environment = createTestEnvironment(contract.domain, {
        headless: true,
        timeout: 60000
      });

      try {
        const startTime = Date.now();
        
        await environment.initialize();
        await environment.navigateTo(testUrl);

        const testRunner = new ContractTestRunner(environment.getWebBuddyClient());
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
          capabilityTimes.get(result.capabilityName)!.push(result.executionTime);
        }

      } finally {
        await environment.cleanup();
      }
    }

    return this.calculateBenchmarkStats(results, capabilityTimes);
  }

  /**
   * Calculate benchmark statistics
   */
  private static calculateBenchmarkStats(
    results: number[],
    capabilityTimes: Map<string, number[]>
  ): PerformanceBenchmark {
    const calculateStats = (times: number[]) => ({
      min: Math.min(...times),
      max: Math.max(...times),
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)]
    });

    const overall = calculateStats(results);
    const capabilities: Record<string, any> = {};

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
  public static async createAccessibilityTests(
    contract: WebBuddyContract,
    testUrl: string
  ): Promise<AccessibilityTestResult> {
    console.log(`♿ Creating accessibility tests for ${contract.domain}`);

    const environment = createTestEnvironment(contract.domain, {
      headless: true,
      timeout: 30000
    });

    try {
      await environment.initialize();
      await environment.navigateTo(testUrl);

      const accessibilityReport = await this.runAccessibilityChecks(
        environment.getPage(),
        contract
      );

      return accessibilityReport;

    } finally {
      await environment.cleanup();
    }
  }

  /**
   * Run accessibility checks on contract capabilities
   */
  private static async runAccessibilityChecks(
    page: Page,
    contract: WebBuddyContract
  ): Promise<AccessibilityTestResult> {
    const issues: AccessibilityIssue[] = [];
    const recommendations: string[] = [];

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
      } catch (error) {
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

/**
 * Domain test plan structure
 */
export interface DomainTestPlan {
  domain: string;
  phases: TestPhase[];
}

/**
 * Test phase definition
 */
export interface TestPhase {
  name: string;
  description: string;
  tests: TestCase[];
}

/**
 * Individual test case
 */
export interface TestCase {
  name: string;
  type: 'contract-validation' | 'capability-execution' | 'cross-url-test' | 'error-simulation';
  target: string;
}

/**
 * Performance benchmark result
 */
export interface PerformanceBenchmark {
  overall: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
  capabilities: Record<string, {
    min: number;
    max: number;
    avg: number;
    median: number;
  }>;
  iterations: number;
  timestamp: Date;
}

/**
 * Accessibility test result
 */
export interface AccessibilityTestResult {
  contract: string;
  issues: AccessibilityIssue[];
  recommendations: string[];
  score: number;
  timestamp: Date;
}

/**
 * Accessibility issue
 */
export interface AccessibilityIssue {
  capability: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  selector: string;
}

/**
 * Create a comprehensive test suite
 */
export async function createTestSuite(config: TestSuiteConfig): Promise<TestExecutionResult> {
  console.log(`🧪 Creating test suite: ${config.name}`);
  
  const startTime = Date.now();
  const contractResults = new Map<string, ContractTestReport>();
  const errors: string[] = [];
  
  let totalCapabilities = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  // Execute tests for each contract
  for (const contract of config.contracts) {
    try {
      totalCapabilities += Object.keys(contract.capabilities).length;
      
      for (const testUrl of config.testUrls) {
        const environment = createTestEnvironment(contract.domain, {
          browser: config.browser,
          headless: config.headless,
          timeout: config.timeout
        });

        try {
          await environment.initialize();
          await environment.navigateTo(testUrl);

          const testRunner = new ContractTestRunner(environment.getWebBuddyClient(), {
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

        } finally {
          await environment.cleanup();
        }
      }
    } catch (error: any) {
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
export async function runContractTests(
  contracts: WebBuddyContract[],
  testUrl: string,
  options?: {
    browser?: SupportedBrowser;
    headless?: boolean;
    timeout?: number;
    detailed?: boolean;
  }
): Promise<ContractTestReport[]> {
  const reports: ContractTestReport[] = [];
  
  for (const contract of contracts) {
    const environment = createTestEnvironment(contract.domain, {
      browser: options?.browser || 'chromium',
      headless: options?.headless ?? true,
      timeout: options?.timeout || 30000
    });

    try {
      await environment.initialize();
      await environment.navigateTo(testUrl);

      const testRunner = new ContractTestRunner(environment.getWebBuddyClient());
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

    } finally {
      await environment.cleanup();
    }
  }

  return reports;
}