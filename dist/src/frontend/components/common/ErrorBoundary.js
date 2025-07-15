"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
class ErrorBoundary extends react_1.Component {
    constructor(props) {
        super(props);
        this.handleReset = () => {
            this.setState({ hasError: false, error: undefined, errorInfo: undefined });
        };
        this.handleReload = () => {
            window.location.reload();
        };
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-[400px] flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "max-w-md w-full", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10", children: (0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { className: "h-6 w-6 text-destructive" }) }), (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Something went wrong" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "An unexpected error occurred. You can try refreshing the page or going back to the previous page." })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-4", children: [process.env.NODE_ENV === 'development' && this.state.error && ((0, jsx_runtime_1.jsxs)("details", { className: "text-xs bg-muted p-3 rounded-md", children: [(0, jsx_runtime_1.jsx)("summary", { className: "cursor-pointer font-medium mb-2", children: "Error Details" }), (0, jsx_runtime_1.jsxs)("pre", { className: "whitespace-pre-wrap break-words", children: [this.state.error.toString(), this.state.errorInfo?.componentStack] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-2", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: this.handleReset, variant: "outline", className: "flex-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "h-4 w-4 mr-2" }), "Try Again"] }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: this.handleReload, className: "flex-1", children: "Reload Page" })] })] })] }) }));
        }
        return this.props.children;
    }
}
exports.ErrorBoundary = ErrorBoundary;
//# sourceMappingURL=ErrorBoundary.js.map