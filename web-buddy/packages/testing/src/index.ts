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
 * @fileoverview Web-Buddy ATDD Testing Framework
 * @description Contract-based acceptance test-driven development framework for Web-Buddy automation
 * @version 1.0.0
 */

// Core testing framework
export {
  ContractTestRunner,
  type ContractTestResult,
  type ContractTestError,
  type ContractTestContext,
  type ContractTestReport
} from './contract-test-runner';

// Playwright integration
export {
  WebBuddyTestEnvironment,
  createTestEnvironment,
  quickSetup,
  type TestEnvironmentConfig,
  type SupportedBrowser
} from './playwright-integration';

// Contract discovery and validation
export {
  ContractDiscovery,
  type ContractDiscoveryResult,
  type ContractValidationResult,
  type ContractValidationError,
  type ContractValidationWarning
} from './contract-discovery';

// Test utilities and helpers
export {
  TestUtilities,
  createTestSuite,
  runContractTests,
  type TestSuiteConfig,
  type TestExecutionResult
} from './test-utilities';

// Re-export contract types for convenience
export type {
  WebBuddyContract,
  AutomationCapability,
  CapabilityType,
  SelectorDefinition,
  ParameterDefinition,
  WorkflowDefinition
} from './types/contract-types';

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Framework metadata
 */
export const FRAMEWORK_INFO = {
  name: 'Web-Buddy ATDD Framework',
  version: VERSION,
  description: 'Contract-based acceptance test-driven development for web automation',
  author: 'Web-Buddy Team',
  license: 'GPL-3.0'
};

console.log(`✅ ${FRAMEWORK_INFO.name} v${VERSION} loaded`);