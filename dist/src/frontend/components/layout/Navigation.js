"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Navigation = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_1 = require("@tanstack/react-router");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const Navigation = () => {
    const routerState = (0, react_router_1.useRouterState)();
    const currentPath = routerState.location.pathname;
    const navigationItems = [
        {
            to: '/',
            label: 'Dashboard',
            icon: lucide_react_1.Home,
            exact: true,
        },
        {
            to: '/playlists',
            label: 'Playlists',
            icon: lucide_react_1.List,
            exact: false,
        },
        {
            to: '/settings',
            label: 'Settings',
            icon: lucide_react_1.Settings,
            exact: true,
        },
    ];
    const isActiveRoute = (to, exact) => {
        if (exact) {
            return currentPath === to;
        }
        return currentPath.startsWith(to);
    };
    return ((0, jsx_runtime_1.jsx)("header", { className: "border-b border-border bg-card", children: (0, jsx_runtime_1.jsxs)("div", { className: "container mx-auto px-4 py-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)(react_router_1.Link, { to: "/", className: "flex items-center space-x-2 hover:opacity-80 transition-opacity", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Music, { className: "h-6 w-6 text-primary" }), (0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-bold", children: "PlayListify" })] }), (0, jsx_runtime_1.jsx)("nav", { className: "hidden md:flex items-center space-x-1", children: navigationItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = isActiveRoute(item.to, item.exact);
                                return ((0, jsx_runtime_1.jsxs)(react_router_1.Link, { to: item.to, className: (0, utils_1.cn)("flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors", isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"), children: [(0, jsx_runtime_1.jsx)(Icon, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)("span", { children: item.label })] }, item.to));
                            }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative hidden sm:block", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }), (0, jsx_runtime_1.jsx)(input_1.Input, { placeholder: "Search playlists...", className: "pl-10 w-64" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "Create" })] })] })] }), (0, jsx_runtime_1.jsx)("nav", { className: "md:hidden mt-4 flex items-center space-x-1 overflow-x-auto", children: navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActiveRoute(item.to, item.exact);
                        return ((0, jsx_runtime_1.jsxs)(react_router_1.Link, { to: item.to, className: (0, utils_1.cn)("flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap", isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"), children: [(0, jsx_runtime_1.jsx)(Icon, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)("span", { children: item.label })] }, item.to));
                    }) })] }) }));
};
exports.Navigation = Navigation;
//# sourceMappingURL=Navigation.js.map