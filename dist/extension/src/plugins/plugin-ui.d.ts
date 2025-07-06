/**
 * @fileoverview Plugin UI Component System for Web-Buddy plugin architecture
 * @description Manages plugin UI components, menus, and state with lifecycle support
 */
import { PluginUIComponent, PluginMenuItem, PluginEventBus, PluginLogger, WebBuddyTab } from './plugin-interface';
/**
 * UI component state management
 */
export type UIComponentState = 'unmounted' | 'mounting' | 'mounted' | 'updating' | 'unmounting' | 'error';
/**
 * UI event types for plugin system
 */
export declare enum UIEventType {
    COMPONENT_REGISTERED = "ui:component:registered",
    COMPONENT_MOUNTED = "ui:component:mounted",
    COMPONENT_UNMOUNTED = "ui:component:unmounted",
    COMPONENT_ERROR = "ui:component:error",
    MENU_ITEM_REGISTERED = "ui:menu:registered",
    MENU_ITEM_CLICKED = "ui:menu:clicked",
    UI_STATE_CHANGED = "ui:state:changed"
}
/**
 * UI state management
 */
interface UIState {
    activeComponents: Set<string>;
    visibleMenus: Set<string>;
    currentTab?: WebBuddyTab;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    uiScale: number;
}
/**
 * Plugin UI Manager - manages all plugin UI components and menus
 */
export declare class PluginUIManager {
    private components;
    private menuItems;
    private eventBus;
    private logger;
    private uiState;
    private mountPoints;
    constructor(eventBus: PluginEventBus, logger: PluginLogger);
    /**
     * Register a UI component for a plugin
     */
    registerComponent(pluginId: string, component: PluginUIComponent): void;
    /**
     * Unregister a UI component
     */
    unregisterComponent(componentId: string): Promise<void>;
    /**
     * Mount a UI component to its designated mount point
     */
    mountComponent(componentId: string, mountPoint?: HTMLElement): Promise<void>;
    /**
     * Unmount a UI component from the DOM
     */
    unmountComponent(componentId: string): Promise<void>;
    /**
     * Register a menu item for a plugin
     */
    registerMenuItem(pluginId: string, menuItem: PluginMenuItem): void;
    /**
     * Unregister a menu item
     */
    unregisterMenuItem(menuItemId: string): void;
    /**
     * Update UI state
     */
    updateUIState(updates: Partial<UIState>): void;
    /**
     * Get components by plugin
     */
    getComponentsByPlugin(pluginId: string): PluginUIComponent[];
    /**
     * Get menu items by plugin
     */
    getMenuItemsByPlugin(pluginId: string): PluginMenuItem[];
    /**
     * Get UI statistics
     */
    getStatistics(): any;
    private initializeMountPoints;
    private setupEventListeners;
    private getMountPointForComponent;
    private applyComponentStyling;
    private setupComponentAccessibility;
    private getAriaRoleForComponentType;
    private createMenuItemElement;
    private handleMenuItemClick;
    private addMenuItemToMenu;
    private getOrCreatePluginMenu;
    private getOrCreateMenuContainer;
    private applyThemeToComponents;
}
/**
 * Plugin UI Factory for creating UI manager instances
 */
export declare class PluginUIFactory {
    createUIManager(eventBus: PluginEventBus, logger: PluginLogger): PluginUIManager;
}
export {};
//# sourceMappingURL=plugin-ui.d.ts.map