import { WebBuddyServer, WebBuddyServerConfig } from './server';
/**
 * Factory function to create a configured WebBuddyServer
 *
 * @param config - Server configuration options
 * @returns Configured WebBuddyServer instance
 *
 * @example
 * ```typescript
 * const server = createWebBuddyServer({
 *   port: 3000,
 *   cors: {
 *     enabled: true,
 *     origins: ['http://localhost:3000', 'https://chatgpt.com']
 *   },
 *   authentication: {
 *     enabled: true,
 *     apiKeys: ['your-api-key']
 *   }
 * });
 *
 * await server.start();
 * ```
 */
export declare function createWebBuddyServer(config?: WebBuddyServerConfig): WebBuddyServer;
//# sourceMappingURL=factory.d.ts.map