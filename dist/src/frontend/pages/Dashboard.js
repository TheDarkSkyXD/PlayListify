"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dashboard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_1 = require("@tanstack/react-router");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const Dashboard = () => {
    // Mock data for demonstration
    const stats = [
        {
            title: 'Total Playlists',
            value: '12',
            description: 'Active playlists',
            icon: lucide_react_1.Music,
            trend: '+2 this week',
        },
        {
            title: 'Total Videos',
            value: '248',
            description: 'Videos managed',
            icon: lucide_react_1.TrendingUp,
            trend: '+15 this week',
        },
        {
            title: 'Watch Time',
            value: '42h',
            description: 'Total duration',
            icon: lucide_react_1.Clock,
            trend: '+3h this week',
        },
        {
            title: 'Downloads',
            value: '156',
            description: 'Videos downloaded',
            icon: lucide_react_1.Download,
            trend: '+8 this week',
        },
    ];
    const recentPlaylists = [
        { id: 1, name: 'Coding Music', videos: 25, duration: '2h 15m', lastUpdated: '2 hours ago' },
        { id: 2, name: 'Workout Hits', videos: 18, duration: '1h 32m', lastUpdated: '1 day ago' },
        { id: 3, name: 'Study Focus', videos: 12, duration: '45m', lastUpdated: '3 days ago' },
    ];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold", children: "Welcome back!" }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground mt-2", children: "Here's what's happening with your playlists today." })] }), (0, jsx_runtime_1.jsx)(react_router_1.Link, { to: "/playlists", children: (0, jsx_runtime_1.jsxs)(button_1.Button, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), "Create Playlist"] }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: stats.map((stat) => {
                    const Icon = stat.icon;
                    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium", children: stat.title }), (0, jsx_runtime_1.jsx)(Icon, { className: "h-4 w-4 text-muted-foreground" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold", children: stat.value }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: stat.description }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-green-600 mt-1", children: stat.trend })] })] }, stat.title));
                }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Recent Playlists" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Your most recently updated playlists" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-4", children: [recentPlaylists.map((playlist) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-3 rounded-lg border", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Music, { className: "h-5 w-5 text-primary" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-medium", children: playlist.name }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-muted-foreground", children: [playlist.videos, " videos \u2022 ", playlist.duration] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-right", children: (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: playlist.lastUpdated }) })] }, playlist.id))), (0, jsx_runtime_1.jsx)(react_router_1.Link, { to: "/playlists", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", className: "w-full", children: "View All Playlists" }) })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Quick Actions" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Common tasks and shortcuts" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)(react_router_1.Link, { to: "/playlists", children: (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", className: "w-full justify-start", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), "Create New Playlist"] }) }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", className: "w-full justify-start", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { className: "h-4 w-4 mr-2" }), "Import from YouTube"] }), (0, jsx_runtime_1.jsx)(react_router_1.Link, { to: "/settings", children: (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", className: "w-full justify-start", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Music, { className: "h-4 w-4 mr-2" }), "Manage Downloads"] }) }), (0, jsx_runtime_1.jsx)(react_router_1.Link, { to: "/settings", children: (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", className: "w-full justify-start", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "h-4 w-4 mr-2" }), "View Analytics"] }) })] })] })] })] }));
};
exports.Dashboard = Dashboard;
//# sourceMappingURL=Dashboard.js.map