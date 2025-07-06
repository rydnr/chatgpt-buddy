interface ConnectionStatus {
    connected: boolean;
    connecting: boolean;
    serverUrl: string;
    extensionId: string;
    lastMessage: string;
    lastError: string;
}
declare class PopupController {
    private toggleButton;
    private statusDot;
    private statusText;
    private serverInput;
    private extensionIdElement;
    private currentTabElement;
    private lastMessageElement;
    private logPanel;
    private status;
    constructor();
    private initializeElements;
    private bindEvents;
    private loadInitialData;
    private handleToggleConnection;
    private handleServerUrlChange;
    private isValidWebSocketUrl;
    private sendToBackground;
    private requestStatusFromBackground;
    private updateStatus;
    private updateConnectionIndicator;
    private updateToggleButton;
    private addLog;
    private startStatusPolling;
}
//# sourceMappingURL=popup.d.ts.map