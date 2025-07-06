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
 * @fileoverview Backward compatibility layer for Web-Buddy migration
 * @description Provides seamless migration path from @web-buddy/core to @semantest/browser
 * @deprecated Use SemanTestClient and related classes from @semantest/browser instead
 */

import { SemanTestClient } from '../client/semantest-client';
import { SemanTestMessage } from '../messages/semantest-message';
import { SemanTestContract } from '../contracts/semantest-contract';
import { 
  SemanTestClientOptions,
  SemanTestMessageOptions,
  SemanTestContractOptions 
} from '../types/semantest-types';

/**
 * Backward compatibility type aliases
 */
export type WebBuddyClientOptions = SemanTestClientOptions & {
  /** @deprecated Use serverUrl instead */
  webBuddyServerUrl?: string;
  /** @deprecated Use timeout instead */
  webBuddyTimeout?: number;
  /** @deprecated Use enableContractValidation instead */
  enableContractValidation?: boolean;
};

export type WebBuddyMessageOptions = SemanTestMessageOptions;
export type WebBuddyContractOptions = SemanTestContractOptions;

/**
 * @deprecated Use SemanTestMessage from @semantest/browser instead
 * Backward compatible Web-Buddy message type
 */
export type WebBuddyMessage = SemanTestMessage;

/**
 * @deprecated Use SemanTestContract from @semantest/browser instead
 * Backward compatible Web-Buddy contract type
 */
export type WebBuddyContract = SemanTestContract;

/**
 * @deprecated Use SemanTestClient from @semantest/browser instead
 * Backward compatible Web-Buddy client with deprecation warnings
 */
export class WebBuddyClient extends SemanTestClient {
  private static hasShownDeprecationWarning = false;

  constructor(options: WebBuddyClientOptions) {
    // Show deprecation warning once per application
    if (!WebBuddyClient.hasShownDeprecationWarning && !process.env.SEMANTEST_SUPPRESS_WARNINGS) {
      WebBuddyClient.showDeprecationWarning();
      WebBuddyClient.hasShownDeprecationWarning = true;
    }

    // Translate legacy options to new format
    const semantestOptions = WebBuddyClient.translateLegacyOptions(options);
    super(semantestOptions);
  }

  /**
   * Translate legacy Web-Buddy configuration to Semantest format
   */
  private static translateLegacyOptions(legacyOptions: WebBuddyClientOptions): SemanTestClientOptions {
    const translated: SemanTestClientOptions = {
      // Core settings migration
      serverUrl: legacyOptions.webBuddyServerUrl || legacyOptions.serverUrl,
      timeout: legacyOptions.webBuddyTimeout || legacyOptions.timeout || 30000,
      retries: legacyOptions.retries || 3,
      debug: legacyOptions.debug || false,
      
      // Headers and identification
      headers: legacyOptions.headers || {},
      clientId: legacyOptions.clientId || 'web-buddy-compat-client',
      userAgent: legacyOptions.userAgent || 'Web-Buddy Compatibility Client (via Semantest/2.0)',
      
      // Feature flags
      enableContractValidation: legacyOptions.enableContractValidation ?? true,
      enablePerformanceMonitoring: legacyOptions.enablePerformanceMonitoring ?? false,
      enableAILearning: legacyOptions.enableAILearning ?? false
    };

    // Validate required fields
    if (!translated.serverUrl) {
      throw new Error('Server URL is required (use serverUrl or webBuddyServerUrl)');
    }

    return translated;
  }

  /**
   * Legacy method aliases for backward compatibility
   */

  /**
   * @deprecated Use sendMessage instead
   */
  async send(messageOptions: WebBuddyMessageOptions): Promise<any> {
    this.warnLegacyMethod('send', 'sendMessage');
    return this.sendMessage(messageOptions);
  }

  /**
   * @deprecated Use executeContract instead
   */
  async execute(contractId: string, parameters?: Record<string, any>): Promise<any> {
    this.warnLegacyMethod('execute', 'executeContract');
    return this.executeContract(contractId, parameters);
  }

  /**
   * @deprecated Use getServerInfo instead
   */
  async getInfo(): Promise<any> {
    this.warnLegacyMethod('getInfo', 'getServerInfo');
    return this.getServerInfo();
  }

  /**
   * @deprecated Use getConnectionStatus instead
   */
  getStatus(): any {
    this.warnLegacyMethod('getStatus', 'getConnectionStatus');
    return this.getConnectionStatus();
  }

