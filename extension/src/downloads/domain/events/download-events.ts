/*
                        Web-Buddy Framework
                        Download Domain Events

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

import { Event } from '@typescript-eda/core';

/**
 * Download Request Events - User/API initiated download operations
 */

export class FileDownloadRequested extends Event {
    constructor(
        public readonly correlationId: string,
        public readonly url: string,
        public readonly filename?: string,
        public readonly conflictAction?: 'uniquify' | 'overwrite' | 'prompt',
        public readonly saveAs?: boolean
    ) {
        super();
    }
}

export class FileDownloadStatusRequested extends Event {
    constructor(
        public readonly correlationId: string,
        public readonly downloadId?: number
    ) {
        super();
    }
}

export class FileDownloadListRequested extends Event {
    constructor(
        public readonly correlationId: string,
        public readonly query?: {
            orderBy?: string[];
            limit?: number;
            state?: 'in_progress' | 'interrupted' | 'complete';
        }
    ) {
        super();
    }
}

/**
 * Download State Events - Internal download lifecycle events
 */

export class FileDownloadStarted extends Event {
    constructor(
        public readonly correlationId: string,
        public readonly downloadId: number,
        public readonly url: string,
        public readonly filename: string
    ) {
        super();
    }
}

export class FileDownloadProgress extends Event {
    constructor(
        public readonly downloadId: number,
        public readonly url: string,
        public readonly filename: string,
        public readonly state: 'in_progress' | 'interrupted' | 'complete',
        public readonly bytesReceived: number,
        public readonly totalBytes: number,
        public readonly filepath?: string,
        public readonly error?: string
    ) {
        super();
    }
}

export class FileDownloadCompleted extends Event {
    constructor(
        public readonly downloadId: number,
        public readonly url: string,
        public readonly filename: string,
        public readonly filepath: string,
        public readonly size: number,
        public readonly mimeType?: string
    ) {
        super();
    }
}

export class FileDownloadFailed extends Event {
    constructor(
        public readonly correlationId: string,
        public readonly url: string,
        public readonly error: string,
        public readonly downloadId?: number
    ) {
        super();
    }
}

/**
 * Download Response Events - Information provision events
 */

export class DownloadStatusProvided extends Event {
    constructor(
        public readonly correlationId: string,
        public readonly status: {
            downloadId: number;
            url: string;
            filename: string;
            state: 'in_progress' | 'interrupted' | 'complete';
            bytesReceived: number;
            totalBytes: number;
            exists?: boolean;
            paused?: boolean;
            error?: string;
        }
    ) {
        super();
    }
}

export class DownloadListProvided extends Event {
    constructor(
        public readonly correlationId: string,
        public readonly downloads: Array<{
            id: number;
            url: string;
            filename: string;
            state: 'in_progress' | 'interrupted' | 'complete';
            bytesReceived: number;
            totalBytes: number;
            startTime: string;
            endTime?: string;
        }>
    ) {
        super();
    }
}

/**
 * Training Integration Events - Download pattern learning
 */

export class DownloadPatternDetected extends Event {
    constructor(
        public readonly url: string,
        public readonly selector: string,
        public readonly elementContext: {
            tagName: string;
            className?: string;
            id?: string;
            textContent?: string;
            href?: string;
        },
        public readonly pageContext: {
            hostname: string;
            pathname: string;
            title: string;
        }
    ) {
        super();
    }
}

export class DownloadPatternLearned extends Event {
    constructor(
        public readonly patternId: string,
        public readonly url: string,
        public readonly selector: string,
        public readonly context: object,
        public readonly confidence: number
    ) {
        super();
    }
}

export class DownloadPatternExecuted extends Event {
    constructor(
        public readonly patternId: string,
        public readonly downloadId: number,
        public readonly success: boolean,
        public readonly executionTime: number
    ) {
        super();
    }
}

/**
 * Server Integration Events - File access bridging
 */

export class ServerFileAccessRequested extends Event {
    constructor(
        public readonly correlationId: string,
        public readonly downloadId: number,
        public readonly requestedOperation: 'read' | 'copy' | 'move' | 'delete',
        public readonly targetPath?: string
    ) {
        super();
    }
}

export class ServerFileAccessProvided extends Event {
    constructor(
        public readonly correlationId: string,
        public readonly downloadId: number,
        public readonly operation: 'read' | 'copy' | 'move' | 'delete',
        public readonly success: boolean,
        public readonly filepath?: string,
        public readonly content?: ArrayBuffer | string,
        public readonly error?: string
    ) {
        super();
    }
}

/**
 * Google Images Integration Events - Specific to POC
 */

export class GoogleImageDownloadRequested extends Event {
    constructor(
        public readonly correlationId: string,
        public readonly imageElement: {
            src: string;
            alt?: string;
            title?: string;
            width?: number;
            height?: number;
        },
        public readonly searchQuery?: string,
        public readonly filename?: string
    ) {
        super();
    }
}

export class GoogleImageDownloadCompleted extends Event {
    constructor(
        public readonly correlationId: string,
        public readonly downloadId: number,
        public readonly imageUrl: string,
        public readonly filename: string,
        public readonly filepath: string,
        public readonly metadata: {
            searchQuery?: string;
            alt?: string;
            title?: string;
            dimensions?: { width: number; height: number };
            size: number;
        }
    ) {
        super();
    }
}