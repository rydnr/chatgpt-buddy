import { Adapter } from '@typescript-eda/core';
import { ServerFileAccessRequested } from '../../domain/events/download-events';
/**
 * File Access Bridge Adapter - Bridges browser downloads with server file system
 *
 * Responsibilities:
 * - Provide server-side access to browser-downloaded files
 * - Handle file operations requested by clients (read, copy, move, delete)
 * - Manage download directory monitoring and file indexing
 * - Bridge the gap between browser-constrained downloads and server file access
 */
export declare class FileAccessBridgeAdapter extends Adapter {
    private downloadDirectory;
    private downloadIndex;
    private watchers;
    constructor(downloadDirectory?: string);
    /**
     * Gets the default download directory for the current platform
     */
    private getDefaultDownloadDirectory;
    /**
     * Initializes file system watching for download directory
     */
    private initializeFileWatching;
    /**
     * Handles file changes in download directory
     */
    private handleFileChange;
    /**
     * Indexes a newly downloaded file
     */
    private indexDownloadedFile;
    /**
     * Removes file from index
     */
    private removeFromIndex;
    /**
     * Handles server file access requests from clients
     */
    handleFileAccessRequest(event: ServerFileAccessRequested): Promise<void>;
    /**
     * Handles file read operations
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
     * Sends error response for failed operations
     */
    private sendErrorResponse;
    /**
     * Checks if file exists
     */
    private fileExists;
    /**
     * Generates copy path for file
     */
    private generateCopyPath;
    /**
     * Generates move path for file
     */
    private generateMovePath;
    /**
     * Gets MIME type from file extension
     */
    private getMimeType;
    /**
     * Gets download statistics
     */
    getDownloadStats(): object;
    /**
     * Calculates size distribution of downloads
     */
    private calculateSizeDistribution;
    /**
     * Manually registers a download (for browser downloads detected by extension)
     */
    registerDownload(downloadInfo: Partial<DownloadedFileInfo>): Promise<number>;
    /**
     * Cleanup method
     */
    dispose(): void;
}
/**
 * Interface for downloaded file information
 */
interface DownloadedFileInfo {
    id: number;
    filename: string;
    filepath: string;
    size: number;
    downloadedAt: Date;
    mimeType: string;
    accessible: boolean;
}
export {};
//# sourceMappingURL=file-access-bridge-adapter.d.ts.map