  /**
   * Show comprehensive deprecation warning
   */
  private static showDeprecationWarning(): void {
    console.warn(`
╔════════════════════════════════════════════════════════════════════════════════╗
║                            🚨 DEPRECATION WARNING 🚨                            ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  WebBuddyClient is deprecated and will be removed in v3.0!                    ║
║                                                                                ║
║  🔄 MIGRATION REQUIRED:                                                        ║
║                                                                                ║
║  Replace:                                                                      ║
║    import { WebBuddyClient } from '@web-buddy/core'                           ║
║                                                                                ║
║  With:                                                                         ║
║    import { SemanTestClient } from '@semantest/browser'                       ║
║                                                                                ║
║  Configuration Changes:                                                        ║
║    • webBuddyServerUrl → serverUrl                                            ║
║    • webBuddyTimeout → timeout                                                ║
║    • All other options remain the same                                        ║
║                                                                                ║
║  📚 Full Migration Guide:                                                     ║
║    https://docs.semantest.com/migration/browser                               ║
║                                                                                ║
║  🆘 Need Help?                                                                ║
║    • GitHub Discussions: https://github.com/semantest/semantest/discussions  ║
║    • Discord: https://discord.gg/semantest                                    ║
║    • Migration Tool: npm install -g @semantest/migration-tools               ║
║                                                                                ║
║  ⏰ Timeline:                                                                 ║
║    • Compatibility maintained until December 2025                            ║
║    • Deprecation warnings until June 2025                                    ║
║    • Full removal in Semantest v3.0 (2026)                                   ║
║                                                                                ║
║  🔇 Suppress this warning:                                                    ║
║    export SEMANTEST_SUPPRESS_WARNINGS=true                                    ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Show method-specific deprecation warning
   */
  private warnLegacyMethod(oldMethod: string, newMethod: string): void {
    if (!process.env.SEMANTEST_SUPPRESS_WARNINGS) {
      console.warn(`
⚠️  ${oldMethod}() is deprecated! Use ${newMethod}() instead.
   Migration: Replace webBuddyClient.${oldMethod}() with semantestClient.${newMethod}()
   Guide: https://docs.semantest.com/migration/methods#${oldMethod.toLowerCase()}
      `);
    }
  }
}

/**
 * Legacy constants for backward compatibility
 */

/** @deprecated Use SEMANTEST_VERSION instead */
export const WEB_BUDDY_VERSION = '2.0.0-semantest-compat';

/** @deprecated Use SemanTestClient.getConfiguration() instead */
export const WEB_BUDDY_DEFAULT_CONFIG = {
  timeout: 30000,
  retries: 3,
  debug: false
};

/** @deprecated Use semantest message types instead */
export const WEB_BUDDY_MESSAGE_TYPES = {
  PING: 'PING',
  PONG: 'PONG',
  EXECUTE: 'EXECUTE_CONTRACT',
  DISCOVER: 'DISCOVER_CAPABILITIES',
  VALIDATE: 'VALIDATE_CONTRACT'
};

/**
 * Legacy utility functions
 */

/** @deprecated Use SemanTestUtils.generateCorrelationId() instead */
export function generateCorrelationId(): string {
  if (!process.env.SEMANTEST_SUPPRESS_WARNINGS) {
    console.warn('generateCorrelationId() is deprecated. Use SemanTestUtils.generateCorrelationId() instead.');
  }
  return require('uuid').v4();
}

/** @deprecated Use SemanTestUtils.validateMessage() instead */
export function validateMessage(message: any): boolean {
  if (!process.env.SEMANTEST_SUPPRESS_WARNINGS) {
    console.warn('validateMessage() is deprecated. Use SemanTestUtils.validateMessage() instead.');
  }
  return !!(message && message.type && message.payload);
}

/**
 * Migration helper functions
 */

/**
 * Check if current usage is compatible with Semantest
 */
export function checkCompatibility(): {
  compatible: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for deprecated environment variables
  if (process.env.WEB_BUDDY_SERVER_URL) {
    issues.push('WEB_BUDDY_SERVER_URL environment variable is deprecated');
    recommendations.push('Use SEMANTEST_SERVER_URL instead');
  }

  // Check for deprecated global objects
  if (typeof window !== 'undefined' && (window as any).webBuddy) {
    issues.push('Global webBuddy object is deprecated');
    recommendations.push('Use semantest global object instead');
  }

  return {
    compatible: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Generate migration script for current usage
 */
export function generateMigrationScript(): string {
  return `
// Automated migration script generated by Semantest compatibility layer
// Run this script to update your Web-Buddy usage to Semantest

// 1. Update imports
// Replace: import { WebBuddyClient } from '@web-buddy/core'
// With:    import { SemanTestClient } from '@semantest/browser'

// 2. Update client instantiation
// Replace: const client = new WebBuddyClient({ webBuddyServerUrl: 'ws://localhost:3001' })
// With:    const client = new SemanTestClient({ serverUrl: 'ws://localhost:3001' })

// 3. Update method calls (if using deprecated methods)
// Replace: client.send() → client.sendMessage()
// Replace: client.execute() → client.executeContract()
// Replace: client.getInfo() → client.getServerInfo()
// Replace: client.getStatus() → client.getConnectionStatus()

// For automated migration, run:
// npx @semantest/migration-tools migrate --from web-buddy --to semantest
  `;
}

// Show compatibility check on import (only once)
let compatibilityChecked = false;
if (!compatibilityChecked && !process.env.SEMANTEST_SUPPRESS_WARNINGS) {
  const compatibility = checkCompatibility();
  if (!compatibility.compatible) {
    console.warn('🔍 Compatibility issues detected:', compatibility.issues);
    console.warn('💡 Recommendations:', compatibility.recommendations);
  }
  compatibilityChecked = true;
}