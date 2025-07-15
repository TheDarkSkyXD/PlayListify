"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Playlists = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const lucide_react_1 = require("lucide-react");
const Playlists = () => {
    // Mock data for demonstration
    const playlists = [
        {
            id: 1,
            name: 'Coding Music',
            description: 'Focus music for programming sessions',
            videos: 25,
            duration: '2h 15m',
            thumbnail: null,
            lastUpdated: '2 hours ago',
            isDownloaded: true,
        },
        {
            id: 2,
            name: 'Workout Hits',
            description: 'High-energy music for workouts',
            videos: 18,
            duration: '1h 32m',
            thumbnail: null,
            lastUpdated: '1 day ago',
            isDownloaded: false,
        },
        {
            id: 3,
            name: 'Study Focus',
            description: 'Ambient and instrumental music for studying',
            videos: 12,
            duration: '45m',
            thumbnail: null,
            lastUpdated: '3 days ago',
            isDownloaded: true,
        },
        {
            id: 4,
            name: 'Chill Vibes',
            description: 'Relaxing music for downtime',
            videos: 30,
            duration: '3h 20m',
            thumbnail: null,
            lastUpdated: '1 week ago',
            isDownloaded: false,
        },
    ];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold", children: "Playlists" }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground mt-2", children: "Manage your YouTube playlists and downloads" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), "Create Playlist"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between space-x-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4 flex-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative flex-1 max-w-md", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }), (0, jsx_runtime_1.jsx)(input_1.Input, { placeholder: "Search playlists...", className: "pl-10" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", size: "sm", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Filter, { className: "h-4 w-4 mr-2" }), "Filter"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", size: "sm", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Grid, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", size: "sm", children: (0, jsx_runtime_1.jsx)(lucide_react_1.List, { className: "h-4 w-4" }) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: playlists.map((playlist) => ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "hover:shadow-lg transition-shadow cursor-pointer group", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-full h-32 bg-muted rounded-md mb-4 flex items-center justify-center relative overflow-hidden", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Music, { className: "h-8 w-8 text-muted-foreground" }), playlist.isDownloaded && ((0, jsx_runtime_1.jsx)("div", { className: "absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full" }))] }), (0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-lg group-hover:text-primary transition-colors", children: playlist.name }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { className: "line-clamp-2", children: playlist.description })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-sm text-muted-foreground", children: [(0, jsx_runtime_1.jsxs)("span", { children: [playlist.videos, " videos"] }), (0, jsx_runtime_1.jsx)("span", { children: playlist.duration })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Updated ", playlist.lastUpdated] }), playlist.isDownloaded ? ((0, jsx_runtime_1.jsx)("span", { className: "text-green-600 font-medium", children: "Downloaded" })) : ((0, jsx_runtime_1.jsx)("span", { className: "text-orange-600 font-medium", children: "Online" }))] })] }) })] }, playlist.id))) }), playlists.length === 0 && ((0, jsx_runtime_1.jsx)("div", { className: "text-center py-12", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "max-w-md mx-auto", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Music, { className: "h-6 w-6 text-muted-foreground" }) }), (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "No playlists yet" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Start by creating your first playlist or importing from YouTube." })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { className: "w-full", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), "Create Your First Playlist"] }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", className: "w-full", children: "Import from YouTube" })] })] }) })), playlists.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center space-x-2 pt-6", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", size: "sm", disabled: true, children: "Previous" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-muted-foreground", children: "Page 1 of 1" }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", size: "sm", disabled: true, children: "Next" })] }))] }));
};
exports.Playlists = Playlists;
//# sourceMappingURL=MyPlaylists.js.map