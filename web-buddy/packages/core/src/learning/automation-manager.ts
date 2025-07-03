/*
                        Web-Buddy Core - Automation Learning Manager

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

import { v4 as uuidv4 } from 'uuid';
import { AutomationStorage, StoredAutomation, AutomationSearchCriteria, createAutomationStorage } from '../storage/automation-storage';
import { AutomationRequestedEvent, AutomationImplementedEvent } from '../events/automation';
import { WebBuddyEvent } from '../events/base';

/**
 * User preference for automation reuse
 */
export interface ReusePreference {
  action: 'reuse' | 'record-new' | 'skip';
  doNotAskFor?: {
    type: 'times' | 'duration';
    value: number; // number of times or minutes
  };
}

/**
 * Result of automation execution
 */
export interface AutomationExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  automationId: string;
}

/**
 * Manages the learning workflow and automation storage
 * Coordinates between events, storage, and user preferences
 */
export class AutomationManager {
  private storage: AutomationStorage;
  private userPreferences = new Map<string, { until: Date; preference: ReusePreference }>();

  constructor(storage?: AutomationStorage) {
    this.storage = storage || createAutomationStorage();
  }

  /**
   * Handle an automation request - core learning workflow
   * Returns the appropriate action: reuse existing, record new, or request guidance
   */
  async handleAutomationRequest(event: AutomationRequestedEvent): Promise<{
    action: 'execute' | 'reuse-prompt' | 'record-new';
    automation?: StoredAutomation;
    message?: string;
  }> {
    const criteria = this.createSearchCriteria(event);
    
    // Check user preferences first
    const preferenceKey = this.getPreferenceKey(event);
    const userPref = this.getUserPreference(preferenceKey);
    
    if (userPref) {
      switch (userPref.preference.action) {
        case 'skip':
          return { action: 'record-new', message: 'User preference: skip automation' };
        case 'record-new':
          return { action: 'record-new', message: 'User preference: always record new' };
        case 'reuse':
          // Still need to find an automation to reuse
          break;
      }
    }

    // Find matching automations
    const matches = await this.storage.findMatching(criteria);
    
    if (matches.length === 0) {
      return { 
        action: 'record-new', 
        message: 'No existing automation found for this action' 
      };
    }

    // If user has preference to reuse, execute immediately
    if (userPref?.preference.action === 'reuse') {
      return {
        action: 'execute',
        automation: matches[0],
        message: 'Executing stored automation based on user preference'
      };
    }

    // Show reuse prompt to user
    return {
      action: 'reuse-prompt',
      automation: matches[0],
      message: `Found ${matches.length} matching automation(s)`
    };
  }

  /**
   * Save a new automation implementation
   */
  async saveAutomation(event: AutomationImplementedEvent): Promise<StoredAutomation> {
    const automation: StoredAutomation = {
      id: uuidv4(),
      eventType: 'automationRequested', // The event type that triggers this automation
      action: event.payload.action,
      website: this.extractWebsite(event),
      parameters: this.extractParameters(event.payload.templatedScript),
      playwrightScript: event.payload.playwrightScript,
      templatedScript: event.payload.templatedScript,
      metadata: {
        recordedAt: event.payload.metadata.recordedAt,
        useCount: 0,
        actionsCount: event.payload.metadata.stepCount,
        recordingDuration: event.payload.metadata.recordingDuration,
        confidence: 0.8, // Initial confidence for new recordings
        userNotes: (event.payload.metadata as any).userNotes
      },
      matching: {
        urlPattern: this.generateUrlPattern(event),
        domainPattern: this.extractDomain(event),
        exactParameters: this.extractParameters(event.payload.templatedScript),
        contextPatterns: this.extractContextPatterns(event)
      },
      version: 1
    };

    await this.storage.save(automation);
    return automation;
  }

