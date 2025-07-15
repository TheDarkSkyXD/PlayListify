"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFetchingExample = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const card_1 = require("../ui/card");
const button_1 = require("../ui/button");
const QueryStateHandler_1 = require("../common/QueryStateHandler");
const use_app_queries_1 = require("../../hooks/queries/use-app-queries");
const use_dependency_queries_1 = require("../../hooks/queries/use-dependency-queries");
const use_settings_queries_1 = require("../../hooks/queries/use-settings-queries");
const app_store_1 = require("../../stores/app-store");
const dependency_store_1 = require("../../stores/dependency-store");
const DataFetchingExample = () => {
    // React Query hooks
    const appVersionQuery = (0, use_app_queries_1.useAppVersion)();
    const dependencyStatusQuery = (0, use_dependency_queries_1.useDependencyStatus)();
    const themeSettingQuery = (0, use_settings_queries_1.useThemeSetting)();
    // Mutations
    const minimizeApp = (0, use_app_queries_1.useMinimizeApp)();
    const maximizeApp = (0, use_app_queries_1.useMaximizeApp)();
    const installDependencies = (0, use_dependency_queries_1.useInstallAllDependencies)();
    const updateSetting = (0, use_settings_queries_1.useUpdateSetting)();
    // Zustand stores
    const { theme, setTheme, addNotification } = (0, app_store_1.useAppStore)();
    const { isInstalling, allReady } = (0, dependency_store_1.useDependencyStore)();
    const handleThemeToggle = () => {
        const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
        setTheme(newTheme);
        updateSetting.mutate({ key: 'theme', value: newTheme });
        addNotification({
            type: 'success',
            title: 'Theme Updated',
            message: `Theme changed to ${newTheme}`,
        });
    };
    const handleInstallDependencies = () => {
        installDependencies.mutate();
        addNotification({
            type: 'info',
            title: 'Installing Dependencies',
            message: 'Starting dependency installation...',
        });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 p-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "App Version" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Application version information" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)(QueryStateHandler_1.QueryStateHandler, { queryState: appVersionQuery, loadingProps: { message: 'Loading version...' }, errorProps: { variant: 'inline' }, emptyProps: { title: 'No version data', variant: 'inline' }, children: (data) => ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Version:" }), " ", data.version] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Environment:" }), " ", data.environment] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Build Date:" }), " ", new Date(data.buildDate).toLocaleDateString()] })] })) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Dependencies" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "External dependency status" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)(QueryStateHandler_1.QueryStateHandler, { queryState: dependencyStatusQuery, loadingProps: { message: 'Checking dependencies...' }, errorProps: { variant: 'inline' }, children: (data) => ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "yt-dlp:" }), (0, jsx_runtime_1.jsx)("span", { className: data.ytdlp.installed ? 'text-green-600' : 'text-red-600', children: data.ytdlp.installed ? 'Installed' : 'Missing' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "FFmpeg:" }), (0, jsx_runtime_1.jsx)("span", { className: data.ffmpeg.installed ? 'text-green-600' : 'text-red-600', children: data.ffmpeg.installed ? 'Installed' : 'Missing' })] }), !data.allReady && ((0, jsx_runtime_1.jsx)(button_1.Button, { onClick: handleInstallDependencies, disabled: isInstalling || installDependencies.isPending, size: "sm", className: "w-full", children: isInstalling ? 'Installing...' : 'Install Missing' }))] })) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Theme Settings" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Current theme configuration" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)(QueryStateHandler_1.QueryStateHandler, { queryState: themeSettingQuery, loadingProps: { message: 'Loading theme...' }, errorProps: { variant: 'inline' }, children: (data) => ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "Current Theme:" }), (0, jsx_runtime_1.jsx)("span", { className: "capitalize", children: data.value })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "Store Theme:" }), (0, jsx_runtime_1.jsx)("span", { className: "capitalize", children: theme })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: handleThemeToggle, disabled: updateSetting.isPending, size: "sm", className: "w-full", children: "Toggle Theme" })] })) }) })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Window Controls" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Test window management mutations" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { onClick: () => minimizeApp.mutate(), disabled: minimizeApp.isPending, variant: "outline", children: "Minimize" }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: () => maximizeApp.mutate(), disabled: maximizeApp.isPending, variant: "outline", children: "Maximize" })] }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Store State" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Current Zustand store states" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-semibold mb-2", children: "App Store" }), (0, jsx_runtime_1.jsx)("pre", { className: "text-xs bg-gray-100 p-2 rounded overflow-auto", children: JSON.stringify({
                                                theme,
                                                isLoading: (0, app_store_1.useAppStore)(state => state.isLoading),
                                                notifications: (0, app_store_1.useAppStore)(state => state.notifications.length),
                                            }, null, 2) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-semibold mb-2", children: "Dependency Store" }), (0, jsx_runtime_1.jsx)("pre", { className: "text-xs bg-gray-100 p-2 rounded overflow-auto", children: JSON.stringify({
                                                allReady,
                                                isInstalling,
                                                currentInstall: (0, dependency_store_1.useDependencyStore)(state => state.currentInstall),
                                            }, null, 2) })] })] }) })] })] }));
};
exports.DataFetchingExample = DataFetchingExample;
//# sourceMappingURL=DataFetchingExample.js.map