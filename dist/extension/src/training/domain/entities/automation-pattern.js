"use strict";
// TypeScript-EDA AutomationPattern Entity
// Following Domain-Driven Design and Event-Driven Architecture principles
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationPattern = void 0;
const typescript_eda_1 = require("typescript-eda");
const training_events_1 = require("../events/training-events");
class AutomationPattern extends typescript_eda_1.Entity {
    constructor(patternData) {
        super();
        this.executionHistory = [];
        this.lastExecuted = null;
        this.data = { ...patternData };
    }
    // Getters for accessing pattern data
    get id() { return this.data.id; }
    get messageType() { return this.data.messageType; }
    get payload() { return { ...this.data.payload }; }
    get selector() { return this.data.selector; }
    get context() { return { ...this.data.context }; }
    get confidence() { return this.data.confidence; }
    get usageCount() { return this.data.usageCount; }
    get successfulExecutions() { return this.data.successfulExecutions; }
    get successRate() {
        return this.data.usageCount > 0 ? this.data.successfulExecutions / this.data.usageCount : 0;
    }
    async executePattern(event) {
        const executionId = this.generateExecutionId();
        try {
            // Validate pattern is still applicable
            if (!this.isValidForContext(event.request.context)) {
                return new training_events_1.PatternExecutionFailed(this.data.id, 'Pattern context validation failed - page structure or URL mismatch', event.correlationId);
            }
            // Validate confidence meets threshold
            if (event.confidence < 0.6) {
                return new training_events_1.PatternExecutionFailed(this.data.id, `Pattern confidence too low: ${event.confidence} < 0.6`, event.correlationId);
            }
            // Execute the automation pattern
            const executionResult = await this.executeAutomation(event.request);
            // Update usage statistics
            this.updateUsageStatistics(executionResult);
            // Update confidence based on execution result
            this.updateConfidence(executionResult);
            // Record execution in history
            this.recordExecution(executionResult);
            return new training_events_1.AutomationPatternExecuted(this.data.id, executionResult, event.correlationId);
        }
        catch (error) {
            const failureResult = {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
            // Record failed execution
            this.updateUsageStatistics(failureResult);
            this.recordExecution(failureResult);
            return new training_events_1.PatternExecutionFailed(this.data.id, `Pattern execution failed: ${error.message}`, event.correlationId);
        }
    }
    async evaluateMatch(request) {
        // Message type exact match
        const messageTypeMatch = this.data.messageType === request.messageType;
        // Payload similarity calculation
        const payloadSimilarity = this.calculatePayloadSimilarity(request.payload, this.data.payload);
        // Context compatibility
        const contextCompatibility = this.calculateContextCompatibility(request.context, this.data.context);
        // Confidence threshold based on pattern reliability
        const confidenceThreshold = this.calculateConfidenceThreshold();
        // Overall matching score
        const overallScore = this.calculateOverallMatchingScore(messageTypeMatch, payloadSimilarity, contextCompatibility, confidenceThreshold);
        return {
            messageTypeMatch,
            payloadSimilarity,
            contextCompatibility,
            confidenceThreshold,
            overallScore
        };
    }
    isGoodMatch(criteria) {
        return criteria.messageTypeMatch &&
            criteria.overallScore >= 0.7 &&
            criteria.contextCompatibility >= 0.6;
    }
    isValidForContext(currentContext) {
        // Same hostname requirement
        if (this.data.context.hostname !== currentContext.hostname) {
            return false;
        }
        // Path compatibility check
        const pathCompatibility = this.calculatePathCompatibility(this.data.context.pathname, currentContext.pathname);
        if (pathCompatibility < 0.5) {
            return false;
        }
        // Age-based validation
        const ageInDays = this.getPatternAgeInDays();
        if (ageInDays > 30) {
            return false; // Patterns older than 30 days are considered stale
        }
        // Page structure hash validation (if available)
        if (this.data.context.pageStructureHash && currentContext.pageStructureHash) {
            if (this.data.context.pageStructureHash !== currentContext.pageStructureHash) {
                // Allow some tolerance for minor page changes
                return this.successRate > 0.8; // Only reliable patterns survive page changes
            }
        }
        return true;
    }
    getReliabilityLevel() {
        const score = this.calculateReliabilityScore();
        if (score >= 0.8)
            return 'high';
        if (score >= 0.6)
            return 'medium';
        if (score >= 0.4)
            return 'low';
        return 'unreliable';
    }
    shouldBeRetrained() {
        // Pattern should be retrained if:
        // 1. Success rate is low
        // 2. It's old and hasn't been used recently
        // 3. Multiple recent failures
        if (this.successRate < 0.5 && this.data.usageCount >= 3) {
            return true;
        }
        const ageInDays = this.getPatternAgeInDays();
        const daysSinceLastExecution = this.lastExecuted
            ? (Date.now() - this.lastExecuted.getTime()) / (1000 * 60 * 60 * 24)
            : ageInDays;
        if (ageInDays > 14 && daysSinceLastExecution > 7) {
            return true;
        }
        // Check recent execution history
        const recentFailures = this.executionHistory
            .slice(-5) // Last 5 executions
            .filter(result => !result.success).length;
        return recentFailures >= 3;
    }
    // Private methods for domain logic
    async executeAutomation(request) {
        const startTime = Date.now();
        try {
            // Find the element using the stored selector
            const element = document.querySelector(this.data.selector);
            if (!element) {
                throw new Error(`Element not found with selector: ${this.data.selector}`);
            }
            // Execute the appropriate action based on message type
            await this.performAction(element, request);
            const endTime = Date.now();
            return {
                success: true,
                data: {
                    selector: this.data.selector,
                    actionPerformed: this.data.messageType,
                    executionTime: endTime - startTime
                },
                timestamp: new Date()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
    async performAction(element, request) {
        switch (this.data.messageType) {
            case 'FillTextRequested':
                await this.fillText(element, request.payload.value || '');
                break;
            case 'ClickElementRequested':
                await this.clickElement(element);
                break;
            case 'SelectProjectRequested':
                await this.selectProject(element, request.payload.projectName);
                break;
            case 'SelectChatRequested':
                await this.selectChat(element, request.payload.chatTitle);
                break;
            default:
                throw new Error(`Unsupported message type: ${this.data.messageType}`);
        }
    }
    async fillText(input, value) {
        if (!input || input.type === 'file') {
            throw new Error('Invalid input element for text filling');
        }
        // Clear existing value
        input.value = '';
        input.focus();
        // Simulate typing
        input.value = value;
        // Trigger input events
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    async clickElement(element) {
        if (!element) {
            throw new Error('Element is null or undefined');
        }
        // Ensure element is visible and clickable
        if (!this.isElementClickable(element)) {
            throw new Error('Element is not clickable (hidden or disabled)');
        }
        // Perform the click
        element.click();
        // Wait for potential navigation or dynamic content
        await this.waitForStabilization();
    }
    async selectProject(element, projectName) {
        await this.clickElement(element);
        // Additional validation that the project was actually selected
        if (projectName) {
            await this.validateProjectSelection(projectName);
        }
    }
    async selectChat(element, chatTitle) {
        await this.clickElement(element);
        // Additional validation that the chat was opened
        if (chatTitle) {
            await this.validateChatSelection(chatTitle);
        }
    }
    isElementClickable(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            !element.hasAttribute('disabled');
    }
    async waitForStabilization(timeout = 1000) {
        // Wait for DOM to stabilize after action
        return new Promise(resolve => setTimeout(resolve, Math.min(timeout, 100)));
    }
    async validateProjectSelection(projectName) {
        // Simple validation - check if project name appears in the page
        const bodyText = document.body.textContent || '';
        if (!bodyText.includes(projectName)) {
            throw new Error(`Project selection validation failed: ${projectName} not found in page content`);
        }
    }
    async validateChatSelection(chatTitle) {
        // Simple validation - check if chat title appears in the page
        const titleElements = document.querySelectorAll('h1, h2, h3, .chat-title, [data-testid*="title"]');
        const foundTitle = Array.from(titleElements).some(el => el.textContent?.includes(chatTitle));
        if (!foundTitle) {
            throw new Error(`Chat selection validation failed: ${chatTitle} not found in page titles`);
        }
    }
    calculatePayloadSimilarity(payload1, payload2) {
        const keys1 = Object.keys(payload1);
        const keys2 = Object.keys(payload2);
        if (keys1.length === 0 && keys2.length === 0)
            return 1.0;
        const allKeys = new Set([...keys1, ...keys2]);
        let similarityScore = 0;
        for (const key of allKeys) {
            if (keys1.includes(key) && keys2.includes(key)) {
                const val1 = payload1[key];
                const val2 = payload2[key];
                if (key === 'element') {
                    // Element names should match closely
                    similarityScore += val1 === val2 ? 1.0 : 0.2;
                }
                else if (typeof val1 === 'string' && typeof val2 === 'string') {
                    similarityScore += this.calculateStringSimilarity(val1, val2);
                }
                else {
                    similarityScore += val1 === val2 ? 1.0 : 0;
                }
            }
        }
        return similarityScore / allKeys.size;
    }
    calculateContextCompatibility(context1, context2) {
        let score = 0;
        let factors = 0;
        // Hostname (most important)
        factors += 3;
        if (context1.hostname === context2.hostname) {
            score += 3;
        }
        // Pathname similarity
        factors += 2;
        const pathSimilarity = this.calculatePathCompatibility(context1.pathname, context2.pathname);
        score += pathSimilarity * 2;
        // Page structure (if available)
        if (context1.pageStructureHash && context2.pageStructureHash) {
            factors += 1;
            if (context1.pageStructureHash === context2.pageStructureHash) {
                score += 1;
            }
        }
        return factors > 0 ? score / factors : 0;
    }
    calculatePathCompatibility(path1, path2) {
        if (path1 === path2)
            return 1.0;
        const segments1 = path1.split('/').filter(s => s.length > 0);
        const segments2 = path2.split('/').filter(s => s.length > 0);
        if (segments1.length === 0 && segments2.length === 0)
            return 1.0;
        const commonSegments = segments1.filter(seg => segments2.includes(seg));
        const totalSegments = new Set([...segments1, ...segments2]).size;
        return commonSegments.length / totalSegments;
    }
    calculateConfidenceThreshold() {
        // Dynamic threshold based on pattern reliability
        const baseThreshold = 0.6;
        const reliabilityBonus = this.successRate * 0.2;
        const ageReduction = Math.min(0.2, this.getPatternAgeInDays() / 30 * 0.2);
        return Math.max(0.4, baseThreshold + reliabilityBonus - ageReduction);
    }
    calculateOverallMatchingScore(messageTypeMatch, payloadSimilarity, contextCompatibility, confidenceThreshold) {
        if (!messageTypeMatch)
            return 0;
        const weights = {
            payload: 0.4,
            context: 0.3,
            confidence: 0.3
        };
        return (payloadSimilarity * weights.payload +
            contextCompatibility * weights.context +
            this.data.confidence * weights.confidence);
    }
    calculateReliabilityScore() {
        let score = this.data.confidence;
        // Success rate impact
        score *= (0.5 + this.successRate * 0.5);
        // Age penalty
        const ageInDays = this.getPatternAgeInDays();
        if (ageInDays > 30) {
            score *= 0.3;
        }
        else if (ageInDays > 7) {
            score *= 0.7;
        }
        // Usage bonus for well-tested patterns
        if (this.data.usageCount >= 5) {
            score *= 1.1;
        }
        return Math.max(0, Math.min(1, score));
    }
    calculateStringSimilarity(str1, str2) {
        if (str1 === str2)
            return 1.0;
        if (str1.length === 0 || str2.length === 0)
            return 0;
        const maxLength = Math.max(str1.length, str2.length);
        const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
        return 1 - (distance / maxLength);
    }
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++)
            matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++)
            matrix[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, // deletion
                matrix[j - 1][i] + 1, // insertion
                matrix[j - 1][i - 1] + cost // substitution
                );
            }
        }
        return matrix[str2.length][str1.length];
    }
    updateUsageStatistics(result) {
        this.data.usageCount++;
        if (result.success) {
            this.data.successfulExecutions++;
        }
        this.lastExecuted = new Date();
    }
    updateConfidence(result) {
        if (result.success) {
            // Boost confidence for successful executions
            this.data.confidence = Math.min(2.0, this.data.confidence + 0.05);
        }
        else {
            // Reduce confidence for failures
            this.data.confidence = Math.max(0.1, this.data.confidence - 0.1);
        }
    }
    recordExecution(result) {
        this.executionHistory.push(result);
        // Keep only last 10 executions for memory efficiency
        if (this.executionHistory.length > 10) {
            this.executionHistory = this.executionHistory.slice(-10);
        }
    }
    getPatternAgeInDays() {
        return (Date.now() - this.data.context.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    }
    generateExecutionId() {
        return `exec-${this.data.id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    }
}
exports.AutomationPattern = AutomationPattern;
__decorate([
    (0, typescript_eda_1.listen)(training_events_1.AutomationPatternMatched),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_events_1.AutomationPatternMatched]),
    __metadata("design:returntype", Promise)
], AutomationPattern.prototype, "executePattern", null);
//# sourceMappingURL=automation-pattern.js.map