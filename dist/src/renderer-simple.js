"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const client_1 = require("react-dom/client");
require("./styles/globals.css");
console.log('🔍 Renderer script started');
const SimpleApp = () => {
    console.log('🔍 SimpleApp component rendered');
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-gray-100 p-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-4xl mx-auto", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-bold text-gray-900 mb-8", children: "PlayListify" }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow-md p-6 mb-6", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold mb-4 text-green-600", children: "\u2705 React Frontend Setup Complete!" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mb-4", children: "The frontend is now configured with:" }), (0, jsx_runtime_1.jsxs)("ul", { className: "list-disc list-inside space-y-2 text-gray-700", children: [(0, jsx_runtime_1.jsx)("li", { children: "React 19 with TypeScript" }), (0, jsx_runtime_1.jsx)("li", { children: "TailwindCSS for styling" }), (0, jsx_runtime_1.jsx)("li", { children: "Shadcn/ui components" }), (0, jsx_runtime_1.jsx)("li", { children: "Lucide React icons" }), (0, jsx_runtime_1.jsx)("li", { children: "PostCSS processing" }), (0, jsx_runtime_1.jsx)("li", { children: "Webpack configuration" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-blue-900 mb-2", children: "\uD83C\uDFA8 UI Framework" }), (0, jsx_runtime_1.jsx)("p", { className: "text-blue-700 text-sm", children: "Shadcn/ui components are ready to use with consistent theming and dark/light mode support" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-green-900 mb-2", children: "\uD83C\uDFAF Styling System" }), (0, jsx_runtime_1.jsx)("p", { className: "text-green-700 text-sm", children: "TailwindCSS utility classes with custom design tokens and responsive breakpoints" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-center", children: (0, jsx_runtime_1.jsx)("button", { className: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors shadow-md hover:shadow-lg", onClick: () => {
                            console.log('🔍 Button clicked!');
                            alert('React + TailwindCSS is working perfectly!');
                        }, children: "Test React + TailwindCSS" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 p-4 bg-gray-50 rounded-lg", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-gray-800 mb-2", children: "Next Steps:" }), (0, jsx_runtime_1.jsxs)("ul", { className: "text-sm text-gray-600 space-y-1", children: [(0, jsx_runtime_1.jsx)("li", { children: "\u2022 UI components are available in src/components/ui/" }), (0, jsx_runtime_1.jsx)("li", { children: "\u2022 Global styles configured in src/styles/globals.css" }), (0, jsx_runtime_1.jsx)("li", { children: "\u2022 TailwindCSS config in tailwind.config.js" }), (0, jsx_runtime_1.jsx)("li", { children: "\u2022 Ready for playlist management UI development" })] })] })] }) }));
};
console.log('🔍 Looking for root container...');
const container = document.getElementById('root');
console.log('🔍 Root container:', container);
if (container) {
    console.log('🔍 Creating React root...');
    const root = (0, client_1.createRoot)(container);
    console.log('🔍 Rendering app...');
    root.render((0, jsx_runtime_1.jsx)(SimpleApp, {}));
    console.log('🔍 App rendered successfully');
}
else {
    console.error('❌ Root container not found');
}
console.log('🔍 Renderer script completed');
//# sourceMappingURL=renderer-simple.js.map