/*
                        Web-Buddy Framework
                        SDK Generator Adapter

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

import { Adapter } from '@typescript-eda/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import { OpenAPIGeneratorAdapter } from './openapi-generator-adapter';

/**
 * SDK Generator Adapter - Generates client SDKs from OpenAPI specification
 * 
 * Responsibilities:
 * - Generate TypeScript client SDK
 * - Generate Python client SDK
 * - Create documentation and examples for each SDK
 * - Maintain type safety and consistency across languages
 */
export class SDKGeneratorAdapter extends Adapter {
    private openApiGenerator: OpenAPIGeneratorAdapter;

    constructor() {
        super();
        this.openApiGenerator = new OpenAPIGeneratorAdapter();
    }

    /**
     * Generates TypeScript SDK
     */
    public async generateTypeScriptSDK(outputDir: string): Promise<void> {
        await fs.mkdir(outputDir, { recursive: true });

        // Generate main client class
        const clientCode = await this.generateTypeScriptClient();
        await fs.writeFile(path.join(outputDir, 'client.ts'), clientCode);

        // Generate type definitions
        const typesCode = await this.generateTypeScriptTypes();
        await fs.writeFile(path.join(outputDir, 'types.ts'), typesCode);

        // Generate API methods
        const apiCode = await this.generateTypeScriptAPI();
        await fs.writeFile(path.join(outputDir, 'api.ts'), apiCode);

        // Generate examples
        const examplesCode = await this.generateTypeScriptExamples();
        await fs.writeFile(path.join(outputDir, 'examples.ts'), examplesCode);

        // Generate package.json
        const packageJson = await this.generateTypeScriptPackageJson();
        await fs.writeFile(path.join(outputDir, 'package.json'), packageJson);

        // Generate README
        const readme = await this.generateTypeScriptReadme();
        await fs.writeFile(path.join(outputDir, 'README.md'), readme);
    }

