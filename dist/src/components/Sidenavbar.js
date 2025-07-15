"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidenavbar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Sidenavbar = ({ currentRoute, onRouteChange }) => {
    const navItems = [
        { route: '/', label: 'Dashboard', icon: '📊' },
        { route: '/playlists', label: 'My Playlists', icon: '🎵' },
        { route: '/downloads', label: 'Downloads', icon: '⬇️' },
        { route: '/history', label: 'History', icon: '🕐' },
        { route: '/settings', label: 'Settings', icon: '⚙️' },
    ];
    return ((0, jsx_runtime_1.jsxs)("nav", { className: "sidenavbar", children: [(0, jsx_runtime_1.jsx)("div", { className: "nav-header", children: (0, jsx_runtime_1.jsx)("h2", { children: "PlayListify" }) }), (0, jsx_runtime_1.jsx)("ul", { className: "nav-list", children: navItems.map((item) => ((0, jsx_runtime_1.jsx)("li", { className: "nav-item", children: (0, jsx_runtime_1.jsxs)("button", { className: `nav-link ${currentRoute === item.route ? 'active' : ''}`, onClick: () => onRouteChange(item.route), children: [(0, jsx_runtime_1.jsx)("span", { className: "nav-icon", children: item.icon }), (0, jsx_runtime_1.jsx)("span", { className: "nav-label", children: item.label })] }) }, item.route))) })] }));
};
exports.Sidenavbar = Sidenavbar;
//# sourceMappingURL=Sidenavbar.js.map