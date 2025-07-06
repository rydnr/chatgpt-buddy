/*
                        Web-Buddy Framework
                        Download Domain Events (Server)

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

/**
 * Server-side download events for file access bridging
 */

export class ServerFileAccessRequested {
    constructor(
        public readonly correlationId: string,
        public readonly downloadId: number,
        public readonly requestedOperation: 'read' | 'copy' | 'move' | 'delete',
        public readonly targetPath?: string
    ) {}
}

export class ServerFileAccessProvided {
    constructor(
        public readonly correlationId: string,
        public readonly downloadId: number,
        public readonly operation: 'read' | 'copy' | 'move' | 'delete',
        public readonly success: boolean,
        public readonly filepath?: string,
        public readonly content?: ArrayBuffer | string,
        public readonly error?: string
    ) {}
}

export class FileDownloadCompleted {
    constructor(
        public readonly downloadId: number,
        public readonly url: string,
        public readonly filename: string,
        public readonly filepath: string,
        public readonly size: number,
        public readonly mimeType?: string
    ) {}
}