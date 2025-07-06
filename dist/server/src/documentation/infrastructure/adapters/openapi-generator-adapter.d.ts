import { Adapter } from '@typescript-eda/core';
/**
 * OpenAPI Generator Adapter - Generates OpenAPI 3.0 specification from domain events
 *
 * Responsibilities:
 * - Analyze domain events and generate corresponding API endpoints
 * - Create OpenAPI schema definitions from TypeScript types
 * - Generate complete OpenAPI specification document
 * - Support both REST API and WebSocket API documentation
 */
export declare class OpenAPIGeneratorAdapter extends Adapter {
    private apiSpec;
    private version;
    private baseUrl;
    constructor(version?: string, baseUrl?: string);
    /**
     * Initializes the base OpenAPI specification structure
     */
    private initializeApiSpec;
    /**
     * Generates complete OpenAPI specification
     */
    generateSpecification(): Promise<string>;
    /**
     * Adds core schema definitions
     */
    private addCoreSchemas;
    /**
     * Adds automation endpoint definitions
     */
    private addAutomationEndpoints;
    /**
     * Adds training system endpoint definitions
     */
    private addTrainingEndpoints;
    /**
     * Adds download management endpoint definitions
     */
    private addDownloadEndpoints;
    /**
     * Adds pattern management endpoint definitions
     */
    private addPatternEndpoints;
    /**
     * Adds Google Images specific endpoint definitions
     */
    private addGoogleImagesEndpoints;
    /**
     * Adds WebSocket API documentation
     */
    private addWebSocketDocumentation;
    /**
     * Saves the generated specification to a file
     */
    saveSpecification(outputPath: string): Promise<void>;
    /**
     * Generates a YAML version of the specification
     */
    generateYamlSpecification(): Promise<string>;
}
//# sourceMappingURL=openapi-generator-adapter.d.ts.map