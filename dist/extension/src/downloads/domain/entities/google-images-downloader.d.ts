import { Entity } from '@typescript-eda/core';
import { GoogleImageDownloadRequested, GoogleImageDownloadCompleted, FileDownloadRequested, FileDownloadFailed } from '../events/download-events';
/**
 * Google Images Downloader Entity - Specialized downloader for Google Images
 *
 * Responsibilities:
 * - Handle Google Images-specific download patterns
 * - Extract high-resolution image URLs from Google Images interface
 * - Learn and apply download patterns for different image types
 * - Coordinate with training system for UI automation
 */
export declare class GoogleImagesDownloader extends Entity<GoogleImagesDownloader> {
    private searchQuery;
    private downloadedImages;
    private learnedPatterns;
    /**
     * Handles Google Images download requests
     */
    downloadGoogleImage(event: GoogleImageDownloadRequested): Promise<FileDownloadRequested | FileDownloadFailed>;
    /**
     * Extracts high-resolution image URL from Google Images element
     */
    private extractHighResImageUrl;
    /**
     * Checks if URL is a Google Images thumbnail
     */
    private isGoogleImagesThumbnail;
    /**
     * Checks if URL is a direct image URL
     */
    private isDirectImageUrl;
    /**
     * Resolves high-resolution URL from Google Images thumbnail
     */
    private resolveHighResolutionUrl;
    /**
     * Finds original image URL through DOM analysis
     */
    private findOriginalImageUrl;
    /**
     * Simulates click to get full resolution image from Google Images
     */
    private simulateClickForFullRes;
    /**
     * Attempts to parse original URL from Google Images URL structure
     */
    private parseOriginalFromGoogleUrl;
    /**
     * Generates appropriate filename for downloaded image
     */
    private generateImageFilename;
    /**
     * Ensures filename has appropriate image extension
     */
    private ensureImageExtension;
    /**
     * Extracts file extension from image URL
     */
    private extractImageExtension;
    /**
     * Detects and records download pattern for learning
     */
    private detectDownloadPattern;
    /**
     * Generates CSS selector for image element
     */
    private generateSelector;
    /**
     * Extracts element context for pattern learning
     */
    private extractElementContext;
    /**
     * Extracts page context for pattern learning
     */
    private extractPageContext;
    /**
     * Records successful download completion
     */
    recordDownloadCompletion(event: GoogleImageDownloadCompleted): Promise<void>;
    /**
     * Gets download statistics
     */
    getDownloadStats(): object;
}
//# sourceMappingURL=google-images-downloader.d.ts.map