    /**
     * Generates TypeScript client class
     */
    private async generateTypeScriptClient(): Promise<string> {
        return `/*
 * Web-Buddy Framework TypeScript SDK
 * Generated from OpenAPI specification
 */

import { WebBuddyAPI } from './api';
import { 
    ClientConfig, 
    AgentMessage, 
    ActionResponse, 
    DispatchPayload,
    AutomationPattern,
    DownloadStatusResponse 
} from './types';

/**
 * Web-Buddy Framework Client
 * 
 * Main client class for interacting with the Web-Buddy Framework API.
 * Provides high-level methods for browser automation, training, and downloads.
 */
export class WebBuddyClient {
    private api: WebBuddyAPI;
    private config: ClientConfig;

    constructor(config: ClientConfig) {
        this.config = {
            timeout: 30000,
            retries: 3,
            ...config
        };
        
        this.api = new WebBuddyAPI(this.config);
    }

    // === Browser Automation ===

    /**
     * Selects a ChatGPT project
     */
    public async selectProject(
        extensionId: string,
        tabId: number,
        projectName: string
    ): Promise<ActionResponse> {
        const payload: DispatchPayload = {
            target: { extensionId, tabId },
            message: {
                action: 'SELECT_PROJECT',
                payload: { selector: \`[data-project-name="\${projectName}"]\` },
                correlationId: this.generateCorrelationId()
            }
        };

        return await this.api.dispatch(payload);
    }

    /**
     * Fills a prompt in the ChatGPT interface
     */
    public async fillPrompt(
        extensionId: string,
        tabId: number,
        promptText: string
    ): Promise<ActionResponse> {
        const payload: DispatchPayload = {
            target: { extensionId, tabId },
            message: {
                action: 'FILL_PROMPT',
                payload: { 
                    selector: '#prompt-textarea', 
                    value: promptText 
                },
                correlationId: this.generateCorrelationId()
            }
        };

        return await this.api.dispatch(payload);
    }

    /**
     * Gets the response from ChatGPT
     */
    public async getResponse(
        extensionId: string,
        tabId: number
    ): Promise<ActionResponse> {
        const payload: DispatchPayload = {
            target: { extensionId, tabId },
            message: {
                action: 'GET_RESPONSE',
                payload: { selector: '[data-message-author-role="assistant"]' },
                correlationId: this.generateCorrelationId()
            }
        };

        return await this.api.dispatch(payload);
    }

    // === Training System ===

    /**
     * Enables training mode for a website
     */
    public async enableTraining(hostname: string): Promise<any> {
        return await this.api.enableTraining(hostname);
    }

    /**
     * Lists learned automation patterns
     */
    public async getPatterns(filters?: {
        hostname?: string;
        messageType?: string;
    }): Promise<AutomationPattern[]> {
        return await this.api.getPatterns(filters);
    }

    /**
     * Exports automation patterns
     */
    public async exportPatterns(): Promise<any> {
        return await this.api.exportPatterns();
    }

    /**
     * Imports automation patterns
     */
    public async importPatterns(
        patterns: AutomationPattern[],
        overwrite: boolean = false
    ): Promise<any> {
        return await this.api.importPatterns(patterns, overwrite);
    }

    // === File Downloads ===

    /**
     * Downloads a file through the browser extension
     */
    public async downloadFile(
        extensionId: string,
        tabId: number,
        url: string,
        options?: {
            filename?: string;
            conflictAction?: 'uniquify' | 'overwrite' | 'prompt';
            saveAs?: boolean;
        }
    ): Promise<ActionResponse> {
        const payload: DispatchPayload = {
            target: { extensionId, tabId },
            message: {
                action: 'DOWNLOAD_FILE',
                payload: {
                    url,
                    ...options
                },
                correlationId: this.generateCorrelationId()
            }
        };

        return await this.api.dispatch(payload);
    }

    /**
     * Gets download status
     */
    public async getDownloadStatus(downloadId: number): Promise<DownloadStatusResponse> {
        return await this.api.getDownloadStatus(downloadId);
    }

    /**
     * Downloads an image from Google Images
     */
    public async downloadGoogleImage(
        extensionId: string,
        tabId: number,
        imageElement: {
            src: string;
            alt?: string;
            title?: string;
            width?: number;
            height?: number;
        },
        options?: {
            searchQuery?: string;
            filename?: string;
        }
    ): Promise<any> {
        return await this.api.downloadGoogleImage(
            extensionId,
            tabId,
            imageElement,
            options
        );
    }

    // === Utility Methods ===

    /**
     * Tests API connectivity
     */
    public async ping(): Promise<{ success: boolean; latency: number }> {
        const start = Date.now();
        try {
            await this.api.healthCheck();
            return {
                success: true,
                latency: Date.now() - start
            };
        } catch (error) {
            return {
                success: false,
                latency: Date.now() - start
            };
        }
    }

    /**
     * Generates a unique correlation ID
     */
    private generateCorrelationId(): string {
        return \`sdk-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
    }

    /**
     * Gets client configuration
     */
    public getConfig(): ClientConfig {
        return { ...this.config };
    }

    /**
     * Updates client configuration
     */
    public updateConfig(updates: Partial<ClientConfig>): void {
        this.config = { ...this.config, ...updates };
        this.api.updateConfig(this.config);
    }
}

export default WebBuddyClient;
`;
    }

