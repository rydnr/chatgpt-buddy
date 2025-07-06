// TypeScript-EDA Pattern Matching Adapter
// Infrastructure layer - coordinates pattern matching and execution logic
import { AutomationPatternMatched } from '../domain/events/training-events';
import { PatternStorageAdapter } from './pattern-storage-adapter';
export class PatternMatchingAdapter {
    constructor(storageAdapter) {
        this.patternCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.lastCacheUpdate = 0;
        this.storageAdapter = storageAdapter || new PatternStorageAdapter();
    }
    // Event handlers for primary adapter functionality
    async handleAutomationRequest(request) {
        const matches = await this.findMatchingPatterns(request);
        const bestMatch = this.selectBestPattern(matches);
        if (bestMatch && this.isMatchAcceptable(bestMatch)) {
            return new AutomationPatternMatched(bestMatch.pattern, request, bestMatch.confidence, this.generateCorrelationId());
        }
        return null;
    }
    // PatternMatchingPort implementation
    async findMatchingPatterns(request) {
        // Get patterns from cache or storage
        const patterns = await this.getPatternsByType(request.messageType);
        // Evaluate each pattern for matching
        const matches = [];
        for (const pattern of patterns) {
            const match = await this.evaluatePatternMatch(pattern, request);
            if (match.overallScore > 0.3) { // Minimum threshold for consideration
                matches.push(match);
            }
        }
        // Sort by overall score (best first)
        matches.sort((a, b) => b.overallScore - a.overallScore);
        return matches;
    }
    selectBestPattern(matches) {
        if (matches.length === 0)
            return null;
        // Filter by recommendation level
        const highConfidenceMatches = matches.filter(m => m.recommendationLevel === 'high');
        if (highConfidenceMatches.length > 0) {
            return highConfidenceMatches[0];
        }
        const mediumConfidenceMatches = matches.filter(m => m.recommendationLevel === 'medium');
        if (mediumConfidenceMatches.length > 0) {
            return mediumConfidenceMatches[0];
        }
        // Only use low confidence matches if they have very high scores
        const lowConfidenceMatches = matches.filter(m => m.recommendationLevel === 'low' && m.overallScore > 0.8);
        if (lowConfidenceMatches.length > 0) {
            return lowConfidenceMatches[0];
        }
        return null; // Don't use risky patterns
    }
    async executePattern(pattern, request) {
        const startTime = Date.now();
        try {
            // Validate context compatibility
            if (!this.isContextValid(pattern.context, request.context)) {
                throw new Error('Pattern context is no longer valid for current page');
            }
            // Find element using pattern selector
            const element = document.querySelector(pattern.selector);
            if (!element) {
                throw new Error(`Element not found with selector: ${pattern.selector}`);
            }
            // Validate element is still actionable
            if (!this.isElementActionable(element, pattern.messageType)) {
                throw new Error('Element is not in an actionable state');
            }
            // Execute the specific action
            await this.performPatternAction(element, pattern, request);
            const executionTime = Date.now() - startTime;
            return {
                success: true,
                data: {
                    patternId: pattern.id,
                    selector: pattern.selector,
                    executionTime,
                    actionType: pattern.messageType
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
    async updatePatternStatistics(patternId, result) {
        try {
            const pattern = await this.storageAdapter.retrievePattern(patternId);
            if (!pattern) {
                throw new Error(`Pattern not found: ${patternId}`);
            }
            const newUsageCount = pattern.usageCount + 1;
            const newSuccessfulExecutions = pattern.successfulExecutions + (result.success ? 1 : 0);
            await this.storageAdapter.updatePatternUsage(patternId, newUsageCount, newSuccessfulExecutions);
            // Update confidence based on execution result
            const newConfidence = this.calculateUpdatedConfidence(pattern, result);
            await this.storageAdapter.updatePatternConfidence(patternId, newConfidence);
            // Invalidate cache for this pattern type
            this.invalidateCacheForType(pattern.messageType);
        }
        catch (error) {
            console.error('Failed to update pattern statistics:', error);
        }
    }
    // Advanced pattern analysis methods
    async analyzePatternPerformance(patternId) {
        const pattern = await this.storageAdapter.retrievePattern(patternId);
        if (!pattern)
            return null;
        const successRate = pattern.usageCount > 0
            ? pattern.successfulExecutions / pattern.usageCount
            : 0;
        const reliability = this.calculateReliabilityLevel(pattern);
        const recommendedAction = this.getRecommendedAction(pattern);
        return {
            pattern,
            performance: {
                successRate,
                averageExecutionTime: 0, // Would need execution history to calculate
                recentTrend: 'stable', // Would need trend analysis
                reliability,
                recommendedAction
            }
        };
    }
    async getPatternRecommendations(context) {
        const patterns = await this.storageAdapter.retrievePatternsByContext(context);
        const suggestionsByType = {};
        const needsTraining = [];
        const stalePatterns = [];
        let totalHealthScore = 0;
        for (const pattern of patterns) {
            const messageType = pattern.messageType;
            if (!suggestionsByType[messageType]) {
                suggestionsByType[messageType] = [];
            }
            // Create a mock request to evaluate pattern health
            const mockRequest = {
                messageType,
                payload: pattern.payload,
                context
            };
            const match = await this.evaluatePatternMatch(pattern, mockRequest);
            suggestionsByType[messageType].push(match);
            totalHealthScore += match.overallScore;
            // Check if pattern needs attention
            if (this.shouldRetrain(pattern)) {
                needsTraining.push(pattern.id);
            }
            if (this.isPatternStale(pattern)) {
                stalePatterns.push(pattern.id);
            }
        }
        const overallHealth = patterns.length > 0 ? totalHealthScore / patterns.length : 0;
        return {
            suggestionsByType,
            overallHealth,
            needsTraining,
            stalePatterns
        };
    }
    // Private methods
    async evaluatePatternMatch(pattern, request) {
        // Message type compatibility (must match exactly)
        if (pattern.messageType !== request.messageType) {
            return this.createLowScoreMatch(pattern, 'Message type mismatch');
        }
        // Payload similarity
        const payloadSimilarity = this.calculatePayloadSimilarity(pattern.payload, request.payload);
        // Context compatibility
        const contextScore = this.calculateContextScore(pattern.context, request.context);
        // Pattern reliability
        const reliabilityScore = this.calculatePatternReliability(pattern);
        // Age penalty
        const agePenalty = this.calculateAgePenalty(pattern);
        // Overall score calculation with weights
        const weights = {
            payload: 0.35,
            context: 0.25,
            reliability: 0.25,
            age: 0.15
        };
        const overallScore = (payloadSimilarity * weights.payload +
            contextScore * weights.context +
            reliabilityScore * weights.reliability +
            agePenalty * weights.age);
        const confidence = Math.min(pattern.confidence, overallScore);
        const recommendationLevel = this.determineRecommendationLevel(overallScore, pattern);
        return {
            pattern,
            confidence,
            contextScore,
            payloadSimilarity,
            overallScore,
            recommendationLevel
        };
    }
    createLowScoreMatch(pattern, reason) {
        return {
            pattern,
            confidence: 0,
            contextScore: 0,
            payloadSimilarity: 0,
            overallScore: 0,
            recommendationLevel: 'risky'
        };
    }
    calculatePayloadSimilarity(patternPayload, requestPayload) {
        const patternKeys = Object.keys(patternPayload);
        const requestKeys = Object.keys(requestPayload);
        if (patternKeys.length === 0 && requestKeys.length === 0)
            return 1.0;
        const allKeys = new Set([...patternKeys, ...requestKeys]);
        let similarityScore = 0;
        for (const key of allKeys) {
            const hasPatternKey = patternKeys.includes(key);
            const hasRequestKey = requestKeys.includes(key);
            if (hasPatternKey && hasRequestKey) {
                const patternValue = patternPayload[key];
                const requestValue = requestPayload[key];
                if (key === 'element') {
                    // Element names should match closely for high confidence
                    similarityScore += patternValue === requestValue ? 1.0 : 0.3;
                }
                else if (typeof patternValue === 'string' && typeof requestValue === 'string') {
                    similarityScore += this.calculateStringSimilarity(patternValue, requestValue);
                }
                else {
                    similarityScore += patternValue === requestValue ? 1.0 : 0;
                }
            }
            else if (hasPatternKey || hasRequestKey) {
                // Penalty for missing keys
                similarityScore += 0.1;
            }
        }
        return Math.min(1.0, similarityScore / allKeys.size);
    }
    calculateContextScore(patternContext, requestContext) {
        let score = 0;
        let totalWeight = 0;
        // Hostname (critical)
        totalWeight += 4;
        if (patternContext.hostname === requestContext.hostname) {
            score += 4;
        }
        // Pathname (important)
        totalWeight += 3;
        const pathSimilarity = this.calculatePathSimilarity(patternContext.pathname, requestContext.pathname);
        score += pathSimilarity * 3;
        // Page structure hash (if available)
        if (patternContext.pageStructureHash && requestContext.pageStructureHash) {
            totalWeight += 2;
            if (patternContext.pageStructureHash === requestContext.pageStructureHash) {
                score += 2;
            }
        }
        return totalWeight > 0 ? score / totalWeight : 0;
    }
    calculatePatternReliability(pattern) {
        let reliability = pattern.confidence;
        // Success rate factor
        if (pattern.usageCount > 0) {
            const successRate = pattern.successfulExecutions / pattern.usageCount;
            reliability *= (0.5 + successRate * 0.5);
        }
        // Usage count bonus for well-tested patterns
        if (pattern.usageCount >= 5) {
            reliability *= 1.1;
        }
        else if (pattern.usageCount === 0) {
            reliability *= 0.8; // Slight penalty for untested patterns
        }
        return Math.min(1.0, reliability);
    }
    calculateAgePenalty(pattern) {
        const ageInDays = (Date.now() - pattern.context.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays <= 1)
            return 1.0; // Fresh patterns
        if (ageInDays <= 7)
            return 0.95; // Week-old patterns
        if (ageInDays <= 30)
            return 0.85; // Month-old patterns
        if (ageInDays <= 90)
            return 0.7; // Quarter-old patterns
        return 0.5; // Very old patterns get significant penalty
    }
    determineRecommendationLevel(overallScore, pattern) {
        const successRate = pattern.usageCount > 0 ? pattern.successfulExecutions / pattern.usageCount : 1;
        if (overallScore >= 0.8 && successRate >= 0.8)
            return 'high';
        if (overallScore >= 0.6 && successRate >= 0.6)
            return 'medium';
        if (overallScore >= 0.4 && successRate >= 0.4)
            return 'low';
        return 'risky';
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
    calculatePathSimilarity(path1, path2) {
        if (path1 === path2)
            return 1.0;
        const segments1 = path1.split('/').filter(s => s.length > 0);
        const segments2 = path2.split('/').filter(s => s.length > 0);
        if (segments1.length === 0 && segments2.length === 0)
            return 1.0;
        const commonSegments = segments1.filter(seg => segments2.includes(seg));
        const totalUniqueSegments = new Set([...segments1, ...segments2]).size;
        return commonSegments.length / totalUniqueSegments;
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
    async getPatternsByType(messageType) {
        const cacheKey = messageType;
        const now = Date.now();
        // Check cache validity
        if (this.patternCache.has(cacheKey) && (now - this.lastCacheUpdate) < this.cacheTimeout) {
            return this.patternCache.get(cacheKey);
        }
        // Fetch from storage
        const patterns = await this.storageAdapter.retrievePatternsByType(messageType);
        // Update cache
        this.patternCache.set(cacheKey, patterns);
        this.lastCacheUpdate = now;
        return patterns;
    }
    invalidateCacheForType(messageType) {
        this.patternCache.delete(messageType);
    }
    isMatchAcceptable(match) {
        return match.recommendationLevel !== 'risky' && match.overallScore >= 0.5;
    }
    isContextValid(patternContext, currentContext) {
        return patternContext.hostname === currentContext.hostname &&
            this.calculatePathSimilarity(patternContext.pathname, currentContext.pathname) >= 0.5;
    }
    isElementActionable(element, actionType) {
        const htmlElement = element;
        // Check if element is visible and not disabled
        const style = window.getComputedStyle(htmlElement);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
        }
        if (htmlElement.hasAttribute('disabled')) {
            return false;
        }
        // Action-specific checks
        switch (actionType) {
            case 'FillTextRequested':
                return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
            case 'ClickElementRequested':
            case 'SelectProjectRequested':
            case 'SelectChatRequested':
                return true; // Most elements can be clicked
            default:
                return true;
        }
    }
    async performPatternAction(element, pattern, request) {
        switch (pattern.messageType) {
            case 'FillTextRequested':
                await this.fillTextAction(element, request.payload.value || '');
                break;
            case 'ClickElementRequested':
            case 'SelectProjectRequested':
            case 'SelectChatRequested':
                await this.clickAction(element);
                break;
            default:
                throw new Error(`Unsupported action type: ${pattern.messageType}`);
        }
    }
    async fillTextAction(input, value) {
        input.focus();
        input.value = '';
        // Simulate typing
        for (let i = 0; i < value.length; i++) {
            input.value += value[i];
            input.dispatchEvent(new Event('input', { bubbles: true }));
            await this.delay(10); // Small delay between characters
        }
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    async clickAction(element) {
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.delay(100);
        // Perform click
        element.click();
        await this.delay(50);
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    calculateUpdatedConfidence(pattern, result) {
        let newConfidence = pattern.confidence;
        if (result.success) {
            newConfidence = Math.min(2.0, newConfidence + 0.05);
        }
        else {
            newConfidence = Math.max(0.1, newConfidence - 0.1);
        }
        return newConfidence;
    }
    calculateReliabilityLevel(pattern) {
        const successRate = pattern.usageCount > 0 ? pattern.successfulExecutions / pattern.usageCount : 1;
        const ageInDays = (Date.now() - pattern.context.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        let score = pattern.confidence * successRate;
        // Age penalty
        if (ageInDays > 30)
            score *= 0.7;
        else if (ageInDays > 7)
            score *= 0.9;
        if (score >= 0.8)
            return 'high';
        if (score >= 0.6)
            return 'medium';
        if (score >= 0.4)
            return 'low';
        return 'unreliable';
    }
    getRecommendedAction(pattern) {
        const reliability = this.calculateReliabilityLevel(pattern);
        const successRate = pattern.usageCount > 0 ? pattern.successfulExecutions / pattern.usageCount : 1;
        if (reliability === 'unreliable' || (pattern.usageCount >= 5 && successRate < 0.3)) {
            return 'delete';
        }
        if (reliability === 'low' || this.shouldRetrain(pattern)) {
            return 'retrain';
        }
        return 'keep';
    }
    shouldRetrain(pattern) {
        const successRate = pattern.usageCount > 0 ? pattern.successfulExecutions / pattern.usageCount : 1;
        const ageInDays = (Date.now() - pattern.context.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return ((pattern.usageCount >= 3 && successRate < 0.5) ||
            (ageInDays > 14 && pattern.usageCount === 0) ||
            pattern.confidence < 0.4);
    }
    isPatternStale(pattern) {
        const ageInDays = (Date.now() - pattern.context.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return ageInDays > 30;
    }
    generateCorrelationId() {
        return `pattern-match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
