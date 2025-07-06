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
exports.FRAMEWORK_INFO = exports.VERSION = exports.runContractTests = exports.createTestSuite = exports.TestUtilities = exports.ContractDiscovery = exports.quickSetup = exports.createTestEnvironment = exports.WebBuddyTestEnvironment = exports.ContractTestRunner = void 0;
/**
 * @fileoverview Web-Buddy ATDD Testing Framework
 * @description Contract-based acceptance test-driven development framework for Web-Buddy automation
 * @version 1.0.0
 */
// Core testing framework
var contract_test_runner_1 = require("./contract-test-runner");
Object.defineProperty(exports, "ContractTestRunner", { enumerable: true, get: function () { return contract_test_runner_1.ContractTestRunner; } });
// Playwright integration
var playwright_integration_1 = require("./playwright-integration");
Object.defineProperty(exports, "WebBuddyTestEnvironment", { enumerable: true, get: function () { return playwright_integration_1.WebBuddyTestEnvironment; } });
Object.defineProperty(exports, "createTestEnvironment", { enumerable: true, get: function () { return playwright_integration_1.createTestEnvironment; } });
Object.defineProperty(exports, "quickSetup", { enumerable: true, get: function () { return playwright_integration_1.quickSetup; } });
// Contract discovery and validation
var contract_discovery_1 = require("./contract-discovery");
Object.defineProperty(exports, "ContractDiscovery", { enumerable: true, get: function () { return contract_discovery_1.ContractDiscovery; } });
// Test utilities and helpers
var test_utilities_1 = require("./test-utilities");
Object.defineProperty(exports, "TestUtilities", { enumerable: true, get: function () { return test_utilities_1.TestUtilities; } });
Object.defineProperty(exports, "createTestSuite", { enumerable: true, get: function () { return test_utilities_1.createTestSuite; } });
Object.defineProperty(exports, "runContractTests", { enumerable: true, get: function () { return test_utilities_1.runContractTests; } });
/**
 * Version information
 */
exports.VERSION = '1.0.0';
/**
 * Framework metadata
 */
exports.FRAMEWORK_INFO = {
    name: 'Web-Buddy ATDD Framework',
    version: exports.VERSION,
    description: 'Contract-based acceptance test-driven development for web automation',
    author: 'Web-Buddy Team',
    license: 'GPL-3.0'
};
console.log(`✅ ${exports.FRAMEWORK_INFO.name} v${exports.VERSION} loaded`);
//# sourceMappingURL=index.js.map