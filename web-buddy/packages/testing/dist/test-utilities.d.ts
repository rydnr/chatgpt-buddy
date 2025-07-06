import { WebBuddyContract } from './types/contract-types';
import { ContractTestReport } from './contract-test-runner';
import { SupportedBrowser } from './playwright-integration';
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
export declare class TestUtilities {
    /**
     * Create a comprehensive test scenario for domain automation
     */
    static createDomainTestScenario(domain: string, urls: string[], expectedCapabilities: string[]): Promise<{
        contracts: WebBuddyContract[];
        testPlan: DomainTestPlan;
        recommendations: string[];
    }>;
    /**
     * Extract all capabilities from contracts
     */
    private static extractCapabilities;
    /**
     * Generate comprehensive test plan
     */
    private static generateTestPlan;
    /**
     * Execute comprehensive cross-browser testing
     */
    static runCrossBrowserTests(contracts: WebBuddyContract[], testUrl: string, browsers?: SupportedBrowser[]): Promise<Map<SupportedBrowser, ContractTestReport[]>>;
    /**
     * Generate performance benchmarks for automation
     */
    static benchmarkPerformance(contract: WebBuddyContract, testUrl: string, iterations?: number): Promise<PerformanceBenchmark>;
    /**
     * Calculate benchmark statistics
     */
    private static calculateBenchmarkStats;
    /**
     * Create accessibility testing scenario
     */
    static createAccessibilityTests(contract: WebBuddyContract, testUrl: string): Promise<AccessibilityTestResult>;
    /**
     * Run accessibility checks on contract capabilities
     */
    private static runAccessibilityChecks;
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
export declare function createTestSuite(config: TestSuiteConfig): Promise<TestExecutionResult>;
/**
 * Run contract tests with detailed reporting
 */
export declare function runContractTests(contracts: WebBuddyContract[], testUrl: string, options?: {
    browser?: SupportedBrowser;
    headless?: boolean;
    timeout?: number;
    detailed?: boolean;
}): Promise<ContractTestReport[]>;
//# sourceMappingURL=test-utilities.d.ts.map