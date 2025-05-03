declare function warningFn(condition: any, message: string): void;

declare global {
  interface Window {
    warning?: typeof warningFn;
    require?: (path: string) => any;
  }
}

export default warningFn; 