"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const tslib_1 = require("tslib");
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const toolbar_react_1 = require("@stagewise/toolbar-react");
const react_2 = tslib_1.__importDefault(require("@stagewise-plugins/react"));
const App = () => {
    const [count, setCount] = (0, react_1.useState)(0);
    console.log('🔍 React App component rendered!');
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbar_react_1.StagewiseToolbar, { config: {
                    plugins: [new react_2.default()],
                } }), (0, jsx_runtime_1.jsxs)("div", { style: {
                    padding: '20px',
                    fontFamily: 'Arial, sans-serif',
                    backgroundColor: '#f0f8ff',
                    minHeight: '100vh'
                }, children: [(0, jsx_runtime_1.jsx)("h1", { style: { color: '#2c3e50', marginBottom: '20px' }, children: "\uD83C\uDFB5 PlayListify" }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '18px', marginBottom: '20px' }, children: "React is now working! \uD83C\uDF89" }), (0, jsx_runtime_1.jsx)("div", { style: { marginBottom: '20px' }, children: (0, jsx_runtime_1.jsxs)("button", { onClick: () => setCount(count + 1), style: {
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }, children: ["Count: ", count] }) }), (0, jsx_runtime_1.jsxs)("div", { style: {
                            backgroundColor: '#ecf0f1',
                            padding: '15px',
                            borderRadius: '5px',
                            border: '1px solid #bdc3c7'
                        }, children: [(0, jsx_runtime_1.jsx)("h3", { children: "\u2705 Setup Status:" }), (0, jsx_runtime_1.jsxs)("ul", { children: [(0, jsx_runtime_1.jsx)("li", { children: "\u2705 Electron app running" }), (0, jsx_runtime_1.jsx)("li", { children: "\u2705 Webpack bundling working" }), (0, jsx_runtime_1.jsx)("li", { children: "\u2705 React components rendering" }), (0, jsx_runtime_1.jsx)("li", { children: "\u2705 JavaScript execution working" }), (0, jsx_runtime_1.jsx)("li", { children: "\u2705 State management working" })] })] })] })] }));
};
exports.App = App;
//# sourceMappingURL=App.js.map