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
exports.ContractDiscovery = void 0;
/**
 * Contract discovery and validation engine
 */
class ContractDiscovery {
    /**
     * Discover contracts from a web page
     */
    async discoverFromPage(page) {
        console.log(`🔍 Discovering contracts from: ${page.url()}`);
        const result = {
            contracts: [],
            discoveryMethod: 'meta-tags',
            url: page.url(),
            timestamp: new Date(),
            errors: [],
            warnings: []
        };
        try {
            // Try multiple discovery methods
            const contracts = await this.attemptDiscoveryMethods(page);
            result.contracts = contracts.contracts;
            result.discoveryMethod = contracts.method;
            if (result.contracts.length === 0) {
                result.warnings.push('No automation contracts found on this page');
            }
        }
        catch (error) {
            result.errors.push(`Contract discovery failed: ${error.message}`);
        }
        console.log(`📋 Found ${result.contracts.length} contracts using ${result.discoveryMethod}`);
        return result;
    }
    /**
     * Attempt multiple contract discovery methods
     */
    async attemptDiscoveryMethods(page) {
        // Method 1: Look for meta tags
        let contracts = await this.discoverFromMetaTags(page);
        if (contracts.length > 0) {
            return { contracts, method: 'meta-tags' };
        }
        // Method 2: Look for script declarations
        contracts = await this.discoverFromScriptDeclarations(page);
        if (contracts.length > 0) {
            return { contracts, method: 'script-declaration' };
        }
        // Method 3: Check for API endpoints
        contracts = await this.discoverFromApiEndpoint(page);
        if (contracts.length > 0) {
            return { contracts, method: 'api-endpoint' };
        }
        // Method 4: Generate basic contract from page analysis
        contracts = await this.generateBasicContract(page);
        return { contracts, method: 'implementation-file' };
    }
    /**
     * Discover contracts from meta tags
     */
    async discoverFromMetaTags(page) {
        console.log(`  📝 Checking meta tags for contracts...`);
        const metaContracts = await page.evaluate(() => {
            const contracts = [];
            // Look for Web-Buddy contract meta tags
            const contractMeta = document.querySelector('meta[name="web-buddy-contract"]');
            if (contractMeta) {
                const contractUrl = contractMeta.getAttribute('content');
                if (contractUrl) {
                    contracts.push({ url: contractUrl });
                }
            }
            // Look for embedded contract JSON
            const contractScript = document.querySelector('script[type="application/web-buddy-contract"]');
            if (contractScript && contractScript.textContent) {
                try {
                    const contract = JSON.parse(contractScript.textContent);
                    contracts.push(contract);
                }
                catch (e) {
                    console.warn('Failed to parse embedded contract JSON');
                }
            }
            return contracts;
        });
        const validContracts = [];
        for (const contractData of metaContracts) {
            if (contractData.url) {
                // Fetch contract from URL
                try {
                    const response = await page.request.get(contractData.url);
                    const contract = await response.json();
                    validContracts.push(contract);
                }
                catch (error) {
                    console.warn(`Failed to fetch contract from ${contractData.url}`);
                }
            }
            else if (contractData.domain) {
                // Direct contract object
                validContracts.push(contractData);
            }
        }
        return validContracts;
    }
    /**
     * Discover contracts from JavaScript declarations
     */
    async discoverFromScriptDeclarations(page) {
        console.log(`  📜 Checking script declarations for contracts...`);
        const scriptContracts = await page.evaluate(() => {
            const contracts = [];
            // Check for window.webBuddyContract
            if (window.webBuddyContract) {
                contracts.push(window.webBuddyContract);
            }
            // Check for window.webBuddyContracts array
            if (window.webBuddyContracts && Array.isArray(window.webBuddyContracts)) {
                contracts.push(...window.webBuddyContracts);
            }
            return contracts;
        });
        return scriptContracts.filter(contract => contract && contract.domain);
    }
    /**
     * Discover contracts from API endpoint
     */
    async discoverFromApiEndpoint(page) {
        console.log(`  🌐 Checking API endpoints for contracts...`);
        const baseUrl = new URL(page.url()).origin;
        const possibleEndpoints = [
            '/.well-known/web-buddy-contract.json',
            '/api/web-buddy-contract',
            '/web-buddy-contract.json',
            '/automation-contract.json'
        ];
        const contracts = [];
        for (const endpoint of possibleEndpoints) {
            try {
                const response = await page.request.get(baseUrl + endpoint);
                if (response.ok()) {
                    const contract = await response.json();
                    contracts.push(contract);
                    console.log(`  ✅ Found contract at: ${endpoint}`);
                }
            }
            catch (error) {
                // Endpoint doesn't exist, continue to next
            }
        }
        return contracts;
    }
    /**
     * Generate basic contract from page analysis
     */
    async generateBasicContract(page) {
        console.log(`  🔧 Generating basic contract from page analysis...`);
        const pageAnalysis = await page.evaluate(() => {
            const domain = window.location.hostname;
            const title = document.title;
            // Find interactive elements
            const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
            const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea'));
            const links = Array.from(document.querySelectorAll('a[href]'));
            return {
                domain,
                title,
                buttons: buttons.map(btn => ({
                    text: btn.textContent?.trim() || '',
                    id: btn.id || '',
                    className: btn.className || '',
                    type: btn.tagName.toLowerCase()
                })),
                inputs: inputs.map(input => ({
                    type: input.type || 'text',
                    placeholder: input.placeholder || '',
                    id: input.id || '',
                    name: input.name || ''
                })),
                links: links.map(link => ({
                    text: link.textContent?.trim() || '',
                    href: link.href || '',
                    id: link.id || ''
                }))
            };
        });
        // Generate contract from analysis
        const contract = {
            version: '1.0.0',
            domain: pageAnalysis.domain,
            title: `Generated contract for ${pageAnalysis.title}`,
            description: `Auto-generated contract from page analysis`,
            capabilities: {},
            metadata: {
                author: 'Web-Buddy Auto-Discovery',
                created: new Date().toISOString(),
                tags: ['auto-generated']
            }
        };
        // Add button capabilities
        pageAnalysis.buttons.forEach((button, index) => {
            if (button.text) {
                const capabilityName = this.generateCapabilityName(button.text);
                contract.capabilities[capabilityName] = {
                    type: 'action',
                    description: `Click ${button.text} button`,
                    selector: this.generateSelector(button),
                    timeout: 5000
                };
            }
        });
        // Add input capabilities
        pageAnalysis.inputs.forEach((input, index) => {
            const capabilityName = this.generateCapabilityName(input.placeholder || input.name || `input${index}`);
            contract.capabilities[capabilityName] = {
                type: 'form',
                description: `Fill ${input.placeholder || input.name || 'input'} field`,
                selector: this.generateSelector(input),
                parameters: [{
                        name: 'value',
                        type: 'string',
                        description: 'Value to enter in the field',
                        required: true
                    }]
            };
        });
        console.log(`  📝 Generated contract with ${Object.keys(contract.capabilities).length} capabilities`);
        return [contract];
    }
    /**
     * Generate capability name from text
     */
    generateCapabilityName(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            || 'unknown_capability';
    }
    /**
     * Generate selector for element
     */
    generateSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }
        if (element.name) {
            return `[name="${element.name}"]`;
        }
        if (element.text) {
            return `[text*="${element.text}"]`;
        }
        if (element.className) {
            const firstClass = element.className.split(' ')[0];
            return `.${firstClass}`;
        }
        return element.type;
    }
    /**
     * Validate a contract
     */
    validateContract(contract) {
        console.log(`✅ Validating contract: ${contract.title}`);
        const result = {
            isValid: true,
            contract,
            errors: [],
            warnings: [],
            score: 100
        };
        // Validate required fields
        this.validateRequiredFields(contract, result);
        // Validate capabilities
        this.validateCapabilities(contract, result);
        // Validate selectors
        this.validateSelectors(contract, result);
        // Calculate final score
        result.score = this.calculateScore(result);
        result.isValid = result.errors.length === 0;
        console.log(`📊 Contract validation complete: ${result.isValid ? 'VALID' : 'INVALID'} (Score: ${result.score}/100)`);
        return result;
    }
    /**
     * Validate required contract fields
     */
    validateRequiredFields(contract, result) {
        const requiredFields = ['version', 'domain', 'title', 'capabilities'];
        for (const field of requiredFields) {
            if (!contract[field]) {
                result.errors.push({
                    field,
                    message: `Required field '${field}' is missing`,
                    severity: 'error'
                });
            }
        }
        // Validate version format
        if (contract.version && !/^\d+\.\d+\.\d+$/.test(contract.version)) {
            result.warnings.push({
                field: 'version',
                message: 'Version should follow semantic versioning (e.g., 1.0.0)',
                suggestion: 'Use format: major.minor.patch'
            });
        }
        // Validate domain format
        if (contract.domain && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(contract.domain)) {
            result.warnings.push({
                field: 'domain',
                message: 'Domain should be a valid hostname',
                suggestion: 'Use format: example.com'
            });
        }
    }
    /**
     * Validate contract capabilities
     */
    validateCapabilities(contract, result) {
        if (!contract.capabilities || Object.keys(contract.capabilities).length === 0) {
            result.errors.push({
                field: 'capabilities',
                message: 'Contract must have at least one capability',
                severity: 'error'
            });
            return;
        }
        for (const [name, capability] of Object.entries(contract.capabilities)) {
            this.validateCapability(name, capability, result);
        }
    }
    /**
     * Validate individual capability
     */
    validateCapability(name, capability, result) {
        const requiredFields = ['type', 'description', 'selector'];
        for (const field of requiredFields) {
            if (!capability[field]) {
                result.errors.push({
                    field: `capabilities.${name}.${field}`,
                    message: `Capability '${name}' is missing required field '${field}'`,
                    severity: 'error'
                });
            }
        }
        // Validate capability type
        const validTypes = ['action', 'query', 'navigation', 'form', 'file', 'wait'];
        if (capability.type && !validTypes.includes(capability.type)) {
            result.errors.push({
                field: `capabilities.${name}.type`,
                message: `Invalid capability type '${capability.type}'. Must be one of: ${validTypes.join(', ')}`,
                severity: 'error'
            });
        }
    }
    /**
     * Validate selectors
     */
    validateSelectors(contract, result) {
        for (const [name, capability] of Object.entries(contract.capabilities)) {
            if (typeof capability.selector === 'string') {
                this.validateSelector(name, capability.selector, result);
            }
        }
    }
    /**
     * Validate individual selector
     */
    validateSelector(capabilityName, selector, result) {
        // Basic selector validation
        if (!selector || selector.trim().length === 0) {
            result.errors.push({
                field: `capabilities.${capabilityName}.selector`,
                message: 'Selector cannot be empty',
                severity: 'error'
            });
            return;
        }
        // Check for overly specific selectors
        if (selector.includes('nth-child') || selector.includes('nth-of-type')) {
            result.warnings.push({
                field: `capabilities.${capabilityName}.selector`,
                message: 'Selector uses position-based selectors which may be brittle',
                suggestion: 'Consider using semantic selectors or data attributes'
            });
        }
        // Check for CSS class selectors that look auto-generated
        if (/\.[a-z0-9]{8,}/.test(selector)) {
            result.warnings.push({
                field: `capabilities.${capabilityName}.selector`,
                message: 'Selector appears to use auto-generated CSS classes',
                suggestion: 'Consider using stable data attributes or semantic selectors'
            });
        }
    }
    /**
     * Calculate contract quality score
     */
    calculateScore(result) {
        let score = 100;
        // Deduct points for errors and warnings
        score -= result.errors.length * 20;
        score -= result.warnings.length * 5;
        // Bonus points for good practices
        if (result.contract.metadata?.description)
            score += 5;
        if (result.contract.context?.urlPatterns)
            score += 5;
        if (result.contract.workflows)
            score += 10;
        return Math.max(0, Math.min(100, score));
    }
}
exports.ContractDiscovery = ContractDiscovery;
//# sourceMappingURL=contract-discovery.js.map