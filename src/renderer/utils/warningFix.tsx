// Our own warning implementation
const warning = (condition: any, message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    if (!condition) {
      console.warn('Warning:', message);
    }
  }
  return undefined;
};

// Export the warning function directly to make it available as a named import
export { warning };

// Also export as default for modules that expect it as default export
export default warning; 