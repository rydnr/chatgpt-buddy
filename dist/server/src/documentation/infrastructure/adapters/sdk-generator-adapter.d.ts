import { Adapter } from '@typescript-eda/core';
/**
 * SDK Generator Adapter - Generates client SDKs from OpenAPI specification
 *
 * Responsibilities:
 * - Generate TypeScript client SDK
 * - Generate Python client SDK
 * - Create documentation and examples for each SDK
 * - Maintain type safety and consistency across languages
 */
export declare class SDKGeneratorAdapter extends Adapter {
    private openApiGenerator;
    constructor();
    /**
     * Generates TypeScript SDK
     */
    generateTypeScriptSDK(outputDir: string): Promise<void>;
    /**
     * Generates TypeScript client class
     */
    private generateTypeScriptClient;
    /**
     * Generates TypeScript type definitions
     */
    private generateTypeScriptTypes;
    /**
     * Generates TypeScript API methods
     */
    private generateTypeScriptAPI;
    /**
     * Generates TypeScript usage examples
     */
    private generateTypeScriptExamples;
    /**
     * Generates TypeScript package.json
     */
    private generateTypeScriptPackageJson;
    /**
     * Generates TypeScript README
     */
    private generateTypeScriptReadme;
    /**
     * Generates Python SDK (simplified version)
     */
    generatePythonSDK(outputDir: string): Promise<void>;
    /**
     * Generates Python client (simplified)
     */
    private generatePythonClient;
    /**
     * Generates Python setup.py
     */
    private generatePythonSetup;
    /**
     * Gets SDK generation statistics
     */
    getGenerationStats(): object;
}
//# sourceMappingURL=sdk-generator-adapter.d.ts.map