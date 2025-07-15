"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const client_1 = require("react-dom/client");
console.log('🔍 Renderer script started');
const SimpleApp = () => {
    console.log('🔍 SimpleApp component rendered');
    return ((0, jsx_runtime_1.jsxs)("div", { style: { padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: 'lightblue' }, children: [(0, jsx_runtime_1.jsx)("h1", { style: { color: 'red' }, children: "PlayListify Test" }), (0, jsx_runtime_1.jsx)("p", { children: "React is working!" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                    console.log('🔍 Button clicked!');
                    alert('Button clicked!');
                }, children: "Test Button" })] }));
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