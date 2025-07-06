"use strict";
/*
                        Web-Buddy Framework
                        Swagger UI Adapter

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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaggerUIAdapter = void 0;
const core_1 = require("@typescript-eda/core");
const fs = __importStar(require("fs/promises"));
const openapi_generator_adapter_1 = require("./openapi-generator-adapter");
/**
 * Swagger UI Adapter - Serves interactive API documentation
 *
 * Responsibilities:
 * - Serve Swagger UI interface for API documentation
 * - Provide OpenAPI specification endpoint
 * - Handle API testing and exploration
 * - Customize UI for Web-Buddy Framework branding
 */
class SwaggerUIAdapter extends core_1.Adapter {
    constructor(app, docPath = '/docs') {
        super();
        this.app = app;
        this.docPath = docPath;
        this.openApiGenerator = new openapi_generator_adapter_1.OpenAPIGeneratorAdapter();
        this.setupRoutes();
    }
    /**
     * Sets up Swagger UI routes
     */
    setupRoutes() {
        // Serve OpenAPI specification
        this.app.get(`${this.docPath}/openapi.json`, async (req, res) => {
            try {
                const spec = await this.openApiGenerator.generateSpecification();
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.send(spec);
            }
            catch (error) {
                res.status(500).json({
                    error: 'Failed to generate OpenAPI specification',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Serve Swagger UI HTML
        this.app.get(this.docPath, async (req, res) => {
            try {
                const html = await this.generateSwaggerHTML();
                res.setHeader('Content-Type', 'text/html');
                res.send(html);
            }
            catch (error) {
                res.status(500).send('Failed to generate documentation page');
            }
        });
        // Health check for documentation service
        this.app.get(`${this.docPath}/health`, (req, res) => {
            res.json({
                status: 'healthy',
                service: 'swagger-ui',
                timestamp: new Date().toISOString()
            });
        });
    }
    /**
     * Generates custom Swagger UI HTML page
     */
    async generateSwaggerHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Web-Buddy Framework API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-16x16.png" sizes="16x16" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .swagger-ui .topbar {
            background-color: #2d3748;
            border-bottom: 1px solid #4a5568;
        }
        .swagger-ui .topbar .topbar-wrapper {
            padding: 10px 20px;
        }
        .swagger-ui .topbar .topbar-wrapper .link {
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            text-decoration: none;
        }
        .custom-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
        }
        .custom-header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .custom-header p {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .feature-highlights {
            background: white;
            padding: 20px;
            margin: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .feature-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        .feature-card h3 {
            margin: 0 0 10px 0;
            color: #2d3748;
        }
        .feature-card p {
            margin: 0;
            color: #4a5568;
            font-size: 14px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="custom-header">
        <h1>🤖 Web-Buddy Framework</h1>
        <p>Interactive Browser Automation with Machine Learning</p>
    </div>
    
    <div class="feature-highlights">
        <h2>🚀 Key Features</h2>
        <div class="feature-grid">
            <div class="feature-card">
                <h3>🎯 Interactive Training</h3>
                <p>Learn automation patterns through user demonstration. No coding required - just show the system what to do!</p>
            </div>
            <div class="feature-card">
                <h3>⚡ Event-Driven Architecture</h3>
                <p>Built on TypeScript-EDA with Domain-Driven Design patterns for maximum maintainability and scalability.</p>
            </div>
            <div class="feature-card">
                <h3>📥 Smart Downloads</h3>
                <p>Seamless file download management with Google Images integration and server-side file access.</p>
            </div>
            <div class="feature-card">
                <h3>🧠 Pattern Learning</h3>
                <p>Machine learning algorithms that improve automation accuracy over time through usage patterns.</p>
            </div>
            <div class="feature-card">
                <h3>🔄 Cross-Session Persistence</h3>
                <p>Learned patterns and configurations persist across browser sessions and application restarts.</p>
            </div>
            <div class="feature-card">
                <h3>🔌 Multi-Language SDKs</h3>
                <p>TypeScript and Python client libraries for easy integration into existing workflows and applications.</p>
            </div>
        </div>
    </div>

    <div id="swagger-ui"></div>
    
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            // Custom request interceptor to add authentication
            const requestInterceptor = (request) => {
                // Add default authorization header for testing
                if (!request.headers.Authorization) {
                    // Show a note about authentication
                    console.log('💡 Tip: Add your API key to the Authorization header for testing');
                }
                return request;
            };

            // Custom response interceptor
            const responseInterceptor = (response) => {
                // Log responses for debugging
                if (response.status >= 400) {
                    console.error('API Error:', response.status, response.statusText);
                }
                return response;
            };

            const ui = SwaggerUIBundle({
                url: '${this.docPath}/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                requestInterceptor: requestInterceptor,
                responseInterceptor: responseInterceptor,
                
                // Custom configuration
                defaultModelsExpandDepth: 2,
                defaultModelExpandDepth: 2,
                docExpansion: 'list',
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
                
                // Customize the UI
                customfavIcon: '/favicon.ico',
                
                // Add custom header
                onComplete: function() {
                    // Add custom styling or behavior after load
                    console.log('🎉 Web-Buddy Framework API Documentation loaded!');
                    
                    // Add authentication helper
                    const authSection = document.querySelector('.scheme-container');
                    if (authSection) {
                        const helpText = document.createElement('div');
                        helpText.innerHTML = \`
                            <div style="background: #e8f4f8; padding: 10px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #1890ff;">
                                <strong>🔑 Authentication Help:</strong><br>
                                Use your API key with Bearer token format: <code>Bearer your-api-key-here</code><br>
                                <small>For testing, you can use: <code>Bearer your-super-secret-client-key</code></small>
                            </div>
                        \`;
                        authSection.insertBefore(helpText, authSection.firstChild);
                    }
                }
            });
            
            window.ui = ui;
        };
    </script>
</body>
</html>
        `.trim();
    }
    /**
     * Updates the OpenAPI specification and regenerates documentation
     */
    async updateSpecification() {
        // Regenerate the specification - this will be served on next request
        await this.openApiGenerator.generateSpecification();
    }
    /**
     * Generates standalone HTML documentation file
     */
    async generateStandaloneDocumentation(outputPath) {
        const spec = await this.openApiGenerator.generateSpecification();
        const html = await this.generateStandaloneHTML(spec);
        await fs.writeFile(outputPath, html, 'utf8');
    }
    /**
     * Generates standalone HTML with embedded OpenAPI spec
     */
    async generateStandaloneHTML(openApiSpec) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Web-Buddy Framework API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const spec = ${openApiSpec};
            
            const ui = SwaggerUIBundle({
                spec: spec,
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
            
            window.ui = ui;
        };
    </script>
</body>
</html>
        `.trim();
    }
    /**
     * Gets API usage statistics for documentation analytics
     */
    getDocumentationStats() {
        return {
            docPath: this.docPath,
            generatedAt: new Date().toISOString(),
            features: {
                interactiveUI: true,
                authentication: true,
                codeGeneration: true,
                customStyling: true
            }
        };
    }
}
exports.SwaggerUIAdapter = SwaggerUIAdapter;
//# sourceMappingURL=swagger-ui-adapter.js.map