/**
 * Advanced Training Scenarios & Multi-Step Workflows
 *
 * Implements sophisticated training scenarios including conditional logic,
 * loops, data extraction, form handling, and complex multi-step workflows.
 */
import { globalPatternManager } from './pattern-manager';
import { globalMessageStore } from './message-store';
export class AdvancedTrainingManager {
    constructor() {
        this.scenarios = new Map();
        this.workflows = new Map();
        this.activeTrainingSessions = new Map();
        this.STORAGE_KEY = 'advanced-training-scenarios';
        this.loadScenarios();
        this.initializePredefinedScenarios();
    }
    /**
     * Create a comprehensive training scenario
     */
    async createTrainingScenario(name, category, difficulty, steps, options = {}) {
        const scenario = {
            id: this.generateScenarioId(),
            name,
            description: options.description || '',
            category,
            difficulty,
            estimatedTime: options.estimatedTime || this.estimateScenarioTime(steps),
            prerequisites: options.prerequisites || [],
            objectives: options.objectives || [],
            steps,
            variations: options.variations || [],
            assessment: options.assessment || this.createDefaultAssessment(),
            metadata: {
                author: 'System',
                version: '1.0.0',
                lastUpdated: new Date().toISOString(),
                tags: [],
                websiteTypes: [],
                browserCompatibility: ['chrome', 'firefox', 'edge'],
                language: 'en',
                translationSupport: false,
                ...options.metadata
            }
        };
        this.scenarios.set(scenario.id, scenario);
        await this.saveScenarios();
        globalMessageStore.addInboundMessage('TRAINING_SCENARIO_CREATED', { scenarioId: scenario.id, name, category, difficulty }, `scenario-created-${Date.now()}`, { extensionId: chrome.runtime.id, userAgent: navigator.userAgent });
        console.log(`🎓 Created training scenario: ${name} (${scenario.id})`);
        return scenario;
    }
    /**
     * Start an advanced training session
     */
    async startTrainingSession(scenarioId, userId = 'anonymous') {
        const scenario = this.scenarios.get(scenarioId);
        if (!scenario) {
            throw new Error(`Training scenario not found: ${scenarioId}`);
        }
        const session = new TrainingSession(scenario, userId);
        this.activeTrainingSessions.set(session.id, session);
        globalMessageStore.addInboundMessage('TRAINING_SESSION_STARTED', { sessionId: session.id, scenarioId, userId }, `session-started-${Date.now()}`, { extensionId: chrome.runtime.id, userAgent: navigator.userAgent });
        console.log(`🎯 Started training session: ${session.id} for scenario: ${scenario.name}`);
        return session;
    }
    /**
     * Create a complex multi-step workflow
     */
    async createWorkflowTemplate(name, phases, options = {}) {
        const workflow = {
            id: this.generateWorkflowId(),
            name,
            description: options.description || '',
            category: options.category || 'general',
            complexity: options.complexity || 'moderate',
            phases: phases.sort((a, b) => a.order - b.order),
            dataFlow: options.dataFlow || [],
            errorHandling: options.errorHandling || [],
            parallelExecution: options.parallelExecution || {
                enabled: false,
                maxConcurrentPhases: 1,
                syncPoints: [],
                resourceSharing: []
            }
        };
        // Validate workflow
        this.validateWorkflow(workflow);
        this.workflows.set(workflow.id, workflow);
        await this.saveWorkflows();
        globalMessageStore.addInboundMessage('WORKFLOW_CREATED', { workflowId: workflow.id, name, complexity: workflow.complexity }, `workflow-created-${Date.now()}`, { extensionId: chrome.runtime.id, userAgent: navigator.userAgent });
        console.log(`⚙️ Created workflow template: ${name} (${workflow.id})`);
        return workflow;
    }
    /**
     * Execute a complex workflow
     */
    async executeWorkflow(workflowId, context) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        const executor = new WorkflowExecutor(workflow, context);
        return await executor.execute();
    }
    /**
     * Initialize predefined training scenarios
     */
    async initializePredefinedScenarios() {
        // E-commerce Shopping Flow Scenario
        await this.createTrainingScenario('E-commerce Complete Purchase Flow', 'e-commerce', 'intermediate', [
            {
                id: 'step-1',
                name: 'Product Search and Selection',
                description: 'Learn to search for products and navigate to product pages',
                instructionType: 'guided-practice',
                patterns: [{
                        id: 'search-pattern',
                        name: 'Product Search',
                        description: 'Search for specific products using search functionality',
                        patternSteps: [
                            {
                                id: 'search-input',
                                type: 'type',
                                selector: '[data-testid="search-input"], .search-input, #search',
                                value: '${productName}',
                                description: 'Enter product name in search field',
                                timeout: 5000,
                                retries: 2,
                                errorHandling: 'retry'
                            },
                            {
                                id: 'search-submit',
                                type: 'click',
                                selector: '[data-testid="search-button"], .search-button, #search-btn',
                                description: 'Click search button',
                                timeout: 3000,
                                retries: 2,
                                errorHandling: 'retry'
                            }
                        ],
                        isOptional: false,
                        alternativeApproaches: ['voice-search', 'category-navigation', 'barcode-scan'],
                        difficultyFactors: ['dynamic-search-suggestions', 'autocomplete-handling']
                    }],
                hints: [
                    'Look for search boxes usually positioned at the top of the page',
                    'Some sites use magnifying glass icons for search buttons',
                    'Use data-testid attributes for more reliable element selection'
                ],
                commonMistakes: [
                    'Not waiting for search suggestions to load',
                    'Clicking submit before typing is complete',
                    'Not handling autocomplete interference'
                ],
                successCriteria: [
                    'Search results page loads successfully',
                    'Search term is correctly entered and submitted',
                    'Results are relevant to the search query'
                ],
                timeLimit: 60
            },
            {
                id: 'step-2',
                name: 'Add to Cart and Checkout',
                description: 'Complete the purchase process from product selection to payment',
                instructionType: 'independent-practice',
                patterns: [{
                        id: 'checkout-pattern',
                        name: 'Complete Checkout Process',
                        description: 'Navigate through the entire checkout flow',
                        patternSteps: [
                            {
                                id: 'add-to-cart',
                                type: 'click',
                                selector: '[data-testid="add-to-cart"], .add-to-cart, .btn-add-cart',
                                description: 'Add product to shopping cart',
                                timeout: 5000,
                                retries: 3,
                                errorHandling: 'retry'
                            },
                            {
                                id: 'proceed-checkout',
                                type: 'click',
                                selector: '[data-testid="checkout"], .checkout-btn, .proceed-checkout',
                                description: 'Proceed to checkout',
                                timeout: 5000,
                                retries: 2,
                                errorHandling: 'retry'
                            },
                            {
                                id: 'fill-shipping',
                                type: 'type',
                                selector: '#shipping-address, [name="address"]',
                                value: '${shippingAddress}',
                                description: 'Fill shipping address',
                                timeout: 3000,
                                retries: 2,
                                errorHandling: 'retry'
                            }
                        ],
                        isOptional: false,
                        alternativeApproaches: ['guest-checkout', 'social-login', 'one-click-purchase'],
                        difficultyFactors: ['multi-step-forms', 'payment-gateway-integration', 'address-validation']
                    }],
                hints: [
                    'Cart buttons often change after adding items',
                    'Some sites require user registration before checkout',
                    'Look for security indicators during payment steps'
                ],
                commonMistakes: [
                    'Not waiting for cart update animations',
                    'Missing required form fields',
                    'Not handling payment gateway redirects'
                ],
                successCriteria: [
                    'Item successfully added to cart',
                    'Checkout process initiated',
                    'All required information entered correctly'
                ],
                timeLimit: 180
            }
        ], {
            description: 'Comprehensive e-commerce automation training covering search, selection, and purchase flows',
            estimatedTime: 25,
            objectives: [
                {
                    id: 'obj-1',
                    description: 'Master product search and navigation patterns',
                    skills: ['element-identification', 'form-interaction', 'wait-handling'],
                    verificationMethod: 'pattern-execution'
                },
                {
                    id: 'obj-2',
                    description: 'Complete complex multi-step checkout processes',
                    skills: ['multi-step-forms', 'conditional-logic', 'error-handling'],
                    verificationMethod: 'automated-test'
                }
            ]
        });
        // Data Extraction Scenario
        await this.createTrainingScenario('Advanced Data Extraction and Processing', 'data-extraction', 'advanced', [
            {
                id: 'step-1',
                name: 'Table Data Extraction',
                description: 'Extract structured data from tables with pagination',
                instructionType: 'demonstration',
                patterns: [{
                        id: 'table-extraction',
                        name: 'Paginated Table Data Extraction',
                        description: 'Extract all data from a paginated table',
                        patternSteps: [
                            {
                                id: 'identify-table',
                                type: 'extract',
                                selector: 'table, .data-table, [role="table"]',
                                description: 'Identify the main data table',
                                timeout: 5000,
                                retries: 2,
                                errorHandling: 'fail'
                            },
                            {
                                id: 'extract-headers',
                                type: 'extract',
                                selector: 'th, .table-header, [role="columnheader"]',
                                description: 'Extract table headers',
                                timeout: 3000,
                                retries: 1,
                                errorHandling: 'continue'
                            },
                            {
                                id: 'extract-rows',
                                type: 'loop',
                                selector: 'tr, .table-row, [role="row"]',
                                description: 'Extract all table rows with pagination',
                                timeout: 10000,
                                retries: 3,
                                errorHandling: 'retry'
                            }
                        ],
                        isOptional: false,
                        alternativeApproaches: ['api-extraction', 'csv-export', 'copy-paste'],
                        difficultyFactors: ['infinite-scroll', 'lazy-loading', 'dynamic-content']
                    }],
                hints: [
                    'Always identify table structure before extracting data',
                    'Handle pagination and infinite scroll scenarios',
                    'Consider using CSS selectors for better reliability'
                ],
                commonMistakes: [
                    'Not waiting for table data to load completely',
                    'Missing pagination navigation',
                    'Extracting duplicate data across pages'
                ],
                successCriteria: [
                    'All table headers correctly identified',
                    'Complete dataset extracted from all pages',
                    'Data structure maintained and validated'
                ],
                timeLimit: 300
            }
        ], {
            description: 'Advanced data extraction techniques for complex tables and dynamic content',
            estimatedTime: 35,
            objectives: [
                {
                    id: 'obj-1',
                    description: 'Master structured data extraction from complex tables',
                    skills: ['data-extraction', 'pagination-handling', 'loop-patterns'],
                    verificationMethod: 'automated-test'
                }
            ]
        });
        console.log(`🎓 Initialized ${this.scenarios.size} predefined training scenarios`);
    }
    /**
     * Get all available training scenarios
     */
    getTrainingScenarios(filter) {
        let scenarios = Array.from(this.scenarios.values());
        if (filter) {
            if (filter.category) {
                scenarios = scenarios.filter(s => s.category === filter.category);
            }
            if (filter.difficulty) {
                scenarios = scenarios.filter(s => s.difficulty === filter.difficulty);
            }
            if (filter.searchText) {
                const searchLower = filter.searchText.toLowerCase();
                scenarios = scenarios.filter(s => s.name.toLowerCase().includes(searchLower) ||
                    s.description.toLowerCase().includes(searchLower));
            }
        }
        return scenarios.sort((a, b) => a.difficulty.localeCompare(b.difficulty));
    }
    /**
     * Get workflow templates
     */
    getWorkflowTemplates(filter) {
        let workflows = Array.from(this.workflows.values());
        if (filter) {
            if (filter.category) {
                workflows = workflows.filter(w => w.category === filter.category);
            }
            if (filter.complexity) {
                workflows = workflows.filter(w => w.complexity === filter.complexity);
            }
        }
        return workflows;
    }
    /**
     * Generate unique scenario ID
     */
    generateScenarioId() {
        return `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate unique workflow ID
     */
    generateWorkflowId() {
        return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Estimate scenario completion time
     */
    estimateScenarioTime(steps) {
        return steps.reduce((total, step) => {
            const stepTime = step.timeLimit || 120; // 2 minutes default
            return total + stepTime / 60; // Convert to minutes
        }, 0);
    }
    /**
     * Create default assessment criteria
     */
    createDefaultAssessment() {
        return {
            successMetrics: [
                {
                    name: 'Completion Rate',
                    type: 'completion-rate',
                    weight: 0.4,
                    thresholds: { excellent: 100, good: 90, acceptable: 80, needsImprovement: 70 }
                },
                {
                    name: 'Accuracy',
                    type: 'accuracy',
                    weight: 0.3,
                    thresholds: { excellent: 95, good: 85, acceptable: 75, needsImprovement: 65 }
                },
                {
                    name: 'Efficiency',
                    type: 'efficiency',
                    weight: 0.3,
                    thresholds: { excellent: 90, good: 80, acceptable: 70, needsImprovement: 60 }
                }
            ],
            rubric: [],
            feedback: []
        };
    }
    /**
     * Validate workflow definition
     */
    validateWorkflow(workflow) {
        // Check for circular dependencies
        const visited = new Set();
        const visiting = new Set();
        const hasCycle = (phaseId) => {
            if (visiting.has(phaseId))
                return true;
            if (visited.has(phaseId))
                return false;
            visiting.add(phaseId);
            const phase = workflow.phases.find(p => p.id === phaseId);
            if (phase) {
                for (const dep of phase.dependencies) {
                    if (hasCycle(dep))
                        return true;
                }
            }
            visiting.delete(phaseId);
            visited.add(phaseId);
            return false;
        };
        for (const phase of workflow.phases) {
            if (hasCycle(phase.id)) {
                throw new Error(`Circular dependency detected in workflow: ${workflow.name}`);
            }
        }
    }
    /**
     * Load scenarios from storage
     */
    async loadScenarios() {
        try {
            const result = await chrome.storage.local.get(this.STORAGE_KEY);
            const stored = result[this.STORAGE_KEY];
            if (stored && stored.scenarios) {
                stored.scenarios.forEach((scenario) => {
                    this.scenarios.set(scenario.id, scenario);
                });
                console.log(`📚 Loaded ${this.scenarios.size} training scenarios from storage`);
            }
        }
        catch (error) {
            console.error('❌ Failed to load training scenarios:', error);
        }
    }
    /**
     * Save scenarios to storage
     */
    async saveScenarios() {
        try {
            const scenarios = Array.from(this.scenarios.values());
            await chrome.storage.local.set({
                [this.STORAGE_KEY]: {
                    scenarios,
                    lastSaved: new Date().toISOString(),
                    version: '1.0.0'
                }
            });
        }
        catch (error) {
            console.error('❌ Failed to save training scenarios:', error);
        }
    }
    /**
     * Save workflows to storage
     */
    async saveWorkflows() {
        try {
            const workflows = Array.from(this.workflows.values());
            await chrome.storage.local.set({
                'advanced-training-workflows': {
                    workflows,
                    lastSaved: new Date().toISOString(),
                    version: '1.0.0'
                }
            });
        }
        catch (error) {
            console.error('❌ Failed to save workflows:', error);
        }
    }
}
/**
 * Training Session Management
 */
export class TrainingSession {
    constructor(scenario, userId) {
        this.currentStep = 0;
        this.id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.scenario = scenario;
        this.userId = userId;
        this.startTime = new Date();
        this.progress = {
            completedSteps: [],
            currentStepStartTime: new Date(),
            timeSpent: 0,
            hintsUsed: 0,
            mistakesMade: []
        };
        this.results = {
            score: 0,
            accuracy: 0,
            efficiency: 0,
            adaptability: 0,
            feedback: [],
            recommendations: []
        };
    }
    completeStep(stepId, success, timeSpent) {
        this.progress.completedSteps.push({
            stepId,
            success,
            timeSpent,
            completedAt: new Date()
        });
        this.progress.timeSpent += timeSpent;
        this.currentStep++;
        // Update results
        this.calculateResults();
    }
    calculateResults() {
        const completedSteps = this.progress.completedSteps;
        const totalSteps = this.scenario.steps.length;
        // Calculate completion rate
        const completionRate = (completedSteps.length / totalSteps) * 100;
        // Calculate accuracy
        const successfulSteps = completedSteps.filter(s => s.success).length;
        this.results.accuracy = (successfulSteps / completedSteps.length) * 100;
        // Calculate efficiency (based on time vs estimated time)
        const estimatedTime = this.scenario.estimatedTime * 60; // Convert to seconds
        this.results.efficiency = Math.max(0, 100 - ((this.progress.timeSpent - estimatedTime) / estimatedTime * 100));
        // Calculate overall score
        this.results.score = (completionRate * 0.4) + (this.results.accuracy * 0.3) + (this.results.efficiency * 0.3);
    }
}
/**
 * Workflow Execution Engine
 */
export class WorkflowExecutor {
    constructor(workflow, context) {
        this.workflow = workflow;
        this.context = context;
        this.executionState = {
            currentPhase: 0,
            completedPhases: [],
            data: new Map(),
            errors: [],
            startTime: new Date()
        };
    }
    async execute() {
        try {
            for (const phase of this.workflow.phases) {
                if (this.shouldExecutePhase(phase)) {
                    await this.executePhase(phase);
                }
            }
            return {
                success: true,
                executionTime: Date.now() - this.executionState.startTime.getTime(),
                completedPhases: this.executionState.completedPhases,
                data: Object.fromEntries(this.executionState.data),
                errors: this.executionState.errors
            };
        }
        catch (error) {
            return {
                success: false,
                executionTime: Date.now() - this.executionState.startTime.getTime(),
                completedPhases: this.executionState.completedPhases,
                data: Object.fromEntries(this.executionState.data),
                errors: [...this.executionState.errors, error.toString()]
            };
        }
    }
    shouldExecutePhase(phase) {
        // Check dependencies
        for (const depId of phase.dependencies) {
            if (!this.executionState.completedPhases.includes(depId)) {
                return false;
            }
        }
        // Check conditional execution
        for (const condition of phase.conditionalExecution) {
            if (!this.evaluateCondition(condition.condition)) {
                return condition.falseAction === 'continue';
            }
        }
        return true;
    }
    async executePhase(phase) {
        console.log(`⚙️ Executing workflow phase: ${phase.name}`);
        // Execute patterns in this phase
        for (const patternId of phase.patterns) {
            const pattern = globalPatternManager.getPattern(patternId);
            if (pattern) {
                await this.executePattern(pattern);
            }
        }
        this.executionState.completedPhases.push(phase.id);
    }
    async executePattern(pattern) {
        // This would integrate with the actual pattern execution engine
        console.log(`🎯 Executing pattern: ${pattern.name}`);
        // Implementation would depend on the pattern execution system
    }
    evaluateCondition(condition) {
        // Simple condition evaluation - in production, use a proper expression evaluator
        try {
            // Create a safe evaluation context
            const context = {
                data: Object.fromEntries(this.executionState.data),
                phase: this.executionState.currentPhase
            };
            // This is a simplified implementation - in production, use a secure evaluator
            return new Function('context', `with(context) { return ${condition}; }`)(context);
        }
        catch (error) {
            console.error('Error evaluating condition:', error);
            return false;
        }
    }
}
// Global advanced training manager instance
export const globalAdvancedTrainingManager = new AdvancedTrainingManager();
