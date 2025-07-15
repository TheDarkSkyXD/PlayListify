"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const lucide_react_1 = require("lucide-react");
const Settings = () => {
    const settingsSections = [
        {
            title: 'General',
            description: 'Basic application settings',
            icon: lucide_react_1.Settings,
            settings: [
                { label: 'Application Theme', type: 'select', options: ['Light', 'Dark', 'System'] },
                { label: 'Language', type: 'select', options: ['English', 'Spanish', 'French'] },
                { label: 'Start Minimized', type: 'toggle' },
                { label: 'Close to System Tray', type: 'toggle' },
            ],
        },
        {
            title: 'Downloads',
            description: 'Configure download behavior and locations',
            icon: lucide_react_1.Download,
            settings: [
                { label: 'Download Location', type: 'folder', value: '/Users/username/Downloads/Playlistify' },
                { label: 'Video Quality', type: 'select', options: ['Best', 'High (1080p)', 'Medium (720p)', 'Low (480p)'] },
                { label: 'Audio Format', type: 'select', options: ['MP3', 'AAC', 'FLAC', 'Original'] },
                { label: 'Concurrent Downloads', type: 'number', value: '3' },
                { label: 'Auto-download New Videos', type: 'toggle' },
            ],
        },
        {
            title: 'Storage',
            description: 'Manage storage and file organization',
            icon: lucide_react_1.Folder,
            settings: [
                { label: 'Organize by Playlist', type: 'toggle' },
                { label: 'Create Date Folders', type: 'toggle' },
                { label: 'Clean Temp Files on Exit', type: 'toggle' },
                { label: 'Maximum Cache Size (GB)', type: 'number', value: '5' },
            ],
        },
        {
            title: 'Notifications',
            description: 'Control when and how you receive notifications',
            icon: lucide_react_1.Bell,
            settings: [
                { label: 'Download Complete Notifications', type: 'toggle' },
                { label: 'Playlist Update Notifications', type: 'toggle' },
                { label: 'Error Notifications', type: 'toggle' },
                { label: 'System Tray Notifications', type: 'toggle' },
            ],
        },
        {
            title: 'Privacy & Security',
            description: 'Privacy settings and security options',
            icon: lucide_react_1.Shield,
            settings: [
                { label: 'Save YouTube Cookies', type: 'toggle' },
                { label: 'Clear History on Exit', type: 'toggle' },
                { label: 'Enable Analytics', type: 'toggle' },
                { label: 'Auto-update Dependencies', type: 'toggle' },
            ],
        },
    ];
    const renderSettingInput = (setting) => {
        switch (setting.type) {
            case 'select':
                return ((0, jsx_runtime_1.jsx)("select", { className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background", children: setting.options.map((option) => ((0, jsx_runtime_1.jsx)("option", { value: option, children: option }, option))) }));
            case 'toggle':
                return ((0, jsx_runtime_1.jsxs)("label", { className: "relative inline-flex items-center cursor-pointer", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", className: "sr-only peer" }), (0, jsx_runtime_1.jsx)("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" })] }));
            case 'folder':
                return ((0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-2", children: [(0, jsx_runtime_1.jsx)(input_1.Input, { value: setting.value, readOnly: true, className: "flex-1" }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", size: "sm", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Folder, { className: "h-4 w-4" }) })] }));
            case 'number':
                return (0, jsx_runtime_1.jsx)(input_1.Input, { type: "number", defaultValue: setting.value, className: "w-24" });
            default:
                return (0, jsx_runtime_1.jsx)(input_1.Input, { defaultValue: setting.value });
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-8", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold", children: "Settings" }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground mt-2", children: "Customize your PlayListify experience" })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-6", children: settingsSections.map((section) => {
                    const Icon = section.icon;
                    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5 text-primary" }), (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: section.title })] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: section.description })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "space-y-6", children: section.settings.map((setting, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("div", { className: "space-y-1", children: (0, jsx_runtime_1.jsx)("label", { className: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", children: setting.label }) }), (0, jsx_runtime_1.jsx)("div", { className: "w-48", children: renderSettingInput(setting) })] }, index))) })] }, section.title));
                }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center pt-6 border-t", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2 text-sm text-muted-foreground", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)("span", { children: "Settings are automatically saved" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-3", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", children: "Reset to Defaults" }), (0, jsx_runtime_1.jsx)(button_1.Button, { children: "Export Settings" })] })] })] }));
};
exports.Settings = Settings;
//# sourceMappingURL=Settings.js.map