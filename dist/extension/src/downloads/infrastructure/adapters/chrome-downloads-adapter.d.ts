import { Adapter } from '@typescript-eda/core';
import { FileDownloadProgress, ServerFileAccessRequested } from '../../domain/events/download-events';
/**
 * Chrome Downloads Adapter - Bridges Chrome Downloads API with domain events
 *
 * Responsibilities:
 * - Listen to Chrome downloads API events
 * - Convert Chrome download states to domain events
 * - Provide file system access for downloaded files
 * - Handle download interruptions and errors
 */
export declare class ChromeDownloadsAdapter extends Adapter {
    private activeDownloads;
    private downloadListeners;
    constructor();
    /**
     * Initializes Chrome Downloads API listeners
     */
    private initializeDownloadListeners;
    /**
     * Handles download state changes from Chrome API
     */
    private handleDownloadChange;
    /**
     * Applies download delta changes to cached download item
     */
    private applyDownloadDelta;
    /**
     * Emits progress event for download state changes
     */
    private emitProgressEvent;
    /**
     * Handles successful download completion
     */
    private handleDownloadCompleted;
    /**
     * Handles download failures
     */
    private handleDownloadFailed;
    /**
     * Registers a progress listener
     */
    addProgressListener(listener: (event: FileDownloadProgress) => void): void;
    /**
     * Removes a progress listener
     */
    removeProgressListener(listener: (event: FileDownloadProgress) => void): void;
    /**
     * Handles server file access requests
     */
    handleServerFileAccess(event: ServerFileAccessRequested): Promise<void>;
    /**
     * Handles file read operations (limited in browser context)
     */
    private handleFileRead;
    /**
     * Handles file copy operations
     */
    private handleFileCopy;
    /**
     * Handles file move operations
     */
    private handleFileMove;
    /**
     * Handles file delete operations
     */
    private handleFileDelete;
    /**
     * Gets current downloads status
     */
    getActiveDownloads(): Map<number, chrome.downloads.DownloadItem>;
    /**
     * Cleanup method
     */
    dispose(): void;
}
//# sourceMappingURL=chrome-downloads-adapter.d.ts.map