// 🟢 GREEN: Enhanced Training UI Implementation - TDD Walking Skeleton
// 🟢 GREEN: Enhanced implementation with element selection and pattern storage
export class TrainingUI {
    constructor() {
        this.overlay = null;
        this.isTrainingMode = false;
        this.isSelectionMode = false;
        this.capturedSelector = null;
        this.capturedElement = null;
        this.confirmationOverlay = null;
        this.storedPatterns = [];
        this.handleElementSelection = (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.capturedElement = event.target;
            this.capturedSelector = generateOptimalSelector(this.capturedElement);
            // Show confirmation dialog
            this.showConfirmationDialog(this.capturedElement, this.capturedSelector);
        };
        // Enhanced constructor with pattern storage
    }
    enableTrainingMode() {
        this.isTrainingMode = true;
    }
    disableTrainingMode() {
        this.isTrainingMode = false;
    }
    showTrainingPrompt(messageType, payload) {
        if (!this.isTrainingMode) {
            return;
        }
        // Create minimal overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'training-overlay';
        // Generate training text
        const trainingText = generateTrainingText(messageType, payload);
        this.overlay.innerHTML = `
      <div class="training-prompt">
        <h3>🎯 Training Mode Active</h3>
        <p>${trainingText}</p>
        <button onclick="this.cancelTraining()">Cancel</button>
      </div>
    `;
        // Add to DOM
        document.body.appendChild(this.overlay);
        // Enable element selection mode
        this.enableElementSelection();
    }
    isVisible() {
        return this.overlay !== null && document.body.contains(this.overlay);
    }
    hide() {
        if (this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
        }
        if (this.confirmationOverlay) {
            document.body.removeChild(this.confirmationOverlay);
            this.confirmationOverlay = null;
        }
        // Disable selection mode
        this.disableElementSelection();
    }
    // 🟢 GREEN: Element selection functionality
    isSelectionModeEnabled() {
        return this.isSelectionMode;
    }
    getCapturedSelector() {
        return this.capturedSelector;
    }
    getCapturedElement() {
        return this.capturedElement;
    }
    getClickHandler() {
        return this.handleElementSelection;
    }
    isConfirmationVisible() {
        return this.confirmationOverlay !== null && document.body.contains(this.confirmationOverlay);
    }
    showConfirmationDialog(element, selector) {
        this.confirmationOverlay = document.createElement('div');
        this.confirmationOverlay.className = 'training-confirmation';
        this.confirmationOverlay.innerHTML = `
      <div class="training-confirmation">
        <h3>✅ Element Selected</h3>
        <p>Selected element: <code>${element.tagName.toLowerCase()}</code></p>
        <p>Generated selector: <code>${selector}</code></p>
        <button onclick="this.confirmPattern()">Yes, Automate</button>
        <button onclick="this.cancelTraining()">Cancel</button>
      </div>
    `;
        document.body.appendChild(this.confirmationOverlay);
    }
    handleMouseOver(event) {
        if (!this.isSelectionMode)
            return;
        const target = event.target;
        if (target) {
            target.style.outline = '2px solid blue';
        }
    }
    handleMouseOut(event) {
        if (!this.isSelectionMode)
            return;
        const target = event.target;
        if (target) {
            target.style.outline = '';
        }
    }
    enableElementSelection() {
        this.isSelectionMode = true;
        document.body.style.cursor = 'crosshair';
        // Add event listeners for element selection
        document.addEventListener('click', this.handleElementSelection, true);
        document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
        document.addEventListener('mouseout', this.handleMouseOut.bind(this), true);
    }
    disableElementSelection() {
        this.isSelectionMode = false;
        document.body.style.cursor = '';
        // Cleanup event listeners
        document.removeEventListener('click', this.handleElementSelection, true);
        document.removeEventListener('mouseover', this.handleMouseOver, true);
        document.removeEventListener('mouseout', this.handleMouseOut, true);
    }
    // 🟢 GREEN: Pattern storage functionality
    createAutomationPattern(messageType, payload, element, selector) {
        const pattern = {
            id: this.generatePatternId(),
            messageType,
            payload,
            selector,
            context: {
                url: window.location?.href || 'unknown',
                hostname: window.location?.hostname || 'unknown',
                pathname: window.location?.pathname || 'unknown',
                title: document.title || 'unknown',
                timestamp: new Date()
            },
            confidence: 1.0,
            usageCount: 0,
            successfulExecutions: 0
        };
        return pattern;
    }
    savePattern(pattern) {
        this.storedPatterns.push(pattern);
    }
    getStoredPatterns() {
        return [...this.storedPatterns];
    }
    getPatternsByType(messageType) {
        return this.storedPatterns.filter(pattern => pattern.messageType === messageType);
    }
    generatePatternId() {
        return `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
// 🔵 REFACTOR: Enhanced CSS selector generation with priority and uniqueness
export function generateOptimalSelector(element) {
    const selectors = [];
    // Priority 1: ID selector (most specific)
    if (element.id) {
        selectors.push({
            selector: `#${element.id}`,
            priority: 1
        });
    }
    // Priority 2: Name attribute selector (good for forms)
    const nameAttr = element.getAttribute?.('name');
    if (nameAttr) {
        selectors.push({
            selector: `${element.tagName.toLowerCase()}[name="${nameAttr}"]`,
            priority: 2
        });
    }
    // Priority 3: Data attributes (common in modern apps)
    const dataTestId = element.getAttribute?.('data-testid');
    if (dataTestId) {
        selectors.push({
            selector: `[data-testid="${dataTestId}"]`,
            priority: 2
        });
    }
    // Priority 4: Unique class combination
    if (element.className) {
        const classes = element.className.split(' ').filter(c => c.length > 0);
        if (classes.length > 0) {
            const classSelector = `.${classes.join('.')}`;
            selectors.push({
                selector: classSelector,
                priority: 3
            });
        }
    }
    // Priority 5: Tag with type attribute (for inputs)
    const typeAttr = element.getAttribute?.('type');
    if (typeAttr) {
        selectors.push({
            selector: `${element.tagName.toLowerCase()}[type="${typeAttr}"]`,
            priority: 4
        });
    }
    // Priority 6: Tag selector (least specific)
    selectors.push({
        selector: element.tagName.toLowerCase(),
        priority: 5
    });
    // Return highest priority selector
    selectors.sort((a, b) => a.priority - b.priority);
    return selectors[0].selector;
}
// 🟢 GREEN: Minimal text generation function
export function generateTrainingText(messageType, payload) {
    switch (messageType) {
        case 'FillTextRequested':
            const element = payload.element || 'element';
            const value = payload.value || '';
            if (value) {
                return `Received FillTextRequested for the ${element} element, to fill with "${value}". Please select the ${element} element requested.`;
            }
            else {
                return `Received FillTextRequested for the ${element} element. Please select the ${element} element requested.`;
            }
        case 'ClickElementRequested':
            const clickElement = payload.element || 'element';
            return `Received ClickElementRequested for the ${clickElement} element. Please select the ${clickElement} element requested.`;
        case 'TabSwitchRequested':
            const title = payload.title || 'tab';
            return `Received TabSwitchRequested for tab "${title}". Please click on the tab you want to switch to.`;
        default:
            return `Received ${messageType}. Please select the appropriate element.`;
    }
}
// 🟢 GREEN: Pattern matching functionality
export class PatternMatcher {
    constructor() {
        this.patterns = [];
    }
    addPattern(pattern) {
        this.patterns.push(pattern);
    }
    findBestMatch(request) {
        const candidates = this.patterns.filter(p => p.messageType === request.messageType);
        if (candidates.length === 0) {
            return null;
        }
        // Simple matching - return first match for now
        for (const pattern of candidates) {
            const similarity = this.calculateSimilarity(request.payload, pattern.payload);
            if (similarity > 0.5) {
                return pattern;
            }
        }
        return null;
    }
    recordSuccessfulExecution(pattern) {
        pattern.usageCount++;
        pattern.successfulExecutions = (pattern.successfulExecutions || 0) + 1;
        // Simple confidence boost for successful executions
        pattern.confidence = Math.min(2.0, pattern.confidence + 0.1);
    }
    // 🔵 REFACTOR: Enhanced similarity calculation with value comparison
    calculateSimilarity(payload1, payload2) {
        const keys1 = Object.keys(payload1);
        const keys2 = Object.keys(payload2);
        if (keys1.length === 0 && keys2.length === 0) {
            return 1.0; // Both empty
        }
        // Calculate Jaccard similarity with value consideration
        const allKeys = new Set([...keys1, ...keys2]);
        let matchingScore = 0;
        for (const key of allKeys) {
            const hasKey1 = keys1.includes(key);
            const hasKey2 = keys2.includes(key);
            if (hasKey1 && hasKey2) {
                // Both have the key, check value similarity
                const val1 = payload1[key];
                const val2 = payload2[key];
                if (key === 'element') {
                    // Element names should match exactly for high confidence
                    matchingScore += val1 === val2 ? 1.0 : 0.3;
                }
                else if (typeof val1 === 'string' && typeof val2 === 'string') {
                    // String similarity for other values
                    const similarity = this.calculateStringSimilarity(val1, val2);
                    matchingScore += similarity;
                }
                else {
                    // Exact match for non-strings
                    matchingScore += val1 === val2 ? 1.0 : 0;
                }
            }
        }
        return matchingScore / allKeys.size;
    }
    calculateStringSimilarity(str1, str2) {
        if (str1 === str2)
            return 1.0;
        if (str1.length === 0 || str2.length === 0)
            return 0;
        // Simple Levenshtein distance-based similarity
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
}
// 🔵 REFACTOR: Enhanced context matching with scoring
export class ContextMatcher {
    isContextCompatible(patternContext, currentContext) {
        const score = this.calculateContextScore(patternContext, currentContext);
        return score >= 0.7; // 70% compatibility threshold
    }
    calculateContextScore(patternContext, currentContext) {
        let score = 0;
        let totalFactors = 0;
        // Hostname matching (most important)
        if (patternContext.hostname && currentContext.hostname) {
            totalFactors += 3; // Weight: 3
            if (patternContext.hostname === currentContext.hostname) {
                score += 3;
            }
        }
        // Pathname similarity
        if (patternContext.pathname && currentContext.pathname) {
            totalFactors += 2; // Weight: 2
            const pathSimilarity = this.calculatePathSimilarity(patternContext.pathname, currentContext.pathname);
            score += pathSimilarity * 2;
        }
        // Page structure hash (if available)
        if (patternContext.pageStructureHash && currentContext.pageStructureHash) {
            totalFactors += 1; // Weight: 1
            if (patternContext.pageStructureHash === currentContext.pageStructureHash) {
                score += 1;
            }
        }
        return totalFactors > 0 ? score / totalFactors : 0;
    }
    calculatePathSimilarity(path1, path2) {
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
}
// 🔵 REFACTOR: Enhanced pattern validation with confidence scoring
export class PatternValidator {
    isPatternStillValid(pattern, currentPageHash) {
        const validationScore = this.calculateValidationScore(pattern, currentPageHash);
        return validationScore >= 0.6; // 60% validity threshold
    }
    calculateValidationScore(pattern, currentPageHash) {
        let score = 1.0;
        // Age-based scoring (patterns get less reliable over time)
        const ageInDays = (Date.now() - pattern.context.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays > 30) {
            score *= 0.3; // Significant penalty for old patterns
        }
        else if (ageInDays > 7) {
            score *= 0.7; // Moderate penalty for week-old patterns
        }
        else if (ageInDays > 1) {
            score *= 0.9; // Small penalty for day-old patterns
        }
        // Page structure hash comparison
        if (currentPageHash && pattern.context.pageStructureHash) {
            if (pattern.context.pageStructureHash !== currentPageHash) {
                score *= 0.5; // Page structure changed significantly
            }
        }
        // Success rate-based scoring
        if (pattern.usageCount > 0) {
            const successRate = (pattern.successfulExecutions || 0) / pattern.usageCount;
            score *= (0.5 + successRate * 0.5); // Scale between 0.5 and 1.0 based on success rate
        }
        // Confidence boost for frequently used patterns
        if (pattern.usageCount >= 5) {
            score *= 1.1; // 10% boost for well-tested patterns
        }
        return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
    }
    getPatternReliabilityLevel(pattern) {
        const score = this.calculateValidationScore(pattern);
        if (score >= 0.8)
            return 'high';
        if (score >= 0.6)
            return 'medium';
        if (score >= 0.4)
            return 'low';
        return 'unreliable';
    }
}
