/**
 * @fileoverview Plugin UI Component System for Web-Buddy plugin architecture
 * @description Manages plugin UI components, menus, and state with lifecycle support
 */
import { PluginError } from './plugin-interface';
/**
 * UI event types for plugin system
 */
export var UIEventType;
(function (UIEventType) {
    UIEventType["COMPONENT_REGISTERED"] = "ui:component:registered";
    UIEventType["COMPONENT_MOUNTED"] = "ui:component:mounted";
    UIEventType["COMPONENT_UNMOUNTED"] = "ui:component:unmounted";
    UIEventType["COMPONENT_ERROR"] = "ui:component:error";
    UIEventType["MENU_ITEM_REGISTERED"] = "ui:menu:registered";
    UIEventType["MENU_ITEM_CLICKED"] = "ui:menu:clicked";
    UIEventType["UI_STATE_CHANGED"] = "ui:state:changed";
})(UIEventType || (UIEventType = {}));
/**
 * Plugin UI Manager - manages all plugin UI components and menus
 */
export class PluginUIManager {
    constructor(eventBus, logger) {
        this.components = new Map();
        this.menuItems = new Map();
        this.mountPoints = new Map();
        this.eventBus = eventBus;
        this.logger = logger;
        this.uiState = {
            activeComponents: new Set(),
            visibleMenus: new Set(),
            theme: 'auto',
            language: 'en',
            uiScale: 1.0
        };
        this.initializeMountPoints();
        this.setupEventListeners();
    }
    /**
     * Register a UI component for a plugin
     */
    registerComponent(pluginId, component) {
        try {
            if (this.components.has(component.id)) {
                throw new PluginError(`UI component with id ${component.id} already registered`, pluginId, 'UI_COMPONENT_DUPLICATE');
            }
            const entry = {
                component,
                state: 'unmounted',
                pluginId,
                metadata: {
                    createdAt: new Date(),
                    errorCount: 0,
                    renderCount: 0
                }
            };
            this.components.set(component.id, entry);
            this.eventBus.emit({
                type: UIEventType.COMPONENT_REGISTERED,
                source: 'plugin-ui-manager',
                target: pluginId,
                data: { componentId: component.id, type: component.type },
                timestamp: new Date().toISOString()
            });
            this.logger.info(`UI component registered: ${component.id}`, {
                pluginId,
                componentType: component.type,
                componentName: component.name
            });
        }
        catch (error) {
            this.logger.error(`Failed to register UI component: ${component.id}`, error, { pluginId });
            throw error;
        }
    }
    /**
     * Unregister a UI component
     */
    async unregisterComponent(componentId) {
        const entry = this.components.get(componentId);
        if (!entry) {
            this.logger.warn(`Attempted to unregister non-existent component: ${componentId}`);
            return;
        }
        try {
            // Unmount component if mounted
            if (entry.state === 'mounted') {
                await this.unmountComponent(componentId);
            }
            this.components.delete(componentId);
            this.uiState.activeComponents.delete(componentId);
            this.logger.info(`UI component unregistered: ${componentId}`, {
                pluginId: entry.pluginId
            });
        }
        catch (error) {
            this.logger.error(`Failed to unregister UI component: ${componentId}`, error);
            throw error;
        }
    }
    /**
     * Mount a UI component to its designated mount point
     */
    async mountComponent(componentId, mountPoint) {
        const entry = this.components.get(componentId);
        if (!entry) {
            throw new PluginError(`Cannot mount non-existent component: ${componentId}`, 'unknown', 'UI_COMPONENT_NOT_FOUND');
        }
        if (entry.state === 'mounted') {
            this.logger.warn(`Component already mounted: ${componentId}`);
            return;
        }
        try {
            entry.state = 'mounting';
            entry.metadata.renderCount++;
            // Determine mount point
            const targetMountPoint = mountPoint || this.getMountPointForComponent(entry.component);
            if (!targetMountPoint) {
                throw new PluginError(`No mount point available for component type: ${entry.component.type}`, entry.pluginId, 'UI_MOUNT_POINT_UNAVAILABLE');
            }
            // Render component
            const element = await entry.component.render();
            if (!element) {
                throw new PluginError(`Component render() returned null/undefined: ${componentId}`, entry.pluginId, 'UI_RENDER_FAILED');
            }
            // Apply styling and accessibility
            this.applyComponentStyling(element, entry.component);
            this.setupComponentAccessibility(element, entry.component);
            // Mount to DOM
            targetMountPoint.appendChild(element);
            entry.element = element;
            entry.mountPoint = targetMountPoint;
            entry.state = 'mounted';
            // Call lifecycle hook
            if (entry.component.onMount) {
                await entry.component.onMount();
            }
            this.uiState.activeComponents.add(componentId);
            this.eventBus.emit({
                type: UIEventType.COMPONENT_MOUNTED,
                source: 'plugin-ui-manager',
                target: entry.pluginId,
                data: { componentId, mountPoint: targetMountPoint.id || 'unnamed' },
                timestamp: new Date().toISOString()
            });
            this.logger.info(`UI component mounted: ${componentId}`, {
                pluginId: entry.pluginId,
                mountPoint: targetMountPoint.id || 'unnamed'
            });
        }
        catch (error) {
            entry.state = 'error';
            entry.metadata.errorCount++;
            this.eventBus.emit({
                type: UIEventType.COMPONENT_ERROR,
                source: 'plugin-ui-manager',
                target: entry.pluginId,
                data: { componentId, error: error.message },
                timestamp: new Date().toISOString()
            });
            this.logger.error(`Failed to mount UI component: ${componentId}`, error, {
                pluginId: entry.pluginId
            });
            throw error;
        }
    }
    /**
     * Unmount a UI component from the DOM
     */
    async unmountComponent(componentId) {
        const entry = this.components.get(componentId);
        if (!entry || entry.state !== 'mounted') {
            this.logger.warn(`Attempted to unmount component in invalid state: ${componentId}`);
            return;
        }
        try {
            entry.state = 'unmounting';
            // Call lifecycle hook
            if (entry.component.onUnmount) {
                await entry.component.onUnmount();
            }
            // Remove from DOM
            if (entry.element && entry.element.parentNode) {
                entry.element.parentNode.removeChild(entry.element);
            }
            entry.element = undefined;
            entry.mountPoint = undefined;
            entry.state = 'unmounted';
            this.uiState.activeComponents.delete(componentId);
            this.eventBus.emit({
                type: UIEventType.COMPONENT_UNMOUNTED,
                source: 'plugin-ui-manager',
                target: entry.pluginId,
                data: { componentId },
                timestamp: new Date().toISOString()
            });
            this.logger.info(`UI component unmounted: ${componentId}`, {
                pluginId: entry.pluginId
            });
        }
        catch (error) {
            entry.state = 'error';
            entry.metadata.errorCount++;
            this.logger.error(`Failed to unmount UI component: ${componentId}`, error, {
                pluginId: entry.pluginId
            });
            throw error;
        }
    }
    /**
     * Register a menu item for a plugin
     */
    registerMenuItem(pluginId, menuItem) {
        try {
            if (this.menuItems.has(menuItem.id)) {
                throw new PluginError(`Menu item with id ${menuItem.id} already registered`, pluginId, 'UI_MENU_ITEM_DUPLICATE');
            }
            const entry = {
                item: menuItem,
                pluginId,
                metadata: {
                    createdAt: new Date(),
                    clickCount: 0
                }
            };
            this.menuItems.set(menuItem.id, entry);
            // Create menu item element
            const element = this.createMenuItemElement(entry);
            entry.element = element;
            // Add to appropriate menu
            this.addMenuItemToMenu(entry);
            this.eventBus.emit({
                type: UIEventType.MENU_ITEM_REGISTERED,
                source: 'plugin-ui-manager',
                target: pluginId,
                data: { menuItemId: menuItem.id, label: menuItem.label },
                timestamp: new Date().toISOString()
            });
            this.logger.info(`Menu item registered: ${menuItem.id}`, {
                pluginId,
                label: menuItem.label
            });
        }
        catch (error) {
            this.logger.error(`Failed to register menu item: ${menuItem.id}`, error, { pluginId });
            throw error;
        }
    }
    /**
     * Unregister a menu item
     */
    unregisterMenuItem(menuItemId) {
        const entry = this.menuItems.get(menuItemId);
        if (!entry) {
            this.logger.warn(`Attempted to unregister non-existent menu item: ${menuItemId}`);
            return;
        }
        try {
            // Remove from DOM
            if (entry.element && entry.element.parentNode) {
                entry.element.parentNode.removeChild(entry.element);
            }
            this.menuItems.delete(menuItemId);
            this.uiState.visibleMenus.delete(menuItemId);
            this.logger.info(`Menu item unregistered: ${menuItemId}`, {
                pluginId: entry.pluginId
            });
        }
        catch (error) {
            this.logger.error(`Failed to unregister menu item: ${menuItemId}`, error);
            throw error;
        }
    }
    /**
     * Update UI state
     */
    updateUIState(updates) {
        const oldState = { ...this.uiState };
        this.uiState = { ...this.uiState, ...updates };
        this.eventBus.emit({
            type: UIEventType.UI_STATE_CHANGED,
            source: 'plugin-ui-manager',
            data: { oldState, newState: this.uiState },
            timestamp: new Date().toISOString()
        });
        this.logger.debug('UI state updated', { updates });
    }
    /**
     * Get components by plugin
     */
    getComponentsByPlugin(pluginId) {
        return Array.from(this.components.values())
            .filter(entry => entry.pluginId === pluginId)
            .map(entry => entry.component);
    }
    /**
     * Get menu items by plugin
     */
    getMenuItemsByPlugin(pluginId) {
        return Array.from(this.menuItems.values())
            .filter(entry => entry.pluginId === pluginId)
            .map(entry => entry.item);
    }
    /**
     * Get UI statistics
     */
    getStatistics() {
        const componentStats = Array.from(this.components.values()).reduce((stats, entry) => {
            stats.byState[entry.state] = (stats.byState[entry.state] || 0) + 1;
            stats.byType[entry.component.type] = (stats.byType[entry.component.type] || 0) + 1;
            stats.totalRenders += entry.metadata.renderCount;
            stats.totalErrors += entry.metadata.errorCount;
            return stats;
        }, {
            byState: {},
            byType: {},
            totalRenders: 0,
            totalErrors: 0
        });
        const menuStats = Array.from(this.menuItems.values()).reduce((stats, entry) => {
            stats.totalClicks += entry.metadata.clickCount;
            return stats;
        }, {
            totalClicks: 0
        });
        return {
            components: {
                total: this.components.size,
                active: this.uiState.activeComponents.size,
                ...componentStats
            },
            menuItems: {
                total: this.menuItems.size,
                visible: this.uiState.visibleMenus.size,
                ...menuStats
            },
            uiState: this.uiState
        };
    }
    // Private helper methods
    initializeMountPoints() {
        // Create default mount points for different component types
        const mountPoints = [
            { id: 'web-buddy-panel-mount', type: 'panel' },
            { id: 'web-buddy-toolbar-mount', type: 'toolbar' },
            { id: 'web-buddy-sidebar-mount', type: 'sidebar' },
            { id: 'web-buddy-overlay-mount', type: 'overlay' }
        ];
        mountPoints.forEach(({ id, type }) => {
            let element = document.getElementById(id);
            if (!element) {
                element = document.createElement('div');
                element.id = id;
                element.className = `web-buddy-mount web-buddy-mount-${type}`;
                document.body.appendChild(element);
            }
            this.mountPoints.set(type, element);
        });
    }
    setupEventListeners() {
        // Listen for tab changes to update UI state
        this.eventBus.on('tab:activated', (event) => {
            this.updateUIState({ currentTab: event.data.tab });
        });
        // Listen for theme changes
        this.eventBus.on('ui:theme:changed', (event) => {
            this.updateUIState({ theme: event.data.theme });
            this.applyThemeToComponents();
        });
    }
    getMountPointForComponent(component) {
        return this.mountPoints.get(component.type) || null;
    }
    applyComponentStyling(element, component) {
        element.className = `web-buddy-component web-buddy-component-${component.type}`;
        element.setAttribute('data-component-id', component.id);
        element.setAttribute('data-component-name', component.name);
        // Apply theme-specific styling
        element.setAttribute('data-theme', this.uiState.theme);
    }
    setupComponentAccessibility(element, component) {
        if (!element.getAttribute('role')) {
            element.setAttribute('role', this.getAriaRoleForComponentType(component.type));
        }
        if (!element.getAttribute('aria-label') && component.description) {
            element.setAttribute('aria-label', component.description);
        }
        if (!element.getAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }
    }
    getAriaRoleForComponentType(type) {
        const roleMap = {
            panel: 'region',
            toolbar: 'toolbar',
            modal: 'dialog',
            sidebar: 'complementary',
            popup: 'tooltip',
            overlay: 'region'
        };
        return roleMap[type] || 'region';
    }
    createMenuItemElement(entry) {
        const element = document.createElement('div');
        element.className = 'web-buddy-menu-item';
        element.setAttribute('data-menu-item-id', entry.item.id);
        element.setAttribute('role', 'menuitem');
        element.setAttribute('tabindex', '0');
        // Create icon if provided
        if (entry.item.icon) {
            const icon = document.createElement('span');
            icon.className = 'web-buddy-menu-icon';
            icon.textContent = entry.item.icon;
            element.appendChild(icon);
        }
        // Create label
        const label = document.createElement('span');
        label.className = 'web-buddy-menu-label';
        label.textContent = entry.item.label;
        element.appendChild(label);
        // Create shortcut if provided
        if (entry.item.shortcut) {
            const shortcut = document.createElement('span');
            shortcut.className = 'web-buddy-menu-shortcut';
            shortcut.textContent = entry.item.shortcut;
            element.appendChild(shortcut);
        }
        // Add click handler
        element.addEventListener('click', async () => {
            await this.handleMenuItemClick(entry);
        });
        return element;
    }
    async handleMenuItemClick(entry) {
        try {
            // Check if menu item is enabled
            if (entry.item.enabled && !entry.item.enabled()) {
                this.logger.debug(`Menu item disabled: ${entry.item.id}`);
                return;
            }
            // Check if menu item is visible
            if (entry.item.visible && !entry.item.visible()) {
                this.logger.debug(`Menu item not visible: ${entry.item.id}`);
                return;
            }
            entry.metadata.clickCount++;
            entry.metadata.lastClicked = new Date();
            await entry.item.action();
            this.eventBus.emit({
                type: UIEventType.MENU_ITEM_CLICKED,
                source: 'plugin-ui-manager',
                target: entry.pluginId,
                data: { menuItemId: entry.item.id, label: entry.item.label },
                timestamp: new Date().toISOString()
            });
            this.logger.debug(`Menu item clicked: ${entry.item.id}`, {
                pluginId: entry.pluginId,
                clickCount: entry.metadata.clickCount
            });
        }
        catch (error) {
            this.logger.error(`Menu item action failed: ${entry.item.id}`, error, {
                pluginId: entry.pluginId
            });
        }
    }
    addMenuItemToMenu(entry) {
        // For now, add to a default plugin menu
        // In a real implementation, this would add to appropriate context menus
        const pluginMenu = this.getOrCreatePluginMenu(entry.pluginId);
        if (pluginMenu && entry.element) {
            pluginMenu.appendChild(entry.element);
            this.uiState.visibleMenus.add(entry.item.id);
        }
    }
    getOrCreatePluginMenu(pluginId) {
        let menu = document.getElementById(`web-buddy-plugin-menu-${pluginId}`);
        if (!menu) {
            menu = document.createElement('div');
            menu.id = `web-buddy-plugin-menu-${pluginId}`;
            menu.className = 'web-buddy-plugin-menu';
            // Add to main menu container
            const menuContainer = this.getOrCreateMenuContainer();
            menuContainer.appendChild(menu);
        }
        return menu;
    }
    getOrCreateMenuContainer() {
        let container = document.getElementById('web-buddy-menu-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'web-buddy-menu-container';
            container.className = 'web-buddy-menu-container';
            document.body.appendChild(container);
        }
        return container;
    }
    applyThemeToComponents() {
        this.components.forEach((entry) => {
            if (entry.element) {
                entry.element.setAttribute('data-theme', this.uiState.theme);
            }
        });
    }
}
/**
 * Plugin UI Factory for creating UI manager instances
 */
export class PluginUIFactory {
    createUIManager(eventBus, logger) {
        return new PluginUIManager(eventBus, logger);
    }
}