    /**
     * Generates TypeScript type definitions
     */
    private async generateTypeScriptTypes(): Promise<string> {
        return `/*
 * Web-Buddy Framework TypeScript SDK Types
 * Generated from OpenAPI specification
 */

// === Core Types ===

export interface ClientConfig {
    baseUrl: string;
    apiKey: string;
    timeout?: number;
    retries?: number;
    userAgent?: string;
}

export type CorrelationId = string;

export type ActionType = 
    | 'SELECT_PROJECT' 
    | 'SELECT_CHAT' 
    | 'GET_RESPONSE' 
    | 'FILL_PROMPT' 
    | 'DOWNLOAD_IMAGE'
    | 'DOWNLOAD_FILE'
    | 'GET_DOWNLOAD_STATUS'
    | 'LIST_DOWNLOADS';

// === Message Types ===

export interface BaseMessage<T extends ActionType, P> {
    action: T;
    payload: P;
    correlationId: CorrelationId;
}

export interface AgentMessage {
    action: ActionType;
    payload: any;
    correlationId: CorrelationId;
}

export interface ActionResponse {
    correlationId: CorrelationId;
    status: 'success' | 'error';
    data?: any;
    error?: string;
}

export interface DispatchPayload {
    target: {
        extensionId: string;
        tabId: number;
    };
    message: AgentMessage;
}

// === Training Types ===

export interface TrainingSession {
    id: string;
    mode: 'training' | 'automatic';
    startedAt: string;
    patternsLearned: number;
}

export interface AutomationPattern {
    id: string;
    messageType: string;
    selector: string;
    confidence: number;
    usageCount: number;
    successfulExecutions: number;
    context: any;
}

// === Download Types ===

export interface DownloadFilePayload {
    url: string;
    filename?: string;
    conflictAction?: 'uniquify' | 'overwrite' | 'prompt';
    saveAs?: boolean;
}

export interface DownloadStatusResponse {
    downloadId: number;
    url: string;
    filename: string;
    state: 'in_progress' | 'interrupted' | 'complete';
    bytesReceived: number;
    totalBytes: number;
    progress: number;
}

// === Google Images Types ===

export interface GoogleImageElement {
    src: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
}

// === Error Types ===

export interface APIError extends Error {
    code?: string;
    status?: number;
    response?: any;
}

// === Utility Types ===

export interface APIResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
`;
    }

    /**
     * Generates TypeScript API methods
     */
    private async generateTypeScriptAPI(): Promise<string> {
        return `/*
 * Web-Buddy Framework TypeScript SDK API
 * Generated from OpenAPI specification
 */

import { 
    ClientConfig, 
    DispatchPayload, 
    ActionResponse,
    AutomationPattern,
    DownloadStatusResponse,
    APIError,
    APIResponse 
} from './types';

/**
 * Low-level API client for Web-Buddy Framework
 */
export class WebBuddyAPI {
    private config: ClientConfig;

    constructor(config: ClientConfig) {
        this.config = config;
    }

    // === Core API Methods ===

    /**
     * Dispatches a command to browser extension
     */
    public async dispatch(payload: DispatchPayload): Promise<ActionResponse> {
        return await this.request('POST', '/api/dispatch', payload);
    }

    /**
     * Enables training mode
     */
    public async enableTraining(hostname: string): Promise<any> {
        return await this.request('POST', '/api/training/enable', { hostname });
    }

    /**
     * Gets automation patterns
     */
    public async getPatterns(filters?: any): Promise<AutomationPattern[]> {
        const queryParams = filters ? this.buildQueryString(filters) : '';
        return await this.request('GET', \`/api/training/patterns\${queryParams}\`);
    }

    /**
     * Exports automation patterns
     */
    public async exportPatterns(): Promise<any> {
        return await this.request('GET', '/api/patterns/export');
    }

    /**
     * Imports automation patterns
     */
    public async importPatterns(patterns: AutomationPattern[], overwrite: boolean): Promise<any> {
        return await this.request('POST', '/api/patterns/import', { patterns, overwrite });
    }

    /**
     * Gets download status
     */
    public async getDownloadStatus(downloadId: number): Promise<DownloadStatusResponse> {
        return await this.request('GET', \`/api/downloads/\${downloadId}/status\`);
    }

    /**
     * Downloads Google Images
     */
    public async downloadGoogleImage(
        extensionId: string,
        tabId: number,
        imageElement: any,
        options?: any
    ): Promise<any> {
        return await this.request('POST', '/api/google-images/download', {
            target: { extensionId, tabId },
            imageElement,
            ...options
        });
    }

    /**
     * Health check
     */
    public async healthCheck(): Promise<any> {
        return await this.request('GET', '/docs/health');
    }

    // === HTTP Client ===

    /**
     * Makes HTTP request with authentication and error handling
     */
    private async request<T = any>(
        method: string,
        endpoint: string,
        data?: any
    ): Promise<T> {
        const url = \`\${this.config.baseUrl}\${endpoint}\`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${this.config.apiKey}\`,
            'User-Agent': this.config.userAgent || 'WebBuddySDK/1.0.0'
        };

        const options: RequestInit = {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined
        };

        try {
            const response = await this.fetchWithRetry(url, options);
            
            if (!response.ok) {
                throw await this.createAPIError(response);
            }

            return await response.json();
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            throw new APIError(\`Request failed: \${error.message}\`);
        }
    }

    /**
     * Fetch with retry logic
     */
    private async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
        let lastError: Error;
        
        for (let attempt = 0; attempt < (this.config.retries || 3); attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);
                
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                lastError = error as Error;
                
                if (attempt < (this.config.retries || 3) - 1) {
                    await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
                }
            }
        }
        
        throw lastError!;
    }

    /**
     * Creates API error from response
     */
    private async createAPIError(response: Response): Promise<APIError> {
        let errorData: any;
        
        try {
            errorData = await response.json();
        } catch {
            errorData = { error: response.statusText };
        }
        
        const error = new APIError(errorData.error || 'API request failed') as APIError;
        error.code = errorData.code;
        error.status = response.status;
        error.response = errorData;
        
        return error;
    }

    /**
     * Builds query string from object
     */
    private buildQueryString(params: Record<string, any>): string {
        const query = new URLSearchParams();
        
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                query.append(key, String(value));
            }
        }
        
        const queryString = query.toString();
        return queryString ? \`?\${queryString}\` : '';
    }

    /**
     * Delay helper for retries
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Updates client configuration
     */
    public updateConfig(config: ClientConfig): void {
        this.config = config;
    }
}

/**
 * API Error class
 */
class APIError extends Error {
    public code?: string;
    public status?: number;
    public response?: any;

    constructor(message: string) {
        super(message);
        this.name = 'APIError';
    }
}
`;
    }

