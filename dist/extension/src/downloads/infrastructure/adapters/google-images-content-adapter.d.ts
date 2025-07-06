import { Adapter } from '@typescript-eda/core';
/**
 * Google Images Content Adapter - Handles Google Images page interactions
 *
 * Responsibilities:
 * - Detect Google Images page and inject download functionality
 * - Handle image right-click and download requests
 * - Monitor for new images loaded dynamically
 * - Integrate with training system for pattern learning
 */
export declare class GoogleImagesContentAdapter extends Adapter {
    private downloader;
    private isGoogleImagesPage;
    private downloadButtons;
    private observer;
    constructor();
    /**
     * Initializes the adapter and checks if we're on Google Images
     */
    private initialize;
    /**
     * Detects if current page is Google Images
     */
    private detectGoogleImagesPage;
    /**
     * Sets up Google Images specific functionality
     */
    private setupGoogleImagesIntegration;
    /**
     * Adds download buttons to visible images
     */
    private addDownloadButtonsToImages;
    /**
     * Finds Google Images on the page
     */
    private findGoogleImages;
    /**
     * Adds download button to individual image
     */
    private addDownloadButton;
    /**
     * Creates container for download button
     */
    private createImageContainer;
    /**
     * Creates download button for image
     */
    private createDownloadButton;
    /**
     * Positions download button relative to image
     */
    private positionDownloadButton;
    /**
     * Sets up monitoring for dynamically loaded images
     */
    private setupImageMonitoring;
    /**
     * Adds context menu handlers for images
     */
    private addContextMenuHandlers;
    /**
     * Checks if image is a Google Images result
     */
    private isGoogleImage;
    /**
     * Shows custom context menu with download option
     */
    private showCustomContextMenu;
    /**
     * Sets up keyboard shortcuts for downloads
     */
    private setupKeyboardShortcuts;
    /**
     * Finds currently hovered image
     */
    private findHoveredImage;
    /**
     * Handles image download request
     */
    private handleImageDownload;
    /**
     * Extracts current search query from Google Images page
     */
    private extractSearchQuery;
    /**
     * Shows visual feedback for download status
     */
    private showDownloadFeedback;
    /**
     * Sends message to background script
     */
    private sendToBackground;
    /**
     * Generates unique correlation ID
     */
    private generateCorrelationId;
    /**
     * Cleanup method
     */
    dispose(): void;
}
//# sourceMappingURL=google-images-content-adapter.d.ts.map