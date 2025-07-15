"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootLayout = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_1 = require("@tanstack/react-router");
const Navigation_1 = require("./Navigation");
const ErrorBoundary_1 = require("../common/ErrorBoundary");
const RootLayout = () => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-background text-foreground", children: [(0, jsx_runtime_1.jsx)(Navigation_1.Navigation, {}), (0, jsx_runtime_1.jsx)("main", { className: "container mx-auto px-4 py-8", children: (0, jsx_runtime_1.jsx)(ErrorBoundary_1.ErrorBoundary, { children: (0, jsx_runtime_1.jsx)(react_router_1.Outlet, {}) }) })] }));
};
exports.RootLayout = RootLayout;
//# sourceMappingURL=RootLayout.js.map