    /**
     * Generates TypeScript usage examples
     */
    private async generateTypeScriptExamples(): Promise<string> {
        return `/*
 * Web-Buddy Framework TypeScript SDK Examples
 */

import { WebBuddyClient } from './client';

// === Basic Setup ===

const client = new WebBuddyClient({
    baseUrl: 'http://localhost:3000',
    apiKey: 'your-api-key-here'
});

// === Example 1: Basic ChatGPT Automation ===

async function chatGPTAutomation() {
    const extensionId = 'your-extension-id';
    const tabId = 123;

    try {
        // Select a project
        await client.selectProject(extensionId, tabId, 'typescript-development');
        
        // Fill a prompt
        await client.fillPrompt(extensionId, tabId, 'Generate a TypeScript function to validate email addresses');
        
        // Get the response
        const response = await client.getResponse(extensionId, tabId);
        console.log('ChatGPT Response:', response.data);
        
    } catch (error) {
        console.error('Automation failed:', error);
    }
}

// === Example 2: Training Mode ===

async function trainingExample() {
    try {
        // Enable training for ChatGPT
        await client.enableTraining('chatgpt.com');
        
        // Get learned patterns
        const patterns = await client.getPatterns({
            hostname: 'chatgpt.com'
        });
        
        console.log(\`Found \${patterns.length} learned patterns\`);
        
        // Export patterns for backup
        const exportData = await client.exportPatterns();
        console.log('Exported patterns:', exportData);
        
    } catch (error) {
        console.error('Training failed:', error);
    }
}

// === Example 3: File Downloads ===

async function downloadExample() {
    const extensionId = 'your-extension-id';
    const tabId = 123;
    
    try {
        // Download a file
        const download = await client.downloadFile(
            extensionId, 
            tabId, 
            'https://example.com/file.pdf',
            {
                filename: 'important-document.pdf',
                conflictAction: 'uniquify'
            }
        );
        
        console.log('Download started:', download);
        
        // Monitor download progress
        if (download.data?.downloadId) {
            const status = await client.getDownloadStatus(download.data.downloadId);
            console.log(\`Progress: \${status.progress}%\`);
        }
        
    } catch (error) {
        console.error('Download failed:', error);
    }
}

// === Example 4: Google Images ===

async function googleImagesExample() {
    const extensionId = 'your-extension-id';
    const tabId = 123;
    
    try {
        // Download an image from Google Images
        const download = await client.downloadGoogleImage(
            extensionId,
            tabId,
            {
                src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ...',
                alt: 'Example image',
                width: 800,
                height: 600
            },
            {
                searchQuery: 'beautiful landscape',
                filename: 'landscape.jpg'
            }
        );
        
        console.log('Google Images download:', download);
        
    } catch (error) {
        console.error('Google Images download failed:', error);
    }
}

// === Example 5: Error Handling and Retries ===

async function robustAutomation() {
    // Configure client with custom settings
    const robustClient = new WebBuddyClient({
        baseUrl: 'http://localhost:3000',
        apiKey: 'your-api-key-here',
        timeout: 60000,  // 60 second timeout
        retries: 5       // 5 retry attempts
    });
    
    try {
        // Test connectivity
        const ping = await robustClient.ping();
        console.log(\`API connected: \${ping.success} (latency: \${ping.latency}ms)\`);
        
        if (!ping.success) {
            throw new Error('API not reachable');
        }
        
        // Proceed with automation...
        
    } catch (error) {
        console.error('Robust automation failed:', error);
    }
}

// === Example 6: Batch Operations ===

async function batchOperations() {
    const extensionId = 'your-extension-id';
    const tabId = 123;
    
    const prompts = [
        'Explain quantum computing',
        'Write a Python sorting algorithm',
        'Describe machine learning basics'
    ];
    
    try {
        for (const prompt of prompts) {
            console.log(\`Processing: \${prompt}\`);
            
            await client.fillPrompt(extensionId, tabId, prompt);
            const response = await client.getResponse(extensionId, tabId);
            
            console.log('Response received:', response.data?.slice(0, 100) + '...');
            
            // Wait between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
    } catch (error) {
        console.error('Batch operation failed:', error);
    }
}

// === Export examples ===

export {
    chatGPTAutomation,
    trainingExample,
    downloadExample,
    googleImagesExample,
    robustAutomation,
    batchOperations
};
`;
    }

