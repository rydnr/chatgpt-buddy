import { Entity } from '@typescript-eda/core';
import { FileDownloadRequested, FileDownloadStarted, FileDownloadFailed, FileDownloadProgress, FileDownloadStatusRequested, FileDownloadListRequested, DownloadStatusProvided, DownloadListProvided } from '../events/download-events';
/**
 * FileDownload Entity - Manages file download operations and state
 *
 * Responsibilities:
 * - Handle download initiation through Chrome Downloads API
 * - Track download progress and state changes
 * - Provide download status and list management
 * - Coordinate with training system for learned download patterns
 */
export declare class FileDownload extends Entity<FileDownload> {
    private downloadId;
    private url;
    private filename;
    private state;
    private bytesReceived;
    private totalBytes;
    private error;
    private startTime;
    private endTime;
    private filepath;
    /**
     * Initiates a file download
     */
    startDownload(event: FileDownloadRequested): Promise<FileDownloadStarted | FileDownloadFailed>;
    /**
     * Updates download progress (typically called by Chrome Downloads API listeners)
     */
    updateProgress(event: FileDownloadProgress): Promise<void>;
    /**
     * Provides download status information
     */
    getDownloadStatus(event: FileDownloadStatusRequested): Promise<DownloadStatusProvided>;
    /**
     * Provides list of downloads based on query criteria
     */
    getDownloadsList(event: FileDownloadListRequested): Promise<DownloadListProvided>;
    /**
     * Extracts filename from URL if not provided
     */
    private extractFilenameFromUrl;
    /**
     * Gets the current download state
     */
    getState(): 'pending' | 'in_progress' | 'interrupted' | 'complete';
    /**
     * Gets the download progress as percentage
     */
    getProgressPercentage(): number;
    /**
     * Gets the download file path (available after completion)
     */
    getFilepath(): string;
    /**
     * Checks if download is complete and file exists
     */
    isCompleted(): boolean;
}
//# sourceMappingURL=file-download.d.ts.map