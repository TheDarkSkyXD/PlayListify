"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyState = exports.ErrorState = exports.LoadingState = void 0;
exports.QueryStateHandler = QueryStateHandler;
exports.SimpleQueryStateHandler = SimpleQueryStateHandler;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const button_1 = require("../ui/button");
const alert_1 = require("../ui/alert");
const card_1 = require("../ui/card");
/**
 * Loading State Component
 */
const LoadingState = ({ message = 'Loading...', size = 'md', variant = 'spinner', className = '', }) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };
    const containerClasses = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };
    if (variant === 'skeleton') {
        return ((0, jsx_runtime_1.jsx)("div", { className: `space-y-3 ${containerClasses[size]} ${className}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "animate-pulse", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-200 rounded w-3/4 mb-2" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-200 rounded w-1/2 mb-2" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-200 rounded w-5/6" })] }) }));
    }
    if (variant === 'pulse') {
        return ((0, jsx_runtime_1.jsx)("div", { className: `animate-pulse ${containerClasses[size]} ${className}`, children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("div", { className: "h-12 w-12 bg-gray-200 rounded-full" }) }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: `flex flex-col items-center justify-center ${containerClasses[size]} ${className}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: `animate-spin ${sizeClasses[size]} text-primary mb-2` }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: message })] }));
};
exports.LoadingState = LoadingState;
/**
 * Error State Component
 */
const ErrorState = ({ error, message, canRetry = false, onRetry, variant = 'alert', className = '', }) => {
    const errorMessage = message || error?.message || 'An unexpected error occurred';
    if (variant === 'card') {
        return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: `border-destructive/50 ${className}`, children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2 text-destructive", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-5 w-5" }), "Error"] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: errorMessage })] }), canRetry && onRetry && ((0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: onRetry, variant: "outline", size: "sm", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "h-4 w-4 mr-2" }), "Try Again"] }) }))] }));
    }
    if (variant === 'inline') {
        return ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center gap-2 text-destructive ${className}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm", children: errorMessage }), canRetry && onRetry && ((0, jsx_runtime_1.jsx)(button_1.Button, { onClick: onRetry, variant: "ghost", size: "sm", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "h-3 w-3" }) }))] }));
    }
    return ((0, jsx_runtime_1.jsxs)(alert_1.Alert, { variant: "destructive", className: className, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)(alert_1.AlertTitle, { children: "Error" }), (0, jsx_runtime_1.jsxs)(alert_1.AlertDescription, { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: errorMessage }), canRetry && onRetry && ((0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: onRetry, variant: "outline", size: "sm", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "h-4 w-4 mr-2" }), "Try Again"] }))] })] }));
};
exports.ErrorState = ErrorState;
/**
 * Empty State Component
 */
const EmptyState = ({ title = 'No data found', message = 'There is no data to display at the moment.', icon, action, variant = 'card', className = '', }) => {
    const defaultIcon = (0, jsx_runtime_1.jsx)(lucide_react_1.Database, { className: "h-12 w-12 text-muted-foreground" });
    if (variant === 'inline') {
        return ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center gap-2 text-muted-foreground ${className}`, children: [icon || (0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm", children: message }), action && ((0, jsx_runtime_1.jsx)(button_1.Button, { onClick: action.onClick, variant: "ghost", size: "sm", children: action.label }))] }));
    }
    return ((0, jsx_runtime_1.jsx)(card_1.Card, { className: className, children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "flex flex-col items-center justify-center p-8 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-4", children: icon || defaultIcon }), (0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "mb-2 text-lg", children: title }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { className: "mb-4 max-w-sm", children: message }), action && ((0, jsx_runtime_1.jsx)(button_1.Button, { onClick: action.onClick, variant: "outline", children: action.label }))] }) }));
};
exports.EmptyState = EmptyState;
/**
 * Query State Handler Component
 *
 * This component handles all query states and renders the appropriate UI
 */
function QueryStateHandler({ queryState, children, loadingComponent, errorComponent, emptyComponent, loadingProps = {}, errorProps = {}, emptyProps = {}, }) {
    // Show loading state
    if (queryState.isLoading) {
        if (loadingComponent) {
            return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: loadingComponent });
        }
        return (0, jsx_runtime_1.jsx)(exports.LoadingState, { ...loadingProps });
    }
    // Show error state
    if (queryState.isError) {
        if (errorComponent) {
            return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: errorComponent });
        }
        return ((0, jsx_runtime_1.jsx)(exports.ErrorState, { error: queryState.error, message: queryState.errorMessage || undefined, canRetry: queryState.canRetry, onRetry: queryState.retry, ...errorProps }));
    }
    // Show empty state
    if (queryState.isEmpty) {
        if (emptyComponent) {
            return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: emptyComponent });
        }
        return (0, jsx_runtime_1.jsx)(exports.EmptyState, { ...emptyProps });
    }
    // Show data
    if (queryState.hasData && queryState.data) {
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children(queryState.data) });
    }
    // Fallback to loading state
    return (0, jsx_runtime_1.jsx)(exports.LoadingState, { ...loadingProps });
}
function SimpleQueryStateHandler({ isLoading, isError, error, data, isEmpty = false, children, onRetry, }) {
    if (isLoading) {
        return (0, jsx_runtime_1.jsx)(exports.LoadingState, {});
    }
    if (isError) {
        return ((0, jsx_runtime_1.jsx)(exports.ErrorState, { error: error || null, canRetry: !!onRetry, onRetry: onRetry }));
    }
    if (isEmpty || !data) {
        return (0, jsx_runtime_1.jsx)(exports.EmptyState, {});
    }
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children(data) });
}
//# sourceMappingURL=QueryStateHandler.js.map