    /**
     * Generates TypeScript package.json
     */
    private async generateTypeScriptPackageJson(): Promise<string> {
        return JSON.stringify({
            name: '@web-buddy/client-ts',
            version: '1.0.0',
            description: 'TypeScript SDK for Web-Buddy Framework',
            main: 'dist/index.js',
            types: 'dist/index.d.ts',
            scripts: {
                build: 'tsc',
                test: 'jest',
                'test:watch': 'jest --watch',
                lint: 'eslint src/**/*.ts',
                'lint:fix': 'eslint src/**/*.ts --fix'
            },
            keywords: [
                'web-automation',
                'browser-automation',
                'chatgpt',
                'machine-learning',
                'typescript'
            ],
            author: 'Web-Buddy Team',
            license: 'GPL-3.0',
            dependencies: {},
            devDependencies: {
                typescript: '^5.0.0',
                '@types/node': '^20.0.0',
                jest: '^29.0.0',
                '@types/jest': '^29.0.0',
                eslint: '^8.0.0',
                '@typescript-eslint/eslint-plugin': '^6.0.0',
                '@typescript-eslint/parser': '^6.0.0'
            },
            files: ['dist/**/*'],
            repository: {
                type: 'git',
                url: 'https://github.com/web-buddy/client-ts'
            },
            bugs: {
                url: 'https://github.com/web-buddy/client-ts/issues'
            },
            homepage: 'https://web-buddy.dev/docs/typescript-sdk'
        }, null, 2);
    }

