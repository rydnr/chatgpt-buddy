"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationManager = void 0;
const uuid_1 = require("uuid");
const automation_storage_1 = require("../storage/automation-storage");
/**
 * Manages the learning workflow and automation storage
 * Coordinates between events, storage, and user preferences
 */
class AutomationManager {
    storage;
    userPreferences = new Map();
    constructor(storage) {
        this.storage = storage || (0, automation_storage_1.createAutomationStorage)();
    }
    /**
     * Handle an automation request - core learning workflow
     * Returns the appropriate action: reuse existing, record new, or request guidance
     */
    async handleAutomationRequest(event) {
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
    async saveAutomation(event) {
        const automation = {
            id: (0, uuid_1.v4)(),
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
                userNotes: event.payload.metadata.userNotes
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
    async executeAutomation(automationId, parameters, context) {
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
        }
        catch (error) {
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
    setUserPreference(eventType, action, website, preference) {
        const key = this.getPreferenceKey({ payload: { action }, website });
        let until;
        if (preference.doNotAskFor) {
            if (preference.doNotAskFor.type === 'duration') {
                until = new Date(Date.now() + preference.doNotAskFor.value * 60 * 1000);
            }
            else {
                // For 'times', we'll set it for a reasonable duration (1 hour per time)
                until = new Date(Date.now() + preference.doNotAskFor.value * 60 * 60 * 1000);
            }
        }
        else {
            until = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default
        }
        this.userPreferences.set(key, { until, preference });
    }
    /**
     * Get all stored automations
     */
    async getAllAutomations() {
        return this.storage.exportAll();
    }
    /**
     * Delete an automation
     */
    async deleteAutomation(id) {
        await this.storage.deleteById(id);
    }
    /**
     * Export automations for sharing
     */
    async exportAutomations() {
        return this.storage.exportAll();
    }
    /**
     * Import automations from sharing
     */
    async importAutomations(automations) {
        await this.storage.importAutomations(automations);
    }
    /**
     * Search for automations
     */
    async searchAutomations(criteria) {
        return this.storage.findMatching(criteria);
    }
    /**
     * Clear all automations (for testing/reset)
     */
    async clearAllAutomations() {
        await this.storage.clear();
        this.userPreferences.clear();
    }
    // Private helper methods
    createSearchCriteria(event) {
        return {
            eventType: event.type,
            action: event.payload.action,
            website: event.website,
            parameters: Object.keys(event.payload.parameters),
            context: event.payload.context,
            minConfidence: 0.5
        };
    }
    getPreferenceKey(event) {
        return `${event.payload.action}:${event.website || 'any'}`;
    }
    getUserPreference(key) {
        const pref = this.userPreferences.get(key);
        if (!pref || pref.until < new Date()) {
            this.userPreferences.delete(key);
            return null;
        }
        return pref;
    }
    extractWebsite(event) {
        return event.website || this.extractDomainFromMetadata(event) || 'unknown';
    }
    extractDomain(event) {
        const website = this.extractWebsite(event);
        try {
            const url = new URL(website.startsWith('http') ? website : `https://${website}`);
            return url.hostname;
        }
        catch {
            return website;
        }
    }
    extractDomainFromMetadata(event) {
        if (event.payload.metadata.websiteUrl) {
            try {
                const url = new URL(event.payload.metadata.websiteUrl);
                return url.hostname;
            }
            catch {
                return null;
            }
        }
        return null;
    }
    generateUrlPattern(event) {
        const domain = this.extractDomain(event);
        return `https://${domain}/*`;
    }
    extractParameters(templatedScript) {
        const paramRegex = /\$\{payload\.parameters\.(\w+)\}/g;
        const parameters = [];
        let match;
        while ((match = paramRegex.exec(templatedScript)) !== null) {
            if (!parameters.includes(match[1])) {
                parameters.push(match[1]);
            }
        }
        return parameters;
    }
    extractContextPatterns(event) {
        // Extract context patterns from the original request context
        // This would be more sophisticated in a real implementation
        const context = event.payload.context;
        if (context) {
            return context;
        }
        return undefined;
    }
    async simulateExecution(automation, parameters, context) {
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
exports.AutomationManager = AutomationManager;
//# sourceMappingURL=automation-manager.js.map