/**
 * @fileoverview Contract Validator
 * @description Validation logic for Web-Buddy automation contracts
 */

import {
  WebBuddyContract,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  AutomationCapability,
  SelectorDefinition,
  ParameterDefinition
} from './types/contract-types';

/**
 * Validator for Web-Buddy contracts
 */
export class ContractValidator {
  /**
   * Validate a complete contract
   */
  public validate(contract: WebBuddyContract): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate basic contract structure
    this.validateBasicStructure(contract, errors);

    // Validate capabilities
    this.validateCapabilities(contract, errors, warnings);

    // Validate selectors
    this.validateSelectors(contract, errors, warnings);

    // Validate workflows
    this.validateWorkflows(contract, errors, warnings);

    // Validate context conditions
    this.validateContext(contract, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate contract against current page
   */
  public validateAgainstPage(contract: WebBuddyContract): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if contract applies to current page
    if (!this.contractAppliesTo(contract, window.location.href, document.title)) {
      warnings.push({
        path: 'context',
        message: 'Contract may not apply to current page',
        code: 'CONTEXT_MISMATCH'
      });
    }

    // Validate selectors exist on page
    this.validateSelectorsOnPage(contract, errors, warnings);

    // Check prerequisites
    this.validatePrerequisites(contract, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate basic contract structure
   */
  private validateBasicStructure(contract: WebBuddyContract, errors: ValidationError[]): void {
    if (!contract.version) {
      errors.push({
        path: 'version',
        message: 'Version is required',
        code: 'MISSING_VERSION'
      });
    } else if (!contract.version.match(/^\d+\.\d+\.\d+$/)) {
      errors.push({
        path: 'version',
        message: 'Version must follow semantic versioning (x.y.z)',
        code: 'INVALID_VERSION_FORMAT'
      });
    }

    if (!contract.domain) {
      errors.push({
        path: 'domain',
        message: 'Domain is required',
        code: 'MISSING_DOMAIN'
      });
    } else if (!this.isValidDomain(contract.domain)) {
      errors.push({
        path: 'domain',
        message: 'Invalid domain format',
        code: 'INVALID_DOMAIN'
      });
    }

    if (!contract.title || contract.title.trim().length === 0) {
      errors.push({
        path: 'title',
        message: 'Title is required',
        code: 'MISSING_TITLE'
      });
    }

    if (!contract.capabilities || Object.keys(contract.capabilities).length === 0) {
      errors.push({
        path: 'capabilities',
        message: 'At least one capability is required',
        code: 'NO_CAPABILITIES'
      });
    }
  }

  /**
   * Validate capabilities
   */
  private validateCapabilities(
    contract: WebBuddyContract,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const [name, capability] of Object.entries(contract.capabilities)) {
      this.validateCapability(name, capability, errors, warnings);
    }
  }

  /**
   * Validate a single capability
   */
  private validateCapability(
    name: string,
    capability: AutomationCapability,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const basePath = `capabilities.${name}`;

    if (!capability.type) {
      errors.push({
        path: `${basePath}.type`,
        message: 'Capability type is required',
        code: 'MISSING_CAPABILITY_TYPE'
      });
    }

    if (!capability.description || capability.description.trim().length === 0) {
      errors.push({
        path: `${basePath}.description`,
        message: 'Capability description is required',
        code: 'MISSING_CAPABILITY_DESCRIPTION'
      });
    }

    if (!capability.selector) {
      errors.push({
        path: `${basePath}.selector`,
        message: 'Capability selector is required',
        code: 'MISSING_CAPABILITY_SELECTOR'
      });
    } else if (typeof capability.selector === 'string') {
      this.validateSelectorString(capability.selector, `${basePath}.selector`, errors, warnings);
    } else {
      this.validateSelectorDefinition(capability.selector, `${basePath}.selector`, errors, warnings);
    }

    // Validate parameters
    if (capability.parameters) {
      capability.parameters.forEach((param, index) => {
        this.validateParameter(param, `${basePath}.parameters[${index}]`, errors, warnings);
      });
    }

    // Validate timeout
    if (capability.timeout !== undefined && (capability.timeout < 100 || capability.timeout > 60000)) {
      warnings.push({
        path: `${basePath}.timeout`,
        message: 'Timeout should be between 100ms and 60s for optimal performance',
        code: 'TIMEOUT_OUT_OF_RANGE'
      });
    }

    // Validate retries
    if (capability.retries !== undefined && capability.retries > 5) {
      warnings.push({
        path: `${basePath}.retries`,
        message: 'More than 5 retries may cause poor user experience',
        code: 'EXCESSIVE_RETRIES'
      });
    }
  }

  /**
   * Validate a parameter definition
   */
  private validateParameter(
    param: ParameterDefinition,
    basePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!param.name || !param.name.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
      errors.push({
        path: `${basePath}.name`,
        message: 'Parameter name must be a valid identifier',
        code: 'INVALID_PARAMETER_NAME'
      });
    }

    if (!param.type) {
      errors.push({
        path: `${basePath}.type`,
        message: 'Parameter type is required',
        code: 'MISSING_PARAMETER_TYPE'
      });
    }

    // Validate parameter constraints
    if (param.validation) {
      if (param.type === 'string') {
        if (param.validation.minLength !== undefined && param.validation.minLength < 0) {
          errors.push({
            path: `${basePath}.validation.minLength`,
            message: 'minLength cannot be negative',
            code: 'INVALID_MIN_LENGTH'
          });
        }
        if (param.validation.maxLength !== undefined && param.validation.maxLength < 0) {
          errors.push({
            path: `${basePath}.validation.maxLength`,
            message: 'maxLength cannot be negative',
            code: 'INVALID_MAX_LENGTH'
          });
        }
        if (param.validation.minLength !== undefined && 
            param.validation.maxLength !== undefined && 
            param.validation.minLength > param.validation.maxLength) {
          errors.push({
            path: `${basePath}.validation`,
            message: 'minLength cannot be greater than maxLength',
            code: 'INVALID_LENGTH_RANGE'
          });
        }
      }
    }
  }

