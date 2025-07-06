/**
 * @fileoverview Contract-based test runner for Web-Buddy ATDD framework
 * @description Executes tests against automation contracts, ensuring robust contract compliance
 */
import { Page, Browser } from '@playwright/test';
import { WebBuddyClient } from '@web-buddy/core';
import { WebBuddyContract, AutomationCapability } from './types/contract-types';
/**
 * Contract-based test execution results
 */
export interface ContractTestResult {
    contractDomain: string;
    capabilityName: string;
    success: boolean;
    executionTime: number;
    errors: ContractTestError[];
    warnings: string[];
    metadata: {
        browserUsed: string;
        url: string;
        timestamp: Date;
        retryAttempts: number;
    };
}
/**
 * Contract test error details
 */
export interface ContractTestError {
    type: 'validation' | 'execution' | 'timeout' | 'element-not-found';
    message: string;
    details: any;
    capability?: string;
    step?: string;
}
/**
 * Contract test execution context
 */
export interface ContractTestContext {
    browser: Browser;
    page: Page;
    webBuddyClient: WebBuddyClient;
    contract: WebBuddyContract;
    baseUrl: string;
    timeout: number;
}
/**
 * Main contract test runner that validates automation contracts against real web pages
 */
export declare class ContractTestRunner {
    protected webBuddyClient: WebBuddyClient;
    protected timeout: number;
    protected retryAttempts: number;
    protected retryDelay: number;
    constructor(webBuddyClient: WebBuddyClient, options?: {
        timeout?: number;
        retryAttempts?: number;
        retryDelay?: number;
    });
    /**
     * Execute all capabilities in a contract against a web page
     */
    executeContractTests(contract: WebBuddyContract, context: ContractTestContext): Promise<ContractTestResult[]>;
    /**
     * Test a specific capability against the current page
     */
    testCapability(contractDomain: string, capabilityName: string, capability: AutomationCapability, context: ContractTestContext): Promise<ContractTestResult>;
    /**
     * Navigate to the contract's domain
     */
    protected navigateToContractDomain(context: ContractTestContext, contract: WebBuddyContract): Promise<void>;
    /**
     * Execute capability with retry logic
     */
    protected executeCapabilityWithRetry(capabilityName: string, capability: AutomationCapability, context: ContractTestContext): Promise<{
        success: boolean;
        attempts: number;
        error?: Error;
    }>;
    /**
     * Execute a single capability through the Web-Buddy client
     */
    protected executeCapability(capabilityName: string, capability: AutomationCapability, context: ContractTestContext): Promise<any>;
    /**
     * Generate test parameters for capability
     */
    protected generateTestParameters(capability: AutomationCapability): Record<string, any>;
    /**
     * Generate test value based on parameter definition
     */
    protected generateTestValue(param: any): any;
    /**
     * Create Web-Buddy message for capability
     */
    protected createCapabilityMessage(capabilityName: string, capability: AutomationCapability, parameters: Record<string, any>): Record<string, any>;
    /**
     * Validate capability response
     */
    protected validateResponse(response: any, capability: AutomationCapability): void;
    /**
     * Validate return type matches expected schema
     */
    protected validateReturnType(response: any, returnType: any): void;
    /**
     * Validate pre-conditions before executing capability
     */
    protected validatePreConditions(capability: AutomationCapability, context: ContractTestContext): Promise<void>;
    /**
     * Validate post-conditions after executing capability
     */
    protected validatePostConditions(capability: AutomationCapability, context: ContractTestContext): Promise<void>;
    /**
     * Validate a specific condition
     */
    protected validateCondition(condition: any, context: ContractTestContext): Promise<void>;
    /**
     * Generate comprehensive test report
     */
    generateTestReport(results: ContractTestResult[]): ContractTestReport;
    /**
     * Generate recommendations based on test results
     */
    protected generateRecommendations(results: ContractTestResult[]): string[];
}
/**
 * Test report structure
 */
export interface ContractTestReport {
    summary: {
        total: number;
        passed: number;
        failed: number;
        successRate: number;
        totalExecutionTime: number;
    };
    results: ContractTestResult[];
    recommendations: string[];
    timestamp: Date;
}
//# sourceMappingURL=contract-test-runner.d.ts.map