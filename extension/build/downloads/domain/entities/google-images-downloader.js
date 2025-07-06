/*
                        Web-Buddy Framework
                        Google Images Downloader Entity

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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { Entity, listen } from '@typescript-eda/core';
import { GoogleImageDownloadRequested, GoogleImageDownloadCompleted, FileDownloadRequested, FileDownloadFailed, DownloadPatternDetected } from '../events/download-events';
/**
 * Google Images Downloader Entity - Specialized downloader for Google Images
 *
 * Responsibilities:
 * - Handle Google Images-specific download patterns
 * - Extract high-resolution image URLs from Google Images interface
 * - Learn and apply download patterns for different image types
 * - Coordinate with training system for UI automation
 */
let GoogleImagesDownloader = (() => {
    var _a;
    let _classSuper = Entity;
    let _instanceExtraInitializers = [];
    let _downloadGoogleImage_decorators;
    let _recordDownloadCompletion_decorators;
    return _a = class GoogleImagesDownloader extends _classSuper {
            constructor() {
                super(...arguments);
                this.searchQuery = (__runInitializers(this, _instanceExtraInitializers), '');
                this.downloadedImages = new Map();
                this.learnedPatterns = new Map();
            }
            /**
             * Handles Google Images download requests
             */
            async downloadGoogleImage(event) {
                try {
                    this.searchQuery = event.searchQuery || '';
                    // Extract the highest resolution image URL
                    const imageUrl = await this.extractHighResImageUrl(event.imageElement);
                    if (!imageUrl) {
                        return new FileDownloadFailed(event.correlationId, event.imageElement.src, 'Could not extract high-resolution image URL');
                    }
                    // Generate a meaningful filename
                    const filename = this.generateImageFilename(event, imageUrl);
                    // Detect download pattern for learning
                    await this.detectDownloadPattern(event.imageElement, imageUrl);
                    // Create file download request
                    return new FileDownloadRequested(event.correlationId, imageUrl, filename, 'uniquify', false);
                }
                catch (error) {
                    return new FileDownloadFailed(event.correlationId, event.imageElement.src, error instanceof Error ? error.message : 'Google Images download failed');
                }
            }
            /**
             * Extracts high-resolution image URL from Google Images element
             */
            async extractHighResImageUrl(imageElement) {
                const originalSrc = imageElement.src;
                // Check if this is a Google Images thumbnail that needs resolution
                if (this.isGoogleImagesThumbnail(originalSrc)) {
                    return await this.resolveHighResolutionUrl(imageElement);
                }
                // If it's already a direct URL, use it
                if (this.isDirectImageUrl(originalSrc)) {
                    return originalSrc;
                }
                // Try to find the original URL in data attributes or click behavior
                return await this.findOriginalImageUrl(imageElement);
            }
            /**
             * Checks if URL is a Google Images thumbnail
             */
            isGoogleImagesThumbnail(url) {
                return url.includes('encrypted-tbn0.gstatic.com') ||
                    url.includes('googleusercontent.com') ||
                    url.includes('google.com/images') ||
                    url.includes('gstatic.com');
            }
            /**
             * Checks if URL is a direct image URL
             */
            isDirectImageUrl(url) {
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
                const lowerUrl = url.toLowerCase();
                return imageExtensions.some(ext => lowerUrl.includes(ext)) &&
                    !this.isGoogleImagesThumbnail(url);
            }
            /**
             * Resolves high-resolution URL from Google Images thumbnail
             */
            async resolveHighResolutionUrl(imageElement) {
                // Method 1: Check data attributes for original URL
                const dataOriginal = imageElement.getAttribute?.('data-src') ||
                    imageElement.getAttribute?.('data-original') ||
                    imageElement.getAttribute?.('data-url');
                if (dataOriginal && this.isDirectImageUrl(dataOriginal)) {
                    return dataOriginal;
                }
                // Method 2: Simulate click to trigger Google Images to load full res
                const fullResUrl = await this.simulateClickForFullRes(imageElement);
                if (fullResUrl) {
                    return fullResUrl;
                }
                // Method 3: Parse from Google Images URL structure
                return this.parseOriginalFromGoogleUrl(imageElement.src);
            }
            /**
             * Finds original image URL through DOM analysis
             */
            async findOriginalImageUrl(imageElement) {
                // Look for parent links that might contain the original URL
                const parentLink = imageElement.closest?.('a[href]');
                if (parentLink) {
                    const href = parentLink.href;
                    if (this.isDirectImageUrl(href)) {
                        return href;
                    }
                }
                // Check for nearby elements with image URLs
                const container = imageElement.closest?.('[data-imgurl], [data-src], [data-original]');
                if (container) {
                    const imgUrl = container.getAttribute('data-imgurl') ||
                        container.getAttribute('data-src') ||
                        container.getAttribute('data-original');
                    if (imgUrl && this.isDirectImageUrl(imgUrl)) {
                        return imgUrl;
                    }
                }
                return null;
            }
            /**
             * Simulates click to get full resolution image from Google Images
             */
            async simulateClickForFullRes(imageElement) {
                return new Promise((resolve) => {
                    // Set up mutation observer to detect when full-res image loads
                    const observer = new MutationObserver((mutations) => {
                        for (const mutation of mutations) {
                            if (mutation.type === 'childList') {
                                const addedNodes = Array.from(mutation.addedNodes);
                                for (const node of addedNodes) {
                                    if (node instanceof HTMLImageElement) {
                                        const src = node.src;
                                        if (src && this.isDirectImageUrl(src) && !this.isGoogleImagesThumbnail(src)) {
                                            observer.disconnect();
                                            resolve(src);
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    });
                    // Start observing
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                    // Simulate click
                    try {
                        imageElement.click?.();
                    }
                    catch (error) {
                        console.warn('Could not click image element:', error);
                    }
                    // Timeout after 3 seconds
                    setTimeout(() => {
                        observer.disconnect();
                        resolve(null);
                    }, 3000);
                });
            }
            /**
             * Attempts to parse original URL from Google Images URL structure
             */
            parseOriginalFromGoogleUrl(googleUrl) {
                try {
                    // Google Images often encodes the original URL in the thumbnail URL
                    const url = new URL(googleUrl);
                    // Check for 'imgurl' parameter in Google search URLs
                    const imgUrl = url.searchParams.get('imgurl');
                    if (imgUrl) {
                        return decodeURIComponent(imgUrl);
                    }
                    // Check for other common Google Images URL patterns
                    const pathSegments = url.pathname.split('/');
                    for (const segment of pathSegments) {
                        if (segment.startsWith('http') || segment.includes('.jpg') || segment.includes('.png')) {
                            try {
                                return decodeURIComponent(segment);
                            }
                            catch {
                                continue;
                            }
                        }
                    }
                    return null;
                }
                catch {
                    return null;
                }
            }
            /**
             * Generates appropriate filename for downloaded image
             */
            generateImageFilename(event, imageUrl) {
                // Use provided filename if available
                if (event.filename) {
                    return this.ensureImageExtension(event.filename, imageUrl);
                }
                // Generate filename from search query and image metadata
                let baseName = '';
                if (this.searchQuery) {
                    baseName = this.searchQuery.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
                }
                else if (event.imageElement.alt) {
                    baseName = event.imageElement.alt.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
                }
                else if (event.imageElement.title) {
                    baseName = event.imageElement.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
                }
                else {
                    baseName = 'google_image';
                }
                // Add timestamp for uniqueness
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
                const extension = this.extractImageExtension(imageUrl) || 'jpg';
                return `${baseName}_${timestamp}.${extension}`;
            }
            /**
             * Ensures filename has appropriate image extension
             */
            ensureImageExtension(filename, imageUrl) {
                const hasExtension = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename);
                if (hasExtension) {
                    return filename;
                }
                const extension = this.extractImageExtension(imageUrl) || 'jpg';
                return `${filename}.${extension}`;
            }
            /**
             * Extracts file extension from image URL
             */
            extractImageExtension(url) {
                const match = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
                return match ? match[1] : null;
            }
            /**
             * Detects and records download pattern for learning
             */
            async detectDownloadPattern(imageElement, resolvedUrl) {
                const selector = this.generateSelector(imageElement);
                const elementContext = this.extractElementContext(imageElement);
                const pageContext = this.extractPageContext();
                const patternEvent = new DownloadPatternDetected(resolvedUrl, selector, elementContext, pageContext);
                // Emit pattern detection event for learning system
                this.emit(patternEvent);
            }
            /**
             * Generates CSS selector for image element
             */
            generateSelector(element) {
                if (!element)
                    return '';
                const selectors = [];
                // ID selector (highest priority)
                if (element.id) {
                    selectors.push(`#${element.id}`);
                }
                // Class selector
                if (element.className) {
                    const classes = element.className.split(' ').filter(Boolean);
                    if (classes.length > 0) {
                        selectors.push(`.${classes.join('.')}`);
                    }
                }
                // Attribute selectors for Google Images
                if (element.src) {
                    selectors.push(`img[src*="${element.src.substring(0, 50)}"]`);
                }
                if (element.alt) {
                    selectors.push(`img[alt="${element.alt}"]`);
                }
                // Tag with position fallback
                const tagName = element.tagName?.toLowerCase() || 'img';
                selectors.push(tagName);
                return selectors[0] || 'img';
            }
            /**
             * Extracts element context for pattern learning
             */
            extractElementContext(element) {
                return {
                    tagName: element.tagName?.toLowerCase() || 'img',
                    className: element.className || '',
                    id: element.id || '',
                    textContent: element.alt || element.title || '',
                    href: element.src || '',
                    dimensions: {
                        width: element.naturalWidth || element.width || 0,
                        height: element.naturalHeight || element.height || 0
                    }
                };
            }
            /**
             * Extracts page context for pattern learning
             */
            extractPageContext() {
                return {
                    hostname: window.location.hostname,
                    pathname: window.location.pathname,
                    title: document.title,
                    isGoogleImages: window.location.hostname.includes('google.') &&
                        window.location.pathname.includes('/imghp')
                };
            }
            /**
             * Records successful download completion
             */
            recordDownloadCompletion(event) {
                this.downloadedImages.set(event.imageUrl, {
                    downloadId: event.downloadId,
                    filename: event.filename,
                    filepath: event.filepath,
                    metadata: event.metadata,
                    downloadedAt: new Date()
                });
                return Promise.resolve();
            }
            /**
             * Gets download statistics
             */
            getDownloadStats() {
                return {
                    totalDownloaded: this.downloadedImages.size,
                    currentSearchQuery: this.searchQuery,
                    learnedPatternsCount: this.learnedPatterns.size,
                    recentDownloads: Array.from(this.downloadedImages.values()).slice(-10)
                };
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _downloadGoogleImage_decorators = [listen(GoogleImageDownloadRequested)];
            _recordDownloadCompletion_decorators = [listen(GoogleImageDownloadCompleted)];
            __esDecorate(_a, null, _downloadGoogleImage_decorators, { kind: "method", name: "downloadGoogleImage", static: false, private: false, access: { has: obj => "downloadGoogleImage" in obj, get: obj => obj.downloadGoogleImage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _recordDownloadCompletion_decorators, { kind: "method", name: "recordDownloadCompletion", static: false, private: false, access: { has: obj => "recordDownloadCompletion" in obj, get: obj => obj.recordDownloadCompletion }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { GoogleImagesDownloader };