  /**
   * Validate selectors
   */
  private validateSelectors(
    contract: WebBuddyContract,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (contract.selectors) {
      for (const [name, selector] of Object.entries(contract.selectors)) {
        this.validateSelectorDefinition(selector, `selectors.${name}`, errors, warnings);
      }
    }
  }

  /**
   * Validate a selector definition
   */
  private validateSelectorDefinition(
    selector: SelectorDefinition,
    basePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!selector.primary || selector.primary.trim().length === 0) {
      errors.push({
        path: `${basePath}.primary`,
        message: 'Primary selector is required',
        code: 'MISSING_PRIMARY_SELECTOR'
      });
    } else {
      this.validateSelectorString(selector.primary, `${basePath}.primary`, errors, warnings);
    }

    if (selector.fallback) {
      selector.fallback.forEach((fallbackSelector, index) => {
        this.validateSelectorString(fallbackSelector, `${basePath}.fallback[${index}]`, errors, warnings);
      });
    }
  }

  /**
   * Validate a CSS selector string
   */
  private validateSelectorString(
    selector: string,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    try {
      document.querySelector(selector);
    } catch (error) {
      errors.push({
        path,
        message: `Invalid CSS selector: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'INVALID_CSS_SELECTOR'
      });
      return;
    }

    // Warn about potentially fragile selectors
    if (selector.includes('nth-child') || selector.includes('nth-of-type')) {
      warnings.push({
        path,
        message: 'nth-child and nth-of-type selectors may be fragile',
        code: 'FRAGILE_SELECTOR'
      });
    }

    if (selector.includes(' > ') && selector.split(' > ').length > 3) {
      warnings.push({
        path,
        message: 'Deep child selectors may be fragile',
        code: 'DEEP_SELECTOR'
      });
    }
  }

  /**
   * Validate workflows
   */
  private validateWorkflows(
    contract: WebBuddyContract,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!contract.workflows) return;

    for (const [name, workflow] of Object.entries(contract.workflows)) {
      const basePath = `workflows.${name}`;

      if (!workflow.description) {
        errors.push({
          path: `${basePath}.description`,
          message: 'Workflow description is required',
          code: 'MISSING_WORKFLOW_DESCRIPTION'
        });
      }

      if (!workflow.steps || workflow.steps.length === 0) {
        errors.push({
          path: `${basePath}.steps`,
          message: 'Workflow must have at least one step',
          code: 'EMPTY_WORKFLOW'
        });
      }

      // Validate that all referenced capabilities exist
      workflow.steps.forEach((step, index) => {
        if (!contract.capabilities[step.capability]) {
          errors.push({
            path: `${basePath}.steps[${index}].capability`,
            message: `Referenced capability '${step.capability}' does not exist`,
            code: 'UNKNOWN_CAPABILITY'
          });
        }
      });
    }
  }

  /**
   * Validate context conditions
   */
  private validateContext(
    contract: WebBuddyContract,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!contract.context) return;

    const context = contract.context;

    // Validate URL patterns
    if (context.urlPatterns) {
      context.urlPatterns.forEach((pattern, index) => {
        try {
          if (pattern.includes('*')) {
            // Convert glob pattern to regex for validation
            new RegExp(pattern.replace(/\*/g, '.*'));
          } else {
            new URL(pattern);
          }
        } catch (error) {
          errors.push({
            path: `context.urlPatterns[${index}]`,
            message: 'Invalid URL pattern',
            code: 'INVALID_URL_PATTERN'
          });
        }
      });
    }

    // Validate prerequisites
    if (context.prerequisites) {
      context.prerequisites.forEach((prereq, index) => {
        if (!prereq.description) {
          errors.push({
            path: `context.prerequisites[${index}].description`,
            message: 'Prerequisite description is required',
            code: 'MISSING_PREREQUISITE_DESCRIPTION'
          });
        }

        if (prereq.type === 'element' && !prereq.selector) {
          errors.push({
            path: `context.prerequisites[${index}].selector`,
            message: 'Element prerequisite requires a selector',
            code: 'MISSING_PREREQUISITE_SELECTOR'
          });
        }
      });
    }
  }

  /**
   * Validate selectors against current page
   */
  private validateSelectorsOnPage(
    contract: WebBuddyContract,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const [name, capability] of Object.entries(contract.capabilities)) {
      const selector = typeof capability.selector === 'string' 
        ? capability.selector 
        : capability.selector.primary;

      try {
        const element = document.querySelector(selector);
        if (!element) {
          warnings.push({
            path: `capabilities.${name}.selector`,
            message: 'Selector does not match any elements on current page',
            code: 'SELECTOR_NOT_FOUND'
          });
        }
      } catch (error) {
        // Selector validation already handled in basic validation
      }
    }
  }

  /**
   * Validate prerequisites against current page
   */
  private validatePrerequisites(
    contract: WebBuddyContract,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!contract.context?.prerequisites) return;

    contract.context.prerequisites.forEach((prereq, index) => {
      const basePath = `context.prerequisites[${index}]`;

      switch (prereq.type) {
        case 'element':
          if (prereq.selector) {
            try {
              const element = document.querySelector(prereq.selector);
              if (!element && prereq.required !== false) {
                errors.push({
                  path: basePath,
                  message: `Required prerequisite element not found: ${prereq.description}`,
                  code: 'PREREQUISITE_NOT_MET'
                });
              }
            } catch (error) {
              errors.push({
                path: `${basePath}.selector`,
                message: 'Invalid prerequisite selector',
                code: 'INVALID_PREREQUISITE_SELECTOR'
              });
            }
          }
          break;

        case 'authentication':
          // Could check for authentication tokens, user menus, etc.
          warnings.push({
            path: basePath,
            message: 'Authentication prerequisite cannot be automatically validated',
            code: 'UNVALIDATABLE_PREREQUISITE'
          });
          break;
      }
    });
  }

  /**
   * Check if contract applies to current URL and title
   */
  private contractAppliesTo(contract: WebBuddyContract, url: string, title: string): boolean {
    if (!contract.context) return true;

    // Check URL patterns
    if (contract.context.urlPatterns) {
      const urlMatches = contract.context.urlPatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(url);
        }
        return url.includes(pattern);
      });

      if (!urlMatches) return false;
    }

    // Check title patterns
    if (contract.context.titlePatterns) {
      const titleMatches = contract.context.titlePatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(title);
        }
        return title.includes(pattern);
      });

      if (!titleMatches) return false;
    }

    return true;
  }

  /**
   * Validate domain format
   */
  private isValidDomain(domain: string): boolean {
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    return domainRegex.test(domain) || domain.includes('*'); // Allow wildcards
  }
}