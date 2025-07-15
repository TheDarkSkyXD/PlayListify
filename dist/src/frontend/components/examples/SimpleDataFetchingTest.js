"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleDataFetchingTest = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const card_1 = require("../ui/card");
const button_1 = require("../ui/button");
const app_store_1 = require("../../stores/app-store");
const dependency_store_1 = require("../../stores/dependency-store");
const SimpleDataFetchingTest = () => {
    // Zustand stores
    const { theme, setTheme, addNotification, notifications, removeNotification, clearNotifications, isLoading, setLoading, toggleSidebar, isSidebarOpen, } = (0, app_store_1.useAppStore)();
    const { isInstalling, allReady, dependencies, startInstallation, completeInstallation, setAllReady, } = (0, dependency_store_1.useDependencyStore)();
    const handleThemeToggle = () => {
        const newTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
        setTheme(newTheme);
        addNotification({
            type: "success",
            title: "Theme Updated",
            message: `Theme changed to ${newTheme}`,
        });
    };
    const handleTestLoading = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            addNotification({
                type: "info",
                title: "Loading Test",
                message: "Loading state test completed",
            });
        }, 2000);
    };
    const handleTestInstallation = () => {
        startInstallation(["ytdlp", "ffmpeg"]);
        // Simulate installation progress
        setTimeout(() => {
            completeInstallation("ytdlp", true);
        }, 1500);
        setTimeout(() => {
            completeInstallation("ffmpeg", true);
            setAllReady(true);
            addNotification({
                type: "success",
                title: "Installation Complete",
                message: "All dependencies installed successfully",
            });
        }, 3000);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 p-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "App Store Test" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Test Zustand app store functionality" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "Current Theme:" }), (0, jsx_runtime_1.jsx)("span", { className: "capitalize font-medium", children: theme })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "Sidebar Open:" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: isSidebarOpen ? "Yes" : "No" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "Loading:" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: isLoading ? "Yes" : "No" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "Notifications:" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: notifications.length })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { onClick: handleThemeToggle, size: "sm", children: "Toggle Theme" }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: toggleSidebar, size: "sm", variant: "outline", children: "Toggle Sidebar" }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: handleTestLoading, size: "sm", variant: "outline", children: "Test Loading" })] })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Dependency Store Test" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Test dependency management store" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "All Ready:" }), (0, jsx_runtime_1.jsx)("span", { className: `font-medium ${allReady ? "text-green-600" : "text-red-600"}`, children: allReady ? "Yes" : "No" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "Installing:" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: isInstalling ? "Yes" : "No" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "yt-dlp:" }), (0, jsx_runtime_1.jsx)("span", { className: `text-sm ${dependencies.ytdlp.installed ? "text-green-600" : "text-red-600"}`, children: dependencies.ytdlp.installed ? "Installed" : "Not Installed" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "FFmpeg:" }), (0, jsx_runtime_1.jsx)("span", { className: `text-sm ${dependencies.ffmpeg.installed ? "text-green-600" : "text-red-600"}`, children: dependencies.ffmpeg.installed
                                                            ? "Installed"
                                                            : "Not Installed" })] })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: handleTestInstallation, disabled: isInstalling, size: "sm", className: "w-full", children: isInstalling ? "Installing..." : "Test Installation" })] })] })] }), notifications.length > 0 && ((0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { children: ["Notifications (", notifications.length, ")"] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Current notifications in the store" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-3", children: [notifications.map((notification) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-3 rounded-lg border", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "font-medium", children: notification.title }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm text-muted-foreground", children: notification.message }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-muted-foreground", children: notification.timestamp.toLocaleTimeString() })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: `px-2 py-1 rounded text-xs ${notification.type === "success"
                                                    ? "bg-green-100 text-green-800"
                                                    : notification.type === "error"
                                                        ? "bg-red-100 text-red-800"
                                                        : notification.type === "warning"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-blue-100 text-blue-800"}`, children: notification.type }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: () => removeNotification(notification.id), size: "sm", variant: "ghost", children: "\u00D7" })] })] }, notification.id))), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: clearNotifications, variant: "outline", size: "sm", className: "w-full", children: "Clear All Notifications" })] })] })), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Store State Debug" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Raw store state for debugging" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-semibold mb-2", children: "App Store State" }), (0, jsx_runtime_1.jsx)("pre", { className: "text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-40", children: JSON.stringify({
                                                theme,
                                                isLoading,
                                                isSidebarOpen,
                                                notificationCount: notifications.length,
                                            }, null, 2) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-semibold mb-2", children: "Dependency Store State" }), (0, jsx_runtime_1.jsx)("pre", { className: "text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-40", children: JSON.stringify({
                                                allReady,
                                                isInstalling,
                                                ytdlpInstalled: dependencies.ytdlp.installed,
                                                ffmpegInstalled: dependencies.ffmpeg.installed,
                                            }, null, 2) })] })] }) })] })] }));
};
exports.SimpleDataFetchingTest = SimpleDataFetchingTest;
//# sourceMappingURL=SimpleDataFetchingTest.js.map