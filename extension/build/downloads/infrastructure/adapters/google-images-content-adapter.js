/*
                        Web-Buddy Framework
                        Google Images Content Script Adapter

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
import { GoogleImageDownloadRequested, FileDownloadRequested } from '../../domain/events/download-events';
import { GoogleImagesDownloader } from '../../domain/entities/google-images-downloader';
/**
 * Google Images Content Adapter - Handles Google Images page interactions
 *
 * Responsibilities:
 * - Detect Google Images page and inject download functionality
 * - Handle image right-click and download requests
 * - Monitor for new images loaded dynamically
 * - Integrate with training system for pattern learning
 */
export class GoogleImagesContentAdapter extends Adapter {
    constructor() {
        super();
        this.isGoogleImagesPage = false;
        this.downloadButtons = new Map();
        this.observer = null;
        this.downloader = new GoogleImagesDownloader();
        this.initialize();
    }
    /**
     * Initializes the adapter and checks if we're on Google Images
     */
    initialize() {
        this.isGoogleImagesPage = this.detectGoogleImagesPage();
        if (this.isGoogleImagesPage) {
            this.setupGoogleImagesIntegration();
        }
    }
    /**
     * Detects if current page is Google Images
     */
    detectGoogleImagesPage() {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        const search = window.location.search;
        return (hostname.includes('google.') &&
            (pathname.includes('/imghp') ||
                pathname.includes('/search') && search.includes('tbm=isch'))) ||
            document.title.toLowerCase().includes('google images');
    }
    /**
     * Sets up Google Images specific functionality
     */
    setupGoogleImagesIntegration() {
        this.addDownloadButtonsToImages();
        this.setupImageMonitoring();
        this.addContextMenuHandlers();
        this.setupKeyboardShortcuts();
    }
    /**
     * Adds download buttons to visible images
     */
    addDownloadButtonsToImages() {
        const images = this.findGoogleImages();
        images.forEach(img => {
            if (!this.downloadButtons.has(img)) {
                this.addDownloadButton(img);
            }
        });
    }
    /**
     * Finds Google Images on the page
     */
    findGoogleImages() {
        const selectors = [
            'img[data-src]', // Lazy loaded images
            'img[src*="googleusercontent.com"]', // Google hosted images
            'img[src*="gstatic.com"]', // Google static images
            '.islrc img', // Images in search results
            '.rg_i', // Result grid images
            'img[jsname]' // Google's internal images
        ];
        const images = [];
        selectors.forEach(selector => {
            const found = document.querySelectorAll(selector);
            images.push(...Array.from(found));
        });
        // Filter for actual images
        return images.filter(img => {
            return img.src &&
                (img.naturalWidth > 50 || img.width > 50) && // Minimum size
                (img.naturalHeight > 50 || img.height > 50);
        });
    }
    /**
     * Adds download button to individual image
     */
    addDownloadButton(img) {
        const container = this.createImageContainer(img);
        const downloadButton = this.createDownloadButton(img);
        container.appendChild(downloadButton);
        this.downloadButtons.set(img, downloadButton);
        // Position the container over the image
        this.positionDownloadButton(img, container);
    }
    /**
     * Creates container for download button
     */
    createImageContainer(img) {
        const container = document.createElement('div');
        container.className = 'web-buddy-download-container';
        container.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            z-index: 10000;
            pointer-events: none;
        `;
        // Insert container relative to image
        img.parentElement?.appendChild(container);
        return container;
    }
    /**
     * Creates download button for image
     */
    createDownloadButton(img) {
        const button = document.createElement('button');
        button.innerHTML = '📥'; // Download emoji
        button.title = 'Download Image with Web-Buddy';
        button.className = 'web-buddy-download-btn';
        button.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border: none;
            border-radius: 4px;
            width: 32px;
            height: 32px;
            cursor: pointer;
            font-size: 16px;
            margin: 4px;
            pointer-events: auto;
            transition: background-color 0.2s;
        `;
        // Hover effects
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgba(0, 0, 0, 1)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        });
        // Click handler
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleImageDownload(img);
        });
        return button;
    }
    /**
     * Positions download button relative to image
     */
    positionDownloadButton(img, container) {
        const updatePosition = () => {
            const imgRect = img.getBoundingClientRect();
            const parentRect = img.parentElement?.getBoundingClientRect();
            if (parentRect) {
                container.style.left = `${imgRect.right - parentRect.left - 40}px`;
                container.style.top = `${imgRect.top - parentRect.top + 4}px`;
            }
        };
        // Initial positioning
        updatePosition();
        // Update position on scroll/resize
        window.addEventListener('scroll', updatePosition);
        window.addEventListener('resize', updatePosition);
    }
    /**
     * Sets up monitoring for dynamically loaded images
     */
    setupImageMonitoring() {
        this.observer = new MutationObserver((mutations) => {
            let newImagesFound = false;
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node instanceof HTMLImageElement ||
                            (node instanceof HTMLElement && node.querySelector('img'))) {
                            newImagesFound = true;
                        }
                    });
                }
            });
            if (newImagesFound) {
                // Debounce to avoid excessive calls
                setTimeout(() => {
                    this.addDownloadButtonsToImages();
                }, 500);
            }
        });
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    /**
     * Adds context menu handlers for images
     */
    addContextMenuHandlers() {
        document.addEventListener('contextmenu', (e) => {
            const target = e.target;
            if (target instanceof HTMLImageElement && this.isGoogleImage(target)) {
                this.showCustomContextMenu(e, target);
            }
        });
    }
    /**
     * Checks if image is a Google Images result
     */
    isGoogleImage(img) {
        return img.src.includes('googleusercontent.com') ||
            img.src.includes('gstatic.com') ||
            img.closest('.islrc, .rg_i') !== null ||
            img.hasAttribute('jsname');
    }
    /**
     * Shows custom context menu with download option
     */
    showCustomContextMenu(e, img) {
        e.preventDefault();
        const menu = document.createElement('div');
        menu.className = 'web-buddy-context-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${e.clientY}px;
            left: ${e.clientX}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10001;
            min-width: 200px;
        `;
        const downloadOption = document.createElement('div');
        downloadOption.innerHTML = '📥 Download with Web-Buddy';
        downloadOption.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
        `;
        downloadOption.addEventListener('click', () => {
            this.handleImageDownload(img);
            document.body.removeChild(menu);
        });
        downloadOption.addEventListener('mouseenter', () => {
            downloadOption.style.backgroundColor = '#f5f5f5';
        });
        downloadOption.addEventListener('mouseleave', () => {
            downloadOption.style.backgroundColor = 'white';
        });
        menu.appendChild(downloadOption);
        document.body.appendChild(menu);
        // Remove menu on click outside
        const removeMenu = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', removeMenu);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', removeMenu);
        }, 100);
    }
    /**
     * Sets up keyboard shortcuts for downloads
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+D to download focused/hovered image
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                const hoveredImg = this.findHoveredImage();
                if (hoveredImg) {
                    this.handleImageDownload(hoveredImg);
                }
            }
        });
    }
    /**
     * Finds currently hovered image
     */
    findHoveredImage() {
        const elements = document.querySelectorAll(':hover');
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            if (element instanceof HTMLImageElement && this.isGoogleImage(element)) {
                return element;
            }
        }
        return null;
    }
    /**
     * Handles image download request
     */
    async handleImageDownload(img) {
        try {
            // Extract search query from page
            const searchQuery = this.extractSearchQuery();
            // Create download request event
            const downloadEvent = new GoogleImageDownloadRequested(this.generateCorrelationId(), {
                src: img.src,
                alt: img.alt,
                title: img.title,
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height
            }, searchQuery);
            // Show download feedback
            this.showDownloadFeedback(img, 'Downloading...');
            // Process through downloader entity
            const result = await this.downloader.downloadGoogleImage(downloadEvent);
            if (result instanceof FileDownloadRequested) {
                // Send to background script for actual download
                this.sendToBackground({
                    action: 'DOWNLOAD_FILE',
                    payload: {
                        url: result.url,
                        filename: result.filename,
                        conflictAction: result.conflictAction,
                        saveAs: result.saveAs
                    },
                    correlationId: downloadEvent.correlationId
                });
                this.showDownloadFeedback(img, 'Download started!');
            }
            else {
                this.showDownloadFeedback(img, 'Download failed!', true);
            }
        }
        catch (error) {
            console.error('Google Images download error:', error);
            this.showDownloadFeedback(img, 'Download error!', true);
        }
    }
    /**
     * Extracts current search query from Google Images page
     */
    extractSearchQuery() {
        // Try to get search query from URL
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) {
            return query;
        }
        // Try to get from search input
        const searchInput = document.querySelector('input[name="q"]');
        if (searchInput && searchInput.value) {
            return searchInput.value;
        }
        // Try to get from page title
        const title = document.title;
        const match = title.match(/^(.+?)\s*-\s*Google/);
        if (match) {
            return match[1];
        }
        return 'google_search';
    }
    /**
     * Shows visual feedback for download status
     */
    showDownloadFeedback(img, message, isError = false) {
        const feedback = document.createElement('div');
        feedback.textContent = message;
        feedback.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${isError ? '#f44336' : '#4CAF50'};
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10002;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        // Position relative to image
        const imgContainer = img.parentElement;
        if (imgContainer) {
            imgContainer.style.position = 'relative';
            imgContainer.appendChild(feedback);
            // Animate in
            setTimeout(() => {
                feedback.style.opacity = '1';
            }, 100);
            // Remove after delay
            setTimeout(() => {
                feedback.style.opacity = '0';
                setTimeout(() => {
                    if (feedback.parentElement) {
                        feedback.parentElement.removeChild(feedback);
                    }
                }, 300);
            }, 2000);
        }
    }
    /**
     * Sends message to background script
     */
    sendToBackground(message) {
        chrome.runtime.sendMessage(message);
    }
    /**
     * Generates unique correlation ID
     */
    generateCorrelationId() {
        return `google-images-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Cleanup method
     */
    dispose() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.downloadButtons.clear();
        // Remove all download containers
        const containers = document.querySelectorAll('.web-buddy-download-container');
        containers.forEach(container => {
            container.parentElement?.removeChild(container);
        });
    }
}
