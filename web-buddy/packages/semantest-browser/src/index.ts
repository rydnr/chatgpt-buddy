/*
                        Semantest Browser Automation Framework

    Copyright (C) 2025-today  Semantest Team

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
 * @fileoverview Semantest Browser Automation Framework
 * @description Core infrastructure for intelligent, contract-driven web automation built on TypeScript-EDA
 * @version 2.0.0
 * @foundation TypeScript-EDA - Event-driven architecture foundation
 */

// Core Semantest exports using TypeScript-EDA foundation
export { SemanTestClient } from './client/semantest-client';

// Domain exports from TypeScript-EDA
export { 
  SemanTestContract, 
  SemanTestCapability,
  ContractDiscoveredEvent,
  ContractValidatedEvent,
  ContractExecutedEvent
} from 'typescript-eda-domain';

// Infrastructure exports from TypeScript-EDA
export { 
  WebSocketCommunicationAdapter,
  type WebSocketConfig,
  type WebSocketMessage,
  type ConnectionStatus
} from 'typescript-eda-infrastructure';

// Types and interfaces
export type {
  SemanTestClientOptions
} from './types/semantest-types';

// Utility exports
export { SemanTestUtils } from './utils/semantest-utils';
export { SemanTestError, SemanTestValidationError } from './errors/semantest-errors';

// Migration and compatibility
export { MigrationHelper } from './migration/migration-helper';
export { CompatibilityShim } from './compatibility/compatibility-shim';

// Backward compatibility exports (with deprecation warnings)
export { 
  WebBuddyClient,
  WebBuddyMessage,
  WebBuddyContract,
  type WebBuddyClientOptions,
  type WebBuddyMessageOptions
} from './compatibility/web-buddy-compat';

// Framework metadata
export const SEMANTEST_VERSION = '2.0.0';
export const FRAMEWORK_INFO = {
  name: 'Semantest Browser Automation Framework',
  version: SEMANTEST_VERSION,
  description: 'Intelligent, contract-driven web automation built on TypeScript-EDA',
  author: 'Semantest Team',
  license: 'GPL-3.0',
  repository: 'https://github.com/semantest/semantest',
  documentation: 'https://docs.semantest.com',
  foundation: {
    name: 'TypeScript-EDA',
    description: 'Event-driven architecture foundation',
    benefits: [
      'Proven event-driven patterns',
      'Reusable infrastructure adapters',
      'Domain-driven design principles',
      'Hexagonal architecture support'
    ]
  },
  migration: {
    from: '@web-buddy/core',
    guide: 'https://docs.semantest.com/migration/browser'
  }
};

console.log(`✨ ${FRAMEWORK_INFO.name} v${SEMANTEST_VERSION} loaded (Built on ${FRAMEWORK_INFO.foundation.name})`);