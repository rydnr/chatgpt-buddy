import { Event } from '@typescript-eda/core';
/**
 * Download Request Events - User/API initiated download operations
 */
export declare class FileDownloadRequested extends Event {
    readonly correlationId: string;
    readonly url: string;
    readonly filename?: string | undefined;
    readonly conflictAction?: "uniquify" | "overwrite" | "prompt" | undefined;
    readonly saveAs?: boolean | undefined;
    constructor(correlationId: string, url: string, filename?: string | undefined, conflictAction?: "uniquify" | "overwrite" | "prompt" | undefined, saveAs?: boolean | undefined);
}
export declare class FileDownloadStatusRequested extends Event {
    readonly correlationId: string;
    readonly downloadId?: number | undefined;
    constructor(correlationId: string, downloadId?: number | undefined);
}
export declare class FileDownloadListRequested extends Event {
    readonly correlationId: string;
    readonly query?: {
        orderBy?: string[];
        limit?: number;
        state?: "in_progress" | "interrupted" | "complete";
    } | undefined;
    constructor(correlationId: string, query?: {
        orderBy?: string[];
        limit?: number;
        state?: "in_progress" | "interrupted" | "complete";
    } | undefined);
}
/**
 * Download State Events - Internal download lifecycle events
 */
export declare class FileDownloadStarted extends Event {
    readonly correlationId: string;
    readonly downloadId: number;
    readonly url: string;
    readonly filename: string;
    constructor(correlationId: string, downloadId: number, url: string, filename: string);
}
export declare class FileDownloadProgress extends Event {
    readonly downloadId: number;
    readonly url: string;
    readonly filename: string;
    readonly state: 'in_progress' | 'interrupted' | 'complete';
    readonly bytesReceived: number;
    readonly totalBytes: number;
    readonly filepath?: string | undefined;
    readonly error?: string | undefined;
    constructor(downloadId: number, url: string, filename: string, state: 'in_progress' | 'interrupted' | 'complete', bytesReceived: number, totalBytes: number, filepath?: string | undefined, error?: string | undefined);
}
export declare class FileDownloadCompleted extends Event {
    readonly downloadId: number;
    readonly url: string;
    readonly filename: string;
    readonly filepath: string;
    readonly size: number;
    readonly mimeType?: string | undefined;
    constructor(downloadId: number, url: string, filename: string, filepath: string, size: number, mimeType?: string | undefined);
}
export declare class FileDownloadFailed extends Event {
    readonly correlationId: string;
    readonly url: string;
    readonly error: string;
    readonly downloadId?: number | undefined;
    constructor(correlationId: string, url: string, error: string, downloadId?: number | undefined);
}
/**
 * Download Response Events - Information provision events
 */
export declare class DownloadStatusProvided extends Event {
    readonly correlationId: string;
    readonly status: {
        downloadId: number;
        url: string;
        filename: string;
        state: 'in_progress' | 'interrupted' | 'complete';
        bytesReceived: number;
        totalBytes: number;
        exists?: boolean;
        paused?: boolean;
        error?: string;
    };
    constructor(correlationId: string, status: {
        downloadId: number;
        url: string;
        filename: string;
        state: 'in_progress' | 'interrupted' | 'complete';
        bytesReceived: number;
        totalBytes: number;
        exists?: boolean;
        paused?: boolean;
        error?: string;
    });
}
export declare class DownloadListProvided extends Event {
    readonly correlationId: string;
    readonly downloads: Array<{
        id: number;
        url: string;
        filename: string;
        state: 'in_progress' | 'interrupted' | 'complete';
        bytesReceived: number;
        totalBytes: number;
        startTime: string;
        endTime?: string;
    }>;
    constructor(correlationId: string, downloads: Array<{
        id: number;
        url: string;
        filename: string;
        state: 'in_progress' | 'interrupted' | 'complete';
        bytesReceived: number;
        totalBytes: number;
        startTime: string;
        endTime?: string;
    }>);
}
/**
 * Training Integration Events - Download pattern learning
 */
export declare class DownloadPatternDetected extends Event {
    readonly url: string;
    readonly selector: string;
    readonly elementContext: {
        tagName: string;
        className?: string;
        id?: string;
        textContent?: string;
        href?: string;
    };
    readonly pageContext: {
        hostname: string;
        pathname: string;
        title: string;
    };
    constructor(url: string, selector: string, elementContext: {
        tagName: string;
        className?: string;
        id?: string;
        textContent?: string;
        href?: string;
    }, pageContext: {
        hostname: string;
        pathname: string;
        title: string;
    });
}
export declare class DownloadPatternLearned extends Event {
    readonly patternId: string;
    readonly url: string;
    readonly selector: string;
    readonly context: object;
    readonly confidence: number;
    constructor(patternId: string, url: string, selector: string, context: object, confidence: number);
}
export declare class DownloadPatternExecuted extends Event {
    readonly patternId: string;
    readonly downloadId: number;
    readonly success: boolean;
    readonly executionTime: number;
    constructor(patternId: string, downloadId: number, success: boolean, executionTime: number);
}
/**
 * Server Integration Events - File access bridging
 */
export declare class ServerFileAccessRequested extends Event {
    readonly correlationId: string;
    readonly downloadId: number;
    readonly requestedOperation: 'read' | 'copy' | 'move' | 'delete';
    readonly targetPath?: string | undefined;
    constructor(correlationId: string, downloadId: number, requestedOperation: 'read' | 'copy' | 'move' | 'delete', targetPath?: string | undefined);
}
export declare class ServerFileAccessProvided extends Event {
    readonly correlationId: string;
    readonly downloadId: number;
    readonly operation: 'read' | 'copy' | 'move' | 'delete';
    readonly success: boolean;
    readonly filepath?: string | undefined;
    readonly content?: (ArrayBuffer | string) | undefined;
    readonly error?: string | undefined;
    constructor(correlationId: string, downloadId: number, operation: 'read' | 'copy' | 'move' | 'delete', success: boolean, filepath?: string | undefined, content?: (ArrayBuffer | string) | undefined, error?: string | undefined);
}
/**
 * Google Images Integration Events - Specific to POC
 */
export declare class GoogleImageDownloadRequested extends Event {
    readonly correlationId: string;
    readonly imageElement: {
        src: string;
        alt?: string;
        title?: string;
        width?: number;
        height?: number;
    };
    readonly searchQuery?: string | undefined;
    readonly filename?: string | undefined;
    constructor(correlationId: string, imageElement: {
        src: string;
        alt?: string;
        title?: string;
        width?: number;
        height?: number;
    }, searchQuery?: string | undefined, filename?: string | undefined);
}
export declare class GoogleImageDownloadCompleted extends Event {
    readonly correlationId: string;
    readonly downloadId: number;
    readonly imageUrl: string;
    readonly filename: string;
    readonly filepath: string;
    readonly metadata: {
        searchQuery?: string;
        alt?: string;
        title?: string;
        dimensions?: {
            width: number;
            height: number;
        };
        size: number;
    };
    constructor(correlationId: string, downloadId: number, imageUrl: string, filename: string, filepath: string, metadata: {
        searchQuery?: string;
        alt?: string;
        title?: string;
        dimensions?: {
            width: number;
            height: number;
        };
        size: number;
    });
}
//# sourceMappingURL=download-events.d.ts.map