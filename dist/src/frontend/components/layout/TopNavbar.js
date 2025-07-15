"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopNavbar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const TopNavbar = ({ theme, onThemeToggle }) => {
    return ((0, jsx_runtime_1.jsx)("header", { className: "top-navbar", children: (0, jsx_runtime_1.jsxs)("div", { className: "navbar-content", children: [(0, jsx_runtime_1.jsx)("h1", { className: "app-title", children: "PlayListify" }), (0, jsx_runtime_1.jsx)("div", { className: "navbar-actions", children: (0, jsx_runtime_1.jsx)("button", { className: "theme-toggle-btn", onClick: onThemeToggle, title: `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`, children: theme === 'light' ? '🌙' : '☀️' }) })] }) }));
};
exports.TopNavbar = TopNavbar;
//# sourceMappingURL=TopNavbar.js.map