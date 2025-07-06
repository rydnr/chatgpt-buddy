/**
 * Server-side download events for file access bridging
 */
export declare class ServerFileAccessRequested {
    readonly correlationId: string;
    readonly downloadId: number;
    readonly requestedOperation: 'read' | 'copy' | 'move' | 'delete';
    readonly targetPath?: string | undefined;
    constructor(correlationId: string, downloadId: number, requestedOperation: 'read' | 'copy' | 'move' | 'delete', targetPath?: string | undefined);
}
export declare class ServerFileAccessProvided {
    readonly correlationId: string;
    readonly downloadId: number;
    readonly operation: 'read' | 'copy' | 'move' | 'delete';
    readonly success: boolean;
    readonly filepath?: string | undefined;
    readonly content?: (ArrayBuffer | string) | undefined;
    readonly error?: string | undefined;
    constructor(correlationId: string, downloadId: number, operation: 'read' | 'copy' | 'move' | 'delete', success: boolean, filepath?: string | undefined, content?: (ArrayBuffer | string) | undefined, error?: string | undefined);
}
export declare class FileDownloadCompleted {
    readonly downloadId: number;
    readonly url: string;
    readonly filename: string;
    readonly filepath: string;
    readonly size: number;
    readonly mimeType?: string | undefined;
    constructor(downloadId: number, url: string, filename: string, filepath: string, size: number, mimeType?: string | undefined);
}
//# sourceMappingURL=download-events.d.ts.map