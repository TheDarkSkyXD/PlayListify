"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = tslib_1.__importDefault(require("react"));
const client_1 = tslib_1.__importDefault(require("react-dom/client"));
const App_1 = require("./App");
require("./styles/globals.css");
console.log('🔍 DEBUGGING: Router renderer script started!');
console.log('🔍 DEBUGGING: Document ready state:', document.readyState);
const rootElement = document.getElementById('root');
console.log('🔍 DEBUGGING: Root element found:', !!rootElement);
if (rootElement) {
    console.log('🔍 DEBUGGING: Creating React root with router...');
    const root = client_1.default.createRoot(rootElement);
    console.log('🔍 DEBUGGING: About to render App...');
    root.render((0, jsx_runtime_1.jsx)(react_1.default.StrictMode, { children: (0, jsx_runtime_1.jsx)(App_1.App, {}) }));
    console.log('🔍 DEBUGGING: App rendered successfully!');
}
else {
    console.error('❌ DEBUGGING: Root element not found!');
}
//# sourceMappingURL=renderer-router.js.map