  /**
   * Execute an existing automation
   */
  async executeAutomation(
    automationId: string,
    parameters: Record<string, any>,
    context?: Record<string, any>
  ): Promise<AutomationExecutionResult> {
    const startTime = Date.now();
    
    try {
      const automation = await this.storage.getById(automationId);
      if (!automation) {
        throw new Error(`Automation ${automationId} not found`);
      }

      // Update usage statistics
      await this.storage.updateUsage(automationId);

      // In a real implementation, this would execute the Playwright script
      // For now, we simulate execution
      const result = await this.simulateExecution(automation, parameters, context);

      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        automationId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        automationId
      };
    }
  }

  /**
   * Set user preference for automation reuse
   */
  setUserPreference(
    eventType: string,
    action: string,
    website: string,
    preference: ReusePreference
  ): void {
    const key = this.getPreferenceKey({ payload: { action }, website } as any);
    
    let until: Date;
    if (preference.doNotAskFor) {
      if (preference.doNotAskFor.type === 'duration') {
        until = new Date(Date.now() + preference.doNotAskFor.value * 60 * 1000);
      } else {
        // For 'times', we'll set it for a reasonable duration (1 hour per time)
        until = new Date(Date.now() + preference.doNotAskFor.value * 60 * 60 * 1000);
      }
    } else {
      until = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default
    }

    this.userPreferences.set(key, { until, preference });
  }

  /**
   * Get all stored automations
   */
  async getAllAutomations(): Promise<StoredAutomation[]> {
    return this.storage.exportAll();
  }

  /**
   * Delete an automation
   */
  async deleteAutomation(id: string): Promise<void> {
    await this.storage.deleteById(id);
  }

  /**
   * Export automations for sharing
   */
  async exportAutomations(): Promise<StoredAutomation[]> {
    return this.storage.exportAll();
  }

  /**
   * Import automations from sharing
   */
  async importAutomations(automations: StoredAutomation[]): Promise<void> {
    await this.storage.importAutomations(automations);
  }

  /**
   * Search for automations
   */
  async searchAutomations(criteria: AutomationSearchCriteria): Promise<StoredAutomation[]> {
    return this.storage.findMatching(criteria);
  }

  /**
   * Clear all automations (for testing/reset)
   */
  async clearAllAutomations(): Promise<void> {
    await this.storage.clear();
    this.userPreferences.clear();
  }

  // Private helper methods

  private createSearchCriteria(event: AutomationRequestedEvent): AutomationSearchCriteria {
    return {
      eventType: event.type,
      action: event.payload.action,
      website: event.website,
      parameters: Object.keys(event.payload.parameters),
      context: event.payload.context,
      minConfidence: 0.5
    };
  }

  private getPreferenceKey(event: { payload: { action: string }; website?: string }): string {
    return `${event.payload.action}:${event.website || 'any'}`;
  }

  private getUserPreference(key: string): { preference: ReusePreference } | null {
    const pref = this.userPreferences.get(key);
    if (!pref || pref.until < new Date()) {
      this.userPreferences.delete(key);
      return null;
    }
    return pref;
  }

  private extractWebsite(event: AutomationImplementedEvent): string {
    return event.website || this.extractDomainFromMetadata(event) || 'unknown';
  }

  private extractDomain(event: AutomationImplementedEvent): string {
    const website = this.extractWebsite(event);
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname;
    } catch {
      return website;
    }
  }

  private extractDomainFromMetadata(event: AutomationImplementedEvent): string | null {
    if (event.payload.metadata.websiteUrl) {
      try {
        const url = new URL(event.payload.metadata.websiteUrl);
        return url.hostname;
      } catch {
        return null;
      }
    }
    return null;
  }

  private generateUrlPattern(event: AutomationImplementedEvent): string {
    const domain = this.extractDomain(event);
    return `https://${domain}/*`;
  }

  private extractParameters(templatedScript: string): string[] {
    const paramRegex = /\$\{payload\.parameters\.(\w+)\}/g;
    const parameters: string[] = [];
    let match;
    
    while ((match = paramRegex.exec(templatedScript)) !== null) {
      if (!parameters.includes(match[1])) {
        parameters.push(match[1]);
      }
    }
    
    return parameters;
  }

  private extractContextPatterns(event: AutomationImplementedEvent): Record<string, any> | undefined {
    // Extract context patterns from the original request context
    // This would be more sophisticated in a real implementation
    const context = (event.payload as any).context;
    if (context) {
      return context;
    }
    return undefined;
  }

  private async simulateExecution(
    automation: StoredAutomation,
    parameters: Record<string, any>,
    context?: Record<string, any>
  ): Promise<any> {
    // Simulate script execution with provided parameters
    console.log(`Executing automation: ${automation.action}`);
    console.log(`Parameters:`, parameters);
    console.log(`Script template:`, automation.templatedScript);
    
    // In real implementation, this would:
    // 1. Replace template placeholders with actual parameters
    // 2. Execute the Playwright script in the browser
    // 3. Return the results
    
    return {
      status: 'success',
      message: `Automation "${automation.action}" executed successfully`,
      parameters,
      automationId: automation.id
    };
  }
}