    /**
     * Generates TypeScript README
     */
    private async generateTypeScriptReadme(): Promise<string> {
        return `# Web-Buddy Framework TypeScript SDK

🤖 **Interactive Browser Automation with Machine Learning**

The official TypeScript SDK for the Web-Buddy Framework, providing type-safe access to all framework features including interactive training, browser automation, and intelligent file downloads.

## 🚀 Quick Start

\`\`\`bash
npm install @web-buddy/client-ts
\`\`\`

\`\`\`typescript
import { WebBuddyClient } from '@web-buddy/client-ts';

const client = new WebBuddyClient({
    baseUrl: 'http://localhost:3000',
    apiKey: 'your-api-key-here'
});

// Automate ChatGPT
await client.selectProject('extension-id', 123, 'typescript-project');
await client.fillPrompt('extension-id', 123, 'Generate a TypeScript function');
const response = await client.getResponse('extension-id', 123);
\`\`\`

## 📖 Features

- ✅ **Type-Safe API** - Full TypeScript support with auto-completion
- 🎯 **Interactive Training** - Learn automation patterns through demonstration
- 📥 **Smart Downloads** - Intelligent file download management
- 🖼️ **Google Images** - Specialized Google Images automation
- 🔄 **Auto-Retry** - Built-in retry logic with exponential backoff
- 🛡️ **Error Handling** - Comprehensive error types and handling

## 📋 API Reference

### WebBuddyClient

Main client class for all Web-Buddy Framework interactions.

#### Constructor

\`\`\`typescript
new WebBuddyClient(config: ClientConfig)
\`\`\`

#### Browser Automation

\`\`\`typescript
// Select ChatGPT project
await client.selectProject(extensionId: string, tabId: number, projectName: string)

// Fill prompt text
await client.fillPrompt(extensionId: string, tabId: number, promptText: string)

// Get ChatGPT response
await client.getResponse(extensionId: string, tabId: number)
\`\`\`

#### Training System

\`\`\`typescript
// Enable training mode
await client.enableTraining(hostname: string)

// Get learned patterns
await client.getPatterns(filters?: { hostname?: string; messageType?: string })

// Export/import patterns
await client.exportPatterns()
await client.importPatterns(patterns: AutomationPattern[], overwrite?: boolean)
\`\`\`

#### File Downloads

\`\`\`typescript
// Download file
await client.downloadFile(extensionId: string, tabId: number, url: string, options?)

// Get download status
await client.getDownloadStatus(downloadId: number)

// Google Images download
await client.downloadGoogleImage(extensionId: string, tabId: number, imageElement, options?)
\`\`\`

## 🔧 Configuration

\`\`\`typescript
interface ClientConfig {
    baseUrl: string;      // Web-Buddy server URL
    apiKey: string;       // API authentication key
    timeout?: number;     // Request timeout (default: 30000ms)
    retries?: number;     // Retry attempts (default: 3)
    userAgent?: string;   // Custom user agent
}
\`\`\`

## 📝 Examples

### Basic ChatGPT Automation

\`\`\`typescript
async function automateChat() {
    const client = new WebBuddyClient({
        baseUrl: 'http://localhost:3000',
        apiKey: process.env.WEB_BUDDY_API_KEY!
    });

    try {
        await client.selectProject('ext-123', 456, 'coding-assistant');
        await client.fillPrompt('ext-123', 456, 'Write a REST API in TypeScript');
        
        const response = await client.getResponse('ext-123', 456);
        console.log('Generated code:', response.data);
    } catch (error) {
        console.error('Automation failed:', error);
    }
}
\`\`\`

### Training Mode

\`\`\`typescript
async function setupTraining() {
    const client = new WebBuddyClient({ /* config */ });

    // Enable training for a website
    await client.enableTraining('example.com');

    // View learned patterns
    const patterns = await client.getPatterns({ hostname: 'example.com' });
    console.log(\`Learned \${patterns.length} automation patterns\`);
}
\`\`\`

### File Downloads

\`\`\`typescript
async function downloadFiles() {
    const client = new WebBuddyClient({ /* config */ });

    // Download with progress monitoring
    const download = await client.downloadFile(
        'ext-123', 
        456, 
        'https://example.com/report.pdf'
    );

    if (download.data?.downloadId) {
        const status = await client.getDownloadStatus(download.data.downloadId);
        console.log(\`Download progress: \${status.progress}%\`);
    }
}
\`\`\`

## 🔍 Error Handling

\`\`\`typescript
import { APIError } from '@web-buddy/client-ts';

try {
    await client.selectProject('ext-123', 456, 'project-name');
} catch (error) {
    if (error instanceof APIError) {
        console.error(\`API Error [\${error.status}]: \${error.message}\`);
        console.error('Error code:', error.code);
    } else {
        console.error('Unexpected error:', error);
    }
}
\`\`\`

## 🧪 Testing

\`\`\`bash
npm test
npm run test:watch
\`\`\`

## 📄 License

GPL-3.0 License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📞 Support

- 📖 [Documentation](https://web-buddy.dev/docs)
- 🐛 [Issue Tracker](https://github.com/web-buddy/client-ts/issues)
- 💬 [Discord Community](https://discord.gg/web-buddy)

---

Made with ❤️ by the Web-Buddy Team
`;
    }

