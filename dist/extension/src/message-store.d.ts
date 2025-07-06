export interface MessageState {
    readonly timestamp: number;
    readonly type: string;
    readonly payload: any;
    readonly correlationId: string;
    readonly direction: 'inbound' | 'outbound';
    readonly status: 'pending' | 'success' | 'error';
    readonly response?: any;
    readonly error?: string;
    readonly metadata: {
        readonly extensionId: string;
        readonly tabId?: number;
        readonly windowId?: number;
        readonly url?: string;
        readonly userAgent: string;
    };
}
export interface MessageAction {
    readonly type: string;
    readonly payload: any;
    readonly meta?: {
        readonly timestamp: number;
        readonly correlationId: string;
        readonly direction: 'inbound' | 'outbound';
        readonly status: 'pending' | 'success' | 'error';
        readonly response?: any;
        readonly error?: string;
        readonly metadata: any;
    };
}
export interface MessageStoreState {
    readonly messages: ReadonlyArray<MessageState>;
    readonly currentIndex: number;
    readonly isTimeTraveling: boolean;
    readonly filters: {
        readonly types: ReadonlyArray<string>;
        readonly statuses: ReadonlyArray<'pending' | 'success' | 'error'>;
        readonly directions: ReadonlyArray<'inbound' | 'outbound'>;
        readonly dateRange: {
            from: number;
            to: number;
        } | null;
    };
}
export declare const MESSAGE_STORE_ACTIONS: {
    readonly ADD_MESSAGE: "MESSAGE_STORE/ADD_MESSAGE";
    readonly UPDATE_MESSAGE_STATUS: "MESSAGE_STORE/UPDATE_MESSAGE_STATUS";
    readonly TIME_TRAVEL_TO: "MESSAGE_STORE/TIME_TRAVEL_TO";
    readonly RESET_TIME_TRAVEL: "MESSAGE_STORE/RESET_TIME_TRAVEL";
    readonly SET_FILTERS: "MESSAGE_STORE/SET_FILTERS";
    readonly CLEAR_MESSAGES: "MESSAGE_STORE/CLEAR_MESSAGES";
    readonly LOAD_PERSISTED_MESSAGES: "MESSAGE_STORE/LOAD_PERSISTED_MESSAGES";
};
export declare const messageStoreActions: {
    addMessage: (message: Omit<MessageState, "timestamp" | "metadata">, metadata: MessageState["metadata"]) => MessageAction;
    updateMessageStatus: (correlationId: string, status: "success" | "error", response?: any, error?: string) => MessageAction;
    timeTravelTo: (index: number) => MessageAction;
    resetTimeTravel: () => MessageAction;
    setFilters: (filters: Partial<MessageStoreState["filters"]>) => MessageAction;
    clearMessages: () => MessageAction;
    loadPersistedMessages: (messages: ReadonlyArray<MessageState>) => MessageAction;
};
export declare function messageStoreReducer(state: MessageStoreState | undefined, action: MessageAction): MessageStoreState;
export declare const messageStoreSelectors: {
    getAllMessages: (state: MessageStoreState) => ReadonlyArray<MessageState>;
    getCurrentMessage: (state: MessageStoreState) => MessageState | null;
    getFilteredMessages: (state: MessageStoreState) => ReadonlyArray<MessageState>;
    getMessagesByType: (state: MessageStoreState, type: string) => ReadonlyArray<MessageState>;
    getMessagesByStatus: (state: MessageStoreState, status: "pending" | "success" | "error") => ReadonlyArray<MessageState>;
    getMessageByCorrelationId: (state: MessageStoreState, correlationId: string) => MessageState | undefined;
    isTimeTraveling: (state: MessageStoreState) => boolean;
    getCurrentIndex: (state: MessageStoreState) => number;
    getTotalMessageCount: (state: MessageStoreState) => number;
    getMessageStatistics: (state: MessageStoreState) => {
        total: number;
        success: number;
        error: number;
        pending: number;
        inbound: number;
        outbound: number;
        typeBreakdown: Record<string, number>;
    };
};
export declare class MessageStore {
    private state;
    private listeners;
    private persistenceKey;
    private maxStoredMessages;
    constructor();
    getState(): MessageStoreState;
    dispatch(action: MessageAction): void;
    subscribe(listener: (state: MessageStoreState) => void): () => void;
    private notifyListeners;
    private persistState;
    private loadPersistedState;
    addInboundMessage(type: string, payload: any, correlationId: string, metadata: MessageState['metadata']): void;
    addOutboundMessage(type: string, payload: any, correlationId: string, metadata: MessageState['metadata']): void;
    markMessageSuccess(correlationId: string, response?: any): void;
    markMessageError(correlationId: string, error: string): void;
    timeTravelTo(index: number): void;
    resetTimeTravel(): void;
    clearAllMessages(): void;
    canTimeTravelBack(): boolean;
    canTimeTravelForward(): boolean;
    timeTravelBack(): void;
    timeTravelForward(): void;
    exportMessages(): string;
    importMessages(jsonData: string): boolean;
}
export declare const globalMessageStore: MessageStore;
//# sourceMappingURL=message-store.d.ts.map