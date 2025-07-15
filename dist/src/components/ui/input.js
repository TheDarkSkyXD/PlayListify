"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = void 0;
const tslib_1 = require("tslib");
const jsx_runtime_1 = require("react/jsx-runtime");
const React = tslib_1.__importStar(require("react"));
const utils_1 = require("@/lib/utils");
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return ((0, jsx_runtime_1.jsx)("input", { type: type, className: (0, utils_1.cn)("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className), ref: ref, ...props }));
});
exports.Input = Input;
Input.displayName = "Input";
//# sourceMappingURL=input.js.map