    /**
     * Generates Python SDK (simplified version)
     */
    public async generatePythonSDK(outputDir: string): Promise<void> {
        await fs.mkdir(outputDir, { recursive: true });

        // Generate main client
        const clientCode = this.generatePythonClient();
        await fs.writeFile(path.join(outputDir, 'client.py'), clientCode);

        // Generate setup.py
        const setupPy = this.generatePythonSetup();
        await fs.writeFile(path.join(outputDir, 'setup.py'), setupPy);

        // Generate requirements.txt
        const requirements = 'requests>=2.28.0\naiohttp>=3.8.0\npydantic>=1.10.0\n';
        await fs.writeFile(path.join(outputDir, 'requirements.txt'), requirements);
    }

    /**
     * Generates Python client (simplified)
     */
    private generatePythonClient(): string {
        return `"""
Web-Buddy Framework Python SDK
Generated from OpenAPI specification
"""

import asyncio
import time
from typing import Dict, List, Optional, Any, Union
import aiohttp
import requests

class WebBuddyClient:
    """
    Web-Buddy Framework Python Client
    
    Provides access to browser automation, training, and download features.
    """
    
    def __init__(self, base_url: str, api_key: str, timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'WebBuddyPythonSDK/1.0.0'
        })
    
    def select_project(self, extension_id: str, tab_id: int, project_name: str) -> Dict[str, Any]:
        """Select a ChatGPT project"""
        payload = {
            'target': {'extensionId': extension_id, 'tabId': tab_id},
            'message': {
                'action': 'SELECT_PROJECT',
                'payload': {'selector': f'[data-project-name="{project_name}"]'},
                'correlationId': self._generate_correlation_id()
            }
        }
        return self._request('POST', '/api/dispatch', payload)
    
    def fill_prompt(self, extension_id: str, tab_id: int, prompt_text: str) -> Dict[str, Any]:
        """Fill a prompt in ChatGPT"""
        payload = {
            'target': {'extensionId': extension_id, 'tabId': tab_id},
            'message': {
                'action': 'FILL_PROMPT',
                'payload': {'selector': '#prompt-textarea', 'value': prompt_text},
                'correlationId': self._generate_correlation_id()
            }
        }
        return self._request('POST', '/api/dispatch', payload)
    
    def get_response(self, extension_id: str, tab_id: int) -> Dict[str, Any]:
        """Get response from ChatGPT"""
        payload = {
            'target': {'extensionId': extension_id, 'tabId': tab_id},
            'message': {
                'action': 'GET_RESPONSE',
                'payload': {'selector': '[data-message-author-role="assistant"]'},
                'correlationId': self._generate_correlation_id()
            }
        }
        return self._request('POST', '/api/dispatch', payload)
    
    def enable_training(self, hostname: str) -> Dict[str, Any]:
        """Enable training mode for a website"""
        return self._request('POST', '/api/training/enable', {'hostname': hostname})
    
    def get_patterns(self, hostname: Optional[str] = None, message_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get learned automation patterns"""
        params = {}
        if hostname:
            params['hostname'] = hostname
        if message_type:
            params['messageType'] = message_type
        
        url = '/api/training/patterns'
        if params:
            query_string = '&'.join([f'{k}={v}' for k, v in params.items()])
            url += f'?{query_string}'
        
        return self._request('GET', url)
    
    def download_file(self, extension_id: str, tab_id: int, url: str, **options) -> Dict[str, Any]:
        """Download a file through browser extension"""
        payload = {
            'target': {'extensionId': extension_id, 'tabId': tab_id},
            'message': {
                'action': 'DOWNLOAD_FILE',
                'payload': {'url': url, **options},
                'correlationId': self._generate_correlation_id()
            }
        }
        return self._request('POST', '/api/dispatch', payload)
    
    def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        url = f'{self.base_url}{endpoint}'
        
        try:
            if method == 'GET':
                response = self.session.get(url, timeout=self.timeout)
            elif method == 'POST':
                response = self.session.post(url, json=data, timeout=self.timeout)
            else:
                raise ValueError(f'Unsupported HTTP method: {method}')
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise WebBuddyError(f'Request failed: {str(e)}')
    
    def _generate_correlation_id(self) -> str:
        """Generate unique correlation ID"""
        return f'py-sdk-{int(time.time() * 1000)}-{id(self)}'


class WebBuddyError(Exception):
    """Web-Buddy SDK specific error"""
    pass


# Async version
class AsyncWebBuddyClient:
    """Async version of Web-Buddy client"""
    
    def __init__(self, base_url: str, api_key: str, timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'WebBuddyPythonSDK/1.0.0'
        }
    
    async def select_project(self, extension_id: str, tab_id: int, project_name: str) -> Dict[str, Any]:
        """Async version of select_project"""
        payload = {
            'target': {'extensionId': extension_id, 'tabId': tab_id},
            'message': {
                'action': 'SELECT_PROJECT',
                'payload': {'selector': f'[data-project-name="{project_name}"]'},
                'correlationId': self._generate_correlation_id()
            }
        }
        return await self._request('POST', '/api/dispatch', payload)
    
    async def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make async HTTP request"""
        url = f'{self.base_url}{endpoint}'
        
        async with aiohttp.ClientSession(headers=self.headers) as session:
            try:
                if method == 'GET':
                    async with session.get(url, timeout=self.timeout) as response:
                        response.raise_for_status()
                        return await response.json()
                elif method == 'POST':
                    async with session.post(url, json=data, timeout=self.timeout) as response:
                        response.raise_for_status()
                        return await response.json()
                else:
                    raise ValueError(f'Unsupported HTTP method: {method}')
                    
            except aiohttp.ClientError as e:
                raise WebBuddyError(f'Async request failed: {str(e)}')
    
    def _generate_correlation_id(self) -> str:
        """Generate unique correlation ID"""
        return f'py-async-{int(time.time() * 1000)}-{id(self)}'
`;
    }

    /**
     * Generates Python setup.py
     */
    private generatePythonSetup(): string {
        return `from setuptools import setup, find_packages

setup(
    name="web-buddy-sdk",
    version="1.0.0",
    description="Python SDK for Web-Buddy Framework",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    author="Web-Buddy Team",
    author_email="support@web-buddy.dev",
    url="https://github.com/web-buddy/python-sdk",
    packages=find_packages(),
    install_requires=[
        "requests>=2.28.0",
        "aiohttp>=3.8.0",
        "pydantic>=1.10.0"
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "black>=22.0.0",
            "mypy>=1.0.0"
        ]
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: GNU General Public License v3 (GPLv3)",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    keywords="web-automation browser-automation chatgpt machine-learning",
)
`;
    }

    /**
     * Gets SDK generation statistics
     */
    public getGenerationStats(): object {
        return {
            supportedLanguages: ['typescript', 'python'],
            generatedAt: new Date().toISOString(),
            features: {
                typeDefinitions: true,
                asyncSupport: true,
                errorHandling: true,
                retryLogic: true,
                examples: true,
                documentation: true
            }
        };
    }
}
