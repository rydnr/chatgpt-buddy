/**
 * @fileoverview Web-Buddy ATDD Testing Framework
 * @description Contract-based acceptance test-driven development framework for Web-Buddy automation
 * @version 1.0.0
 */
export { ContractTestRunner, type ContractTestResult, type ContractTestError, type ContractTestContext, type ContractTestReport } from './contract-test-runner';
export { WebBuddyTestEnvironment, createTestEnvironment, quickSetup, type TestEnvironmentConfig, type SupportedBrowser } from './playwright-integration';
export { ContractDiscovery, type ContractDiscoveryResult, type ContractValidationResult, type ContractValidationError, type ContractValidationWarning } from './contract-discovery';
export { TestUtilities, createTestSuite, runContractTests, type TestSuiteConfig, type TestExecutionResult } from './test-utilities';
export type { WebBuddyContract, AutomationCapability, CapabilityType, SelectorDefinition, ParameterDefinition, WorkflowDefinition } from './types/contract-types';
/**
 * Version information
 */
export declare const VERSION = "1.0.0";
/**
 * Framework metadata
 */
export declare const FRAMEWORK_INFO: {
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
};
//# sourceMappingURL=index.d.ts.map