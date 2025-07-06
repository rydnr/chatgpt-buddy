/**
 * @fileoverview Contract-to-SDK Generator for Web Application Contracts
 * @description Generates TypeScript and Python client SDKs from contract specifications
 * @author Web-Buddy Team
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import Handlebars from 'handlebars';
import { JSONSchema7 } from 'json-schema';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export interface ContractInfo {
  name: string;
  version: string;
  description: string;
  url: string;
  domains: string[];
}

export interface ContractElement {
  selectors: string[];
  description: string;
  actions: string[];
  required: boolean;
  data?: Record<string, string>;
}

export interface WorkflowStep {
  action: string;
  target: string;
  value?: string;
  wait?: string;
  condition?: string;
}

export interface ContractWorkflow {
  description: string;
  parameters?: Record<string, {
    type: string;
    required: boolean;
    description: string;
    default?: any;
  }>;
  steps: WorkflowStep[];
}

export interface ContractEvent {
  description: string;
  selector: string;
  data: Record<string, string>;
  condition?: string;
}

export interface WebApplicationContract {
  $schema: string;
  info: ContractInfo;
  capabilities: Record<string, {
    type: string;
    description: string;
  }>;
  elements: Record<string, ContractElement>;
  workflows: Record<string, ContractWorkflow>;
  events: Record<string, ContractEvent>;
  extends?: string[];
}

export interface GeneratorOptions {
  outputDir: string;
  languages: ('typescript' | 'python')[];
  templateDir?: string;
  packageName?: string;
  validation?: {
    strict: boolean;
    allowUndefinedElements: boolean;
    validateSelectors: boolean;
  };
  typescript?: {
    moduleFormat: 'esm' | 'cjs';
    target: string;
    generateTests: boolean;
    generateDocs: boolean;
  };
  python?: {
    pythonVersion: string;
    generateTests: boolean;
    generateDocs: boolean;
  };
}

export interface GenerationResult {
  outputPaths: string[];
  contractName: string;
  generatedFiles: string[];
  errors: string[];
  warnings: string[];
}

export class ContractSDKGenerator {
  private options: GeneratorOptions;
  private ajv: Ajv;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(options: GeneratorOptions) {
    this.options = {
      validation: {
        strict: true,
        allowUndefinedElements: false,
        validateSelectors: true,
      },
      typescript: {
        moduleFormat: 'esm',
        target: 'ES2020',
        generateTests: true,
        generateDocs: true,
      },
      python: {
        pythonVersion: '3.8+',
        generateTests: true,
        generateDocs: true,
      },
      ...options,
    };

    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
    
    this.setupHandlebarsHelpers();
  }

  /**
   * Generate SDK from a contract file
   */
  async generateFromContract(contractPath: string): Promise<GenerationResult> {
    const contract = await this.loadContract(contractPath);
    const contractName = this.getContractName(contract);
    
    const result: GenerationResult = {
      outputPaths: [],
      contractName,
      generatedFiles: [],
      errors: [],
      warnings: [],
    };

    try {
      // Validate contract
      this.validateContract(contract);

      // Load templates
      await this.loadTemplates();

      // Generate for each language
      for (const language of this.options.languages) {
        const languageResult = await this.generateForLanguage(contract, language);
        result.outputPaths.push(...languageResult.outputPaths);
        result.generatedFiles.push(...languageResult.generatedFiles);
        result.errors.push(...languageResult.errors);
        result.warnings.push(...languageResult.warnings);
      }

    } catch (error) {
      result.errors.push(`Generation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Generate SDK for multiple contracts
   */
  async generateFromContracts(contractPaths: string[]): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];
    
    for (const contractPath of contractPaths) {
      const result = await this.generateFromContract(contractPath);
      results.push(result);
    }

    return results;
  }

  /**
   * Load and parse contract file
   */
  private async loadContract(contractPath: string): Promise<WebApplicationContract> {
    try {
      const content = await fs.readFile(contractPath, 'utf8');
      const contract = JSON.parse(content) as WebApplicationContract;
      
      // Handle contract inheritance
      if (contract.extends) {
        return await this.resolveContractInheritance(contract, contractPath);
      }
      
      return contract;
    } catch (error) {
      throw new Error(`Failed to load contract ${contractPath}: ${error.message}`);
    }
  }

  /**
   * Resolve contract inheritance and composition
   */
  private async resolveContractInheritance(
    contract: WebApplicationContract,
    basePath: string
  ): Promise<WebApplicationContract> {
    const baseDir = path.dirname(basePath);
    const resolvedContract = { ...contract };

    for (const extendPath of contract.extends || []) {
      const fullPath = path.resolve(baseDir, extendPath);
      const parentContract = await this.loadContract(fullPath);
      
      // Merge parent contract properties
      resolvedContract.elements = { ...parentContract.elements, ...resolvedContract.elements };
      resolvedContract.workflows = { ...parentContract.workflows, ...resolvedContract.workflows };
      resolvedContract.events = { ...parentContract.events, ...resolvedContract.events };
      resolvedContract.capabilities = { ...parentContract.capabilities, ...resolvedContract.capabilities };
    }

    // Remove extends property from resolved contract
    delete resolvedContract.extends;
    
    return resolvedContract;
  }

  /**
   * Validate contract against schema
   */
  private validateContract(contract: WebApplicationContract): void {
    // Basic structure validation
    if (!contract.info || !contract.info.name) {
      throw new Error('Contract must have info.name');
    }

    if (!contract.elements || Object.keys(contract.elements).length === 0) {
      throw new Error('Contract must define at least one element');
    }

    // Validate workflows reference existing elements
    for (const [workflowName, workflow] of Object.entries(contract.workflows || {})) {
      for (const step of workflow.steps) {
        if (step.target && !contract.elements[step.target]) {
          if (this.options.validation?.strict) {
            throw new Error(`Workflow ${workflowName} references undefined element: ${step.target}`);
          }
        }
      }
    }

    // Validate selectors if enabled
    if (this.options.validation?.validateSelectors) {
      for (const [elementName, element] of Object.entries(contract.elements)) {
        if (!element.selectors || element.selectors.length === 0) {
          throw new Error(`Element ${elementName} must have at least one selector`);
        }
      }
    }
  }

  /**
   * Generate SDK for a specific language
   */
  private async generateForLanguage(
    contract: WebApplicationContract,
    language: 'typescript' | 'python'
  ): Promise<GenerationResult> {
    const contractName = this.getContractName(contract);
    const outputDir = path.join(this.options.outputDir, language);
    
    await fs.mkdir(outputDir, { recursive: true });

    const result: GenerationResult = {
      outputPaths: [outputDir],
      contractName,
      generatedFiles: [],
      errors: [],
      warnings: [],
    };

    try {
      if (language === 'typescript') {
        await this.generateTypeScriptSDK(contract, outputDir, result);
      } else if (language === 'python') {
        await this.generatePythonSDK(contract, outputDir, result);
      }
    } catch (error) {
      result.errors.push(`${language} generation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Generate TypeScript SDK
   */
  private async generateTypeScriptSDK(
    contract: WebApplicationContract,
    outputDir: string,
    result: GenerationResult
  ): Promise<void> {
    const contractName = this.getContractName(contract);
    const context = this.createTemplateContext(contract, 'typescript');

    // Generate main client file
    const clientContent = this.renderTemplate('typescript/client', context);
    const clientPath = path.join(outputDir, `${this.kebabCase(contractName)}-client.ts`);
    await fs.writeFile(clientPath, clientContent);
    result.generatedFiles.push(clientPath);

    // Generate contract definition
    const contractContent = this.renderTemplate('typescript/contract', context);
    const contractPath = path.join(outputDir, `${this.kebabCase(contractName)}-contract.ts`);
    await fs.writeFile(contractPath, contractContent);
    result.generatedFiles.push(contractPath);

    // Generate type definitions
    const typesContent = this.renderTemplate('typescript/types', context);
    const typesPath = path.join(outputDir, 'types.ts');
    await fs.writeFile(typesPath, typesContent);
    result.generatedFiles.push(typesPath);

    // Generate index file
    const indexContent = this.renderTemplate('typescript/index', context);
    const indexPath = path.join(outputDir, 'index.ts');
    await fs.writeFile(indexPath, indexContent);
    result.generatedFiles.push(indexPath);

    // Generate package.json
    const packageContent = this.renderTemplate('typescript/package', context);
    const packagePath = path.join(outputDir, 'package.json');
    await fs.writeFile(packagePath, packageContent);
    result.generatedFiles.push(packagePath);

    // Generate tests if enabled
    if (this.options.typescript?.generateTests) {
      const testContent = this.renderTemplate('typescript/test', context);
      const testPath = path.join(outputDir, `${this.kebabCase(contractName)}-client.test.ts`);
      await fs.writeFile(testPath, testContent);
      result.generatedFiles.push(testPath);
    }

    // Generate documentation if enabled
    if (this.options.typescript?.generateDocs) {
      const docsContent = this.renderTemplate('typescript/docs', context);
      const docsPath = path.join(outputDir, 'README.md');
      await fs.writeFile(docsPath, docsContent);
      result.generatedFiles.push(docsPath);
    }
  }

  /**
   * Generate Python SDK
   */
  private async generatePythonSDK(
    contract: WebApplicationContract,
    outputDir: string,
    result: GenerationResult
  ): Promise<void> {
    const contractName = this.getContractName(contract);
    const context = this.createTemplateContext(contract, 'python');

    // Generate main client file
    const clientContent = this.renderTemplate('python/client', context);
    const clientPath = path.join(outputDir, `${this.snakeCase(contractName)}_client.py`);
    await fs.writeFile(clientPath, clientContent);
    result.generatedFiles.push(clientPath);

    // Generate contract definition
    const contractContent = this.renderTemplate('python/contract', context);
    const contractPath = path.join(outputDir, `${this.snakeCase(contractName)}_contract.py`);
    await fs.writeFile(contractPath, contractContent);
    result.generatedFiles.push(contractPath);

    // Generate models
    const modelsContent = this.renderTemplate('python/models', context);
    const modelsPath = path.join(outputDir, 'models.py');
    await fs.writeFile(modelsPath, modelsContent);
    result.generatedFiles.push(modelsPath);

    // Generate __init__.py
    const initContent = this.renderTemplate('python/init', context);
    const initPath = path.join(outputDir, '__init__.py');
    await fs.writeFile(initPath, initContent);
    result.generatedFiles.push(initPath);

    // Generate setup.py
    const setupContent = this.renderTemplate('python/setup', context);
    const setupPath = path.join(outputDir, 'setup.py');
    await fs.writeFile(setupPath, setupContent);
    result.generatedFiles.push(setupPath);

    // Generate tests if enabled
    if (this.options.python?.generateTests) {
      const testContent = this.renderTemplate('python/test', context);
      const testDir = path.join(outputDir, 'tests');
      await fs.mkdir(testDir, { recursive: true });
      const testPath = path.join(testDir, `test_${this.snakeCase(contractName)}_client.py`);
      await fs.writeFile(testPath, testContent);
      result.generatedFiles.push(testPath);
    }

    // Generate documentation if enabled
    if (this.options.python?.generateDocs) {
      const docsContent = this.renderTemplate('python/docs', context);
      const docsPath = path.join(outputDir, 'README.md');
      await fs.writeFile(docsPath, docsContent);
      result.generatedFiles.push(docsPath);
    }
  }

  /**
   * Create template context for rendering
   */
  private createTemplateContext(contract: WebApplicationContract, language: string): any {
    const contractName = this.getContractName(contract);
    
    return {
      contract,
      contractName,
      contractNameKebab: this.kebabCase(contractName),
      contractNameSnake: this.snakeCase(contractName),
      contractNameCamel: this.camelCase(contractName),
      contractNamePascal: this.pascalCase(contractName),
      language,
      options: this.options,
      timestamp: new Date().toISOString(),
      elements: this.processElements(contract.elements),
      workflows: this.processWorkflows(contract.workflows || {}),
      events: this.processEvents(contract.events || {}),
      capabilities: contract.capabilities || {},
    };
  }

  /**
   * Process elements for template rendering
   */
  private processElements(elements: Record<string, ContractElement>): any[] {
    return Object.entries(elements).map(([name, element]) => ({
      name,
      ...element,
      nameKebab: this.kebabCase(name),
      nameSnake: this.snakeCase(name),
      nameCamel: this.camelCase(name),
      namePascal: this.pascalCase(name),
    }));
  }

  /**
   * Process workflows for template rendering
   */
  private processWorkflows(workflows: Record<string, ContractWorkflow>): any[] {
    return Object.entries(workflows).map(([name, workflow]) => ({
      name,
      ...workflow,
      nameKebab: this.kebabCase(name),
      nameSnake: this.snakeCase(name),
      nameCamel: this.camelCase(name),
      namePascal: this.pascalCase(name),
      parametersArray: Object.entries(workflow.parameters || {}).map(([paramName, param]) => ({
        name: paramName,
        ...param,
      })),
    }));
  }

  /**
   * Process events for template rendering
   */
  private processEvents(events: Record<string, ContractEvent>): any[] {
    return Object.entries(events).map(([name, event]) => ({
      name,
      ...event,
      nameKebab: this.kebabCase(name),
      nameSnake: this.snakeCase(name),
      nameCamel: this.camelCase(name),
      namePascal: this.pascalCase(name),
    }));
  }

  /**
   * Load Handlebars templates
   */
  private async loadTemplates(): Promise<void> {
    const templateDir = this.options.templateDir || path.join(__dirname, '../templates');
    
    try {
      // Load TypeScript templates
      if (this.options.languages.includes('typescript')) {
        await this.loadLanguageTemplates(templateDir, 'typescript');
      }
      
      // Load Python templates
      if (this.options.languages.includes('python')) {
        await this.loadLanguageTemplates(templateDir, 'python');
      }
    } catch (error) {
      // Use built-in templates if custom templates fail
      this.loadBuiltinTemplates();
    }
  }

  /**
   * Load templates for a specific language
   */
  private async loadLanguageTemplates(templateDir: string, language: string): Promise<void> {
    const langDir = path.join(templateDir, language);
    
    try {
      const files = await fs.readdir(langDir);
      
      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const templateName = `${language}/${file.replace('.hbs', '')}`;
          const templatePath = path.join(langDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          this.templates.set(templateName, Handlebars.compile(templateContent));
        }
      }
    } catch (error) {
      throw new Error(`Failed to load ${language} templates: ${error.message}`);
    }
  }

  /**
   * Load built-in templates
   */
  private loadBuiltinTemplates(): void {
    // Built-in TypeScript client template
    this.templates.set('typescript/client', Handlebars.compile(`
{{> header}}

import { ContractClient, WebBuddyClientOptions } from '@web-buddy/core';
import { {{contractNamePascal}}Contract } from './{{contractNameKebab}}-contract';
{{#each workflows}}
import { {{namePascal}}Options } from './types';
{{/each}}
{{#each events}}
import { {{namePascal}}Event } from './types';
{{/each}}

export class {{contractNamePascal}}Client extends ContractClient<{{contractNamePascal}}Contract> {
  constructor(options: WebBuddyClientOptions = {}) {
    super({
      contract: {{contractNamePascal}}Contract,
      baseUrl: '{{contract.info.url}}',
      ...options
    });
  }

  {{#each workflows}}
  /**
   * {{description}}
   */
  async {{nameCamel}}({{#if parametersArray}}options: {{namePascal}}Options{{/if}}): Promise<any> {
    {{#if parametersArray}}
    return await this.executeWorkflow('{{name}}', {
      {{#each parametersArray}}
      {{name}}: options.{{name}},
      {{/each}}
    });
    {{else}}
    return await this.executeWorkflow('{{name}}');
    {{/if}}
  }
  {{/each}}

  {{#each events}}
  /**
   * Listen for {{description}}
   */
  on{{namePascal}}(callback: (event: {{namePascal}}Event) => void): () => void {
    return this.addEventListener('{{name}}', callback);
  }
  {{/each}}
}
`));

    // Built-in Python client template
    this.templates.set('python/client', Handlebars.compile(`
"""{{contractNamePascal}} client for web automation"""

from typing import Optional, Callable
from web_buddy import ContractClient, WebBuddyClientOptions
from .{{contractNameSnake}}_contract import {{contractNamePascal}}Contract
{{#each workflows}}
from .models import {{namePascal}}Options
{{/each}}
{{#each events}}
from .models import {{namePascal}}Event
{{/each}}

class {{contractNamePascal}}Client(ContractClient[{{contractNamePascal}}Contract]):
    """
    Client for {{contract.info.description}}
    """
    
    def __init__(self, options: Optional[WebBuddyClientOptions] = None):
        super().__init__(
            contract={{contractNamePascal}}Contract,
            base_url='{{contract.info.url}}',
            **(options or {})
        )
    
    {{#each workflows}}
    async def {{nameSnake}}(self{{#if parametersArray}}, options: {{namePascal}}Options{{/if}}) -> any:
        """{{description}}"""
        {{#if parametersArray}}
        return await self.execute_workflow('{{name}}', {
            {{#each parametersArray}}
            '{{name}}': options.{{name}},
            {{/each}}
        })
        {{else}}
        return await self.execute_workflow('{{name}}')
        {{/if}}
    
    {{/each}}

    {{#each events}}
    def on_{{nameSnake}}(self, callback: Callable[[{{namePascal}}Event], None]) -> Callable:
        """Listen for {{description}}"""
        return self.add_event_listener('{{name}}', callback)
    
    {{/each}}
`));

    // Add other built-in templates...
    this.addBuiltinTypeTemplates();
    this.addBuiltinContractTemplates();
  }

  /**
   * Add built-in type templates
   */
  private addBuiltinTypeTemplates(): void {
    // TypeScript types template
    this.templates.set('typescript/types', Handlebars.compile(`
{{> header}}

{{#each workflows}}
{{#if parametersArray}}
export interface {{namePascal}}Options {
  {{#each parametersArray}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
  {{/each}}
}
{{/if}}
{{/each}}

{{#each events}}
export interface {{namePascal}}Event {
  {{#each data}}
  {{@key}}: string;
  {{/each}}
}
{{/each}}
`));

    // Python models template
    this.templates.set('python/models', Handlebars.compile(`
"""Type definitions for {{contractNamePascal}} client"""

from typing import Optional
from pydantic import BaseModel

{{#each workflows}}
{{#if parametersArray}}
class {{namePascal}}Options(BaseModel):
    """Options for {{description}}"""
    {{#each parametersArray}}
    {{name}}: {{#unless required}}Optional[{{/unless}}{{type}}{{#unless required}}] = None{{/unless}}
    {{/each}}

{{/if}}
{{/each}}

{{#each events}}
class {{namePascal}}Event(BaseModel):
    """Event: {{description}}"""
    {{#each data}}
    {{@key}}: str
    {{/each}}

{{/each}}
`));
  }

  /**
   * Add built-in contract templates
   */
  private addBuiltinContractTemplates(): void {
    // Contract definition templates would go here
    this.templates.set('typescript/contract', Handlebars.compile(`
{{> header}}

import { WebApplicationContract } from '@web-buddy/core';

export const {{contractNamePascal}}Contract: WebApplicationContract = {
  info: {
    name: '{{contract.info.name}}',
    version: '{{contract.info.version}}',
    description: '{{contract.info.description}}',
    url: '{{contract.info.url}}',
    domains: [{{#each contract.info.domains}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}]
  },
  elements: {
    {{#each elements}}
    {{name}}: {
      selectors: [{{#each selectors}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}],
      description: '{{description}}',
      actions: [{{#each actions}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}],
      required: {{required}}
    }{{#unless @last}},{{/unless}}
    {{/each}}
  },
  workflows: {
    {{#each workflows}}
    {{name}}: {
      description: '{{description}}',
      {{#if parametersArray}}
      parameters: {
        {{#each parametersArray}}
        {{name}}: {
          type: '{{type}}',
          required: {{required}},
          description: '{{description}}'
        }{{#unless @last}},{{/unless}}
        {{/each}}
      },
      {{/if}}
      steps: [
        {{#each steps}}
        {
          action: '{{action}}',
          target: '{{target}}'{{#if value}},
          value: '{{value}}'{{/if}}{{#if wait}},
          wait: '{{wait}}'{{/if}}
        }{{#unless @last}},{{/unless}}
        {{/each}}
      ]
    }{{#unless @last}},{{/unless}}
    {{/each}}
  },
  events: {
    {{#each events}}
    {{name}}: {
      description: '{{description}}',
      selector: '{{selector}}',
      data: {
        {{#each data}}
        {{@key}}: '{{this}}'{{#unless @last}},{{/unless}}
        {{/each}}
      }
    }{{#unless @last}},{{/unless}}
    {{/each}}
  }
};
`));
  }

  /**
   * Render template with context
   */
  private renderTemplate(templateName: string, context: any): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }
    
    return template(context);
  }

  /**
   * Setup Handlebars helpers
   */
  private setupHandlebarsHelpers(): void {
    Handlebars.registerHelper('capitalize', (str: string) => 
      str.charAt(0).toUpperCase() + str.slice(1)
    );
    
    Handlebars.registerHelper('camelCase', (str: string) => this.camelCase(str));
    Handlebars.registerHelper('kebabCase', (str: string) => this.kebabCase(str));
    Handlebars.registerHelper('snakeCase', (str: string) => this.snakeCase(str));
    Handlebars.registerHelper('pascalCase', (str: string) => this.pascalCase(str));
    
    Handlebars.registerPartial('header', `
/**
 * Generated by Web-Buddy Contract SDK Generator
 * Contract: {{contract.info.name}} v{{contract.info.version}}
 * Generated: {{timestamp}}
 * 
 * {{contract.info.description}}
 */
`);
  }

  /**
   * Utility methods for string case conversion
   */
  private camelCase(str: string): string {
    return str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '');
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private snakeCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }

  private pascalCase(str: string): string {
    const camel = this.camelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  private getContractName(contract: WebApplicationContract): string {
    return contract.info.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  }
}

export default ContractSDKGenerator;