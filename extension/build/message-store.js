// Action types
export const MESSAGE_STORE_ACTIONS = {
    ADD_MESSAGE: 'MESSAGE_STORE/ADD_MESSAGE',
    UPDATE_MESSAGE_STATUS: 'MESSAGE_STORE/UPDATE_MESSAGE_STATUS',
    TIME_TRAVEL_TO: 'MESSAGE_STORE/TIME_TRAVEL_TO',
    RESET_TIME_TRAVEL: 'MESSAGE_STORE/RESET_TIME_TRAVEL',
    SET_FILTERS: 'MESSAGE_STORE/SET_FILTERS',
    CLEAR_MESSAGES: 'MESSAGE_STORE/CLEAR_MESSAGES',
    LOAD_PERSISTED_MESSAGES: 'MESSAGE_STORE/LOAD_PERSISTED_MESSAGES'
};
// Action creators
export const messageStoreActions = {
    addMessage: (message, metadata) => ({
        type: MESSAGE_STORE_ACTIONS.ADD_MESSAGE,
        payload: message,
        meta: {
            timestamp: Date.now(),
            correlationId: message.correlationId,
            direction: message.direction,
            status: message.status,
            response: message.response,
            error: message.error,
            metadata
        }
    }),
    updateMessageStatus: (correlationId, status, response, error) => ({
        type: MESSAGE_STORE_ACTIONS.UPDATE_MESSAGE_STATUS,
        payload: { correlationId, status, response, error },
        meta: {
            timestamp: Date.now(),
            correlationId,
            direction: 'outbound',
            status,
            response,
            error,
            metadata: {}
        }
    }),
    timeTravelTo: (index) => ({
        type: MESSAGE_STORE_ACTIONS.TIME_TRAVEL_TO,
        payload: { index },
        meta: {
            timestamp: Date.now(),
            correlationId: `time-travel-${Date.now()}`,
            direction: 'inbound',
            status: 'success',
            metadata: {}
        }
    }),
    resetTimeTravel: () => ({
        type: MESSAGE_STORE_ACTIONS.RESET_TIME_TRAVEL,
        payload: {},
        meta: {
            timestamp: Date.now(),
            correlationId: `reset-time-travel-${Date.now()}`,
            direction: 'inbound',
            status: 'success',
            metadata: {}
        }
    }),
    setFilters: (filters) => ({
        type: MESSAGE_STORE_ACTIONS.SET_FILTERS,
        payload: filters,
        meta: {
            timestamp: Date.now(),
            correlationId: `set-filters-${Date.now()}`,
            direction: 'inbound',
            status: 'success',
            metadata: {}
        }
    }),
    clearMessages: () => ({
        type: MESSAGE_STORE_ACTIONS.CLEAR_MESSAGES,
        payload: {},
        meta: {
            timestamp: Date.now(),
            correlationId: `clear-messages-${Date.now()}`,
            direction: 'inbound',
            status: 'success',
            metadata: {}
        }
    }),
    loadPersistedMessages: (messages) => ({
        type: MESSAGE_STORE_ACTIONS.LOAD_PERSISTED_MESSAGES,
        payload: { messages },
        meta: {
            timestamp: Date.now(),
            correlationId: `load-persisted-${Date.now()}`,
            direction: 'inbound',
            status: 'success',
            metadata: {}
        }
    })
};
// Initial state
const initialState = {
    messages: [],
    currentIndex: -1,
    isTimeTraveling: false,
    filters: {
        types: [],
        statuses: [],
        directions: [],
        dateRange: null
    }
};
// Reducer
export function messageStoreReducer(state = initialState, action) {
    switch (action.type) {
        case MESSAGE_STORE_ACTIONS.ADD_MESSAGE: {
            const newMessage = {
                ...action.payload,
                timestamp: action.meta.timestamp,
                metadata: action.meta.metadata
            };
            return {
                ...state,
                messages: [...state.messages, newMessage],
                currentIndex: state.isTimeTraveling ? state.currentIndex : state.messages.length
            };
        }
        case MESSAGE_STORE_ACTIONS.UPDATE_MESSAGE_STATUS: {
            const { correlationId, status, response, error } = action.payload;
            const messageIndex = state.messages.findIndex(msg => msg.correlationId === correlationId);
            if (messageIndex === -1)
                return state;
            const updatedMessages = [...state.messages];
            updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                status,
                response,
                error
            };
            return {
                ...state,
                messages: updatedMessages
            };
        }
        case MESSAGE_STORE_ACTIONS.TIME_TRAVEL_TO: {
            const { index } = action.payload;
            if (index < 0 || index >= state.messages.length) {
                return state;
            }
            return {
                ...state,
                currentIndex: index,
                isTimeTraveling: true
            };
        }
        case MESSAGE_STORE_ACTIONS.RESET_TIME_TRAVEL: {
            return {
                ...state,
                currentIndex: state.messages.length - 1,
                isTimeTraveling: false
            };
        }
        case MESSAGE_STORE_ACTIONS.SET_FILTERS: {
            return {
                ...state,
                filters: {
                    ...state.filters,
                    ...action.payload
                }
            };
        }
        case MESSAGE_STORE_ACTIONS.CLEAR_MESSAGES: {
            return {
                ...state,
                messages: [],
                currentIndex: -1,
                isTimeTraveling: false
            };
        }
        case MESSAGE_STORE_ACTIONS.LOAD_PERSISTED_MESSAGES: {
            const { messages } = action.payload;
            return {
                ...state,
                messages: [...messages],
                currentIndex: messages.length - 1,
                isTimeTraveling: false
            };
        }
        default:
            return state;
    }
}
// Selectors
export const messageStoreSelectors = {
    getAllMessages: (state) => state.messages,
    getCurrentMessage: (state) => {
        if (state.currentIndex >= 0 && state.currentIndex < state.messages.length) {
            return state.messages[state.currentIndex];
        }
        return null;
    },
    getFilteredMessages: (state) => {
        let filtered = state.messages;
        if (state.filters.types.length > 0) {
            filtered = filtered.filter(msg => state.filters.types.includes(msg.type));
        }
        if (state.filters.statuses.length > 0) {
            filtered = filtered.filter(msg => state.filters.statuses.includes(msg.status));
        }
        if (state.filters.directions.length > 0) {
            filtered = filtered.filter(msg => state.filters.directions.includes(msg.direction));
        }
        if (state.filters.dateRange) {
            filtered = filtered.filter(msg => msg.timestamp >= state.filters.dateRange.from &&
                msg.timestamp <= state.filters.dateRange.to);
        }
        return filtered;
    },
    getMessagesByType: (state, type) => state.messages.filter(msg => msg.type === type),
    getMessagesByStatus: (state, status) => state.messages.filter(msg => msg.status === status),
    getMessageByCorrelationId: (state, correlationId) => state.messages.find(msg => msg.correlationId === correlationId),
    isTimeTraveling: (state) => state.isTimeTraveling,
    getCurrentIndex: (state) => state.currentIndex,
    getTotalMessageCount: (state) => state.messages.length,
    getMessageStatistics: (state) => {
        const stats = {
            total: state.messages.length,
            success: 0,
            error: 0,
            pending: 0,
            inbound: 0,
            outbound: 0,
            typeBreakdown: {}
        };
        state.messages.forEach(msg => {
            stats[msg.status]++;
            stats[msg.direction]++;
            stats.typeBreakdown[msg.type] = (stats.typeBreakdown[msg.type] || 0) + 1;
        });
        return stats;
    }
};
// Store class with persistence
export class MessageStore {
    constructor() {
        this.state = initialState;
        this.listeners = [];
        this.persistenceKey = 'web-buddy-message-store';
        this.maxStoredMessages = 1000; // Limit to prevent storage bloat
        this.loadPersistedState();
    }
    getState() {
        return this.state;
    }
    dispatch(action) {
        const previousState = this.state;
        this.state = messageStoreReducer(this.state, action);
        if (previousState !== this.state) {
            this.persistState();
            this.notifyListeners();
        }
    }
    subscribe(listener) {
        this.listeners.push(listener);
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }
    async persistState() {
        try {
            // Only persist recent messages to avoid storage bloat
            const recentMessages = this.state.messages.slice(-this.maxStoredMessages);
            const persistData = {
                messages: recentMessages,
                timestamp: Date.now(),
                version: 1
            };
            await chrome.storage.local.set({
                [this.persistenceKey]: persistData
            });
        }
        catch (error) {
            console.error('❌ Failed to persist message store:', error);
        }
    }
    async loadPersistedState() {
        try {
            const result = await chrome.storage.local.get(this.persistenceKey);
            const persistedData = result[this.persistenceKey];
            if (persistedData && persistedData.messages && Array.isArray(persistedData.messages)) {
                this.dispatch(messageStoreActions.loadPersistedMessages(persistedData.messages));
                console.log(`📚 Loaded ${persistedData.messages.length} persisted messages`);
            }
        }
        catch (error) {
            console.error('❌ Failed to load persisted message store:', error);
        }
    }
    // Utility methods for common operations
    addInboundMessage(type, payload, correlationId, metadata) {
        this.dispatch(messageStoreActions.addMessage({
            type,
            payload,
            correlationId,
            direction: 'inbound',
            status: 'pending'
        }, metadata));
    }
    addOutboundMessage(type, payload, correlationId, metadata) {
        this.dispatch(messageStoreActions.addMessage({
            type,
            payload,
            correlationId,
            direction: 'outbound',
            status: 'pending'
        }, metadata));
    }
    markMessageSuccess(correlationId, response) {
        this.dispatch(messageStoreActions.updateMessageStatus(correlationId, 'success', response));
    }
    markMessageError(correlationId, error) {
        this.dispatch(messageStoreActions.updateMessageStatus(correlationId, 'error', undefined, error));
    }
    timeTravelTo(index) {
        this.dispatch(messageStoreActions.timeTravelTo(index));
    }
    resetTimeTravel() {
        this.dispatch(messageStoreActions.resetTimeTravel());
    }
    clearAllMessages() {
        this.dispatch(messageStoreActions.clearMessages());
    }
    // Time-travel utilities
    canTimeTravelBack() {
        return this.state.currentIndex > 0;
    }
    canTimeTravelForward() {
        return this.state.currentIndex < this.state.messages.length - 1;
    }
    timeTravelBack() {
        if (this.canTimeTravelBack()) {
            this.timeTravelTo(this.state.currentIndex - 1);
        }
    }
    timeTravelForward() {
        if (this.canTimeTravelForward()) {
            this.timeTravelTo(this.state.currentIndex + 1);
        }
    }
    // Export methods for debugging
    exportMessages() {
        return JSON.stringify({
            messages: this.state.messages,
            exportedAt: new Date().toISOString(),
            version: 1
        }, null, 2);
    }
    importMessages(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.messages && Array.isArray(data.messages)) {
                this.dispatch(messageStoreActions.loadPersistedMessages(data.messages));
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('❌ Failed to import messages:', error);
            return false;
        }
    }
}
// Global message store instance
export const globalMessageStore = new MessageStore();
