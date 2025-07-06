import { Adapter } from '@typescript-eda/core';
import { Express } from 'express';
/**
 * Swagger UI Adapter - Serves interactive API documentation
 *
 * Responsibilities:
 * - Serve Swagger UI interface for API documentation
 * - Provide OpenAPI specification endpoint
 * - Handle API testing and exploration
 * - Customize UI for Web-Buddy Framework branding
 */
export declare class SwaggerUIAdapter extends Adapter {
    private openApiGenerator;
    private app;
    private docPath;
    constructor(app: Express, docPath?: string);
    /**
     * Sets up Swagger UI routes
     */
    private setupRoutes;
    /**
     * Generates custom Swagger UI HTML page
     */
    private generateSwaggerHTML;
    /**
     * Updates the OpenAPI specification and regenerates documentation
     */
    updateSpecification(): Promise<void>;
    /**
     * Generates standalone HTML documentation file
     */
    generateStandaloneDocumentation(outputPath: string): Promise<void>;
    /**
     * Generates standalone HTML with embedded OpenAPI spec
     */
    private generateStandaloneHTML;
    /**
     * Gets API usage statistics for documentation analytics
     */
    getDocumentationStats(): object;
}
//# sourceMappingURL=swagger-ui-adapter.d.ts.map