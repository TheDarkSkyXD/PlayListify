"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const react_router_1 = require("@tanstack/react-router");
const Dashboard_1 = require("../pages/Dashboard");
const Settings_1 = require("../pages/Settings");
const MyPlaylists_1 = require("../pages/MyPlaylists");
const NotFound_1 = require("../pages/NotFound");
const RootLayout_1 = require("../components/layout/RootLayout");
// Root route with layout
const rootRoute = (0, react_router_1.createRootRoute)({
    component: RootLayout_1.RootLayout,
});
// Dashboard route (home page)
const dashboardRoute = (0, react_router_1.createRoute)({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Dashboard_1.Dashboard,
});
// Settings route
const settingsRoute = (0, react_router_1.createRoute)({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: Settings_1.Settings,
});
// Playlists route (for future implementation)
const playlistsRoute = (0, react_router_1.createRoute)({
    getParentRoute: () => rootRoute,
    path: '/playlists',
    component: MyPlaylists_1.Playlists,
});
// Individual playlist route (for future implementation)
const playlistRoute = (0, react_router_1.createRoute)({
    getParentRoute: () => rootRoute,
    path: '/playlists/$playlistId',
    component: () => {
        return react_1.default.createElement('div', null, 'Playlist Detail (Coming Soon)');
    },
});
// Catch-all route for 404 errors
const notFoundRoute = (0, react_router_1.createRoute)({
    getParentRoute: () => rootRoute,
    path: '*',
    component: NotFound_1.NotFound,
});
// Create the route tree
const routeTree = rootRoute.addChildren([
    dashboardRoute,
    settingsRoute,
    playlistsRoute,
    playlistRoute,
    notFoundRoute,
]);
// Create and export the router
exports.router = (0, react_router_1.createRouter)({
    routeTree,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
});
//# sourceMappingURL=router.js.map