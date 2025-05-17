import fs from 'fs';

declare global {
  // eslint-disable-next-line no-var
  var _logStream: fs.WriteStream | undefined;
}

// This export {} is important to make this a module file, 
// which allows `declare global` to work correctly.
export {}; 