"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_query_1 = require("@tanstack/react-query");
const react_query_devtools_1 = require("@tanstack/react-query-devtools");
const react_router_1 = require("@tanstack/react-router");
const router_1 = require("./frontend/lib/router");
const query_client_1 = require("./frontend/lib/query-client");
require("./styles/globals.css");
const App = () => {
    return ((0, jsx_runtime_1.jsxs)(react_query_1.QueryClientProvider, { client: query_client_1.queryClient, children: [(0, jsx_runtime_1.jsx)(react_router_1.RouterProvider, { router: router_1.router }), process.env.NODE_ENV === 'development' && ((0, jsx_runtime_1.jsx)(react_query_devtools_1.ReactQueryDevtools, { initialIsOpen: false }))] }));
};
exports.App = App;
//# sourceMappingURL=App.js.map