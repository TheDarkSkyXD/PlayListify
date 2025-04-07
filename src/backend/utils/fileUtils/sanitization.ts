/**
 * Sanitizes a filename to be safe for all operating systems
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) {
    return 'unnamed';
  }
  
  // Replace invalid characters with a hyphen
  return fileName
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Sanitizes a path to be safe for all operating systems
 */
export function sanitizePath(filePath: string): string {
  if (!filePath) {
    return '';
  }
  
  // Split the path into parts
  const parts = filePath.split(/[/\\]/);
  
  // Sanitize each part
  const sanitizedParts = parts.map(part => {
    // Skip empty parts and drive letters (e.g., "C:")
    if (!part || part.endsWith(':')) {
      return part;
    }
    return sanitizeFileName(part);
  });
  
  // Join the parts back together
  return sanitizedParts.join('/');
}

/**
 * Truncates a filename if it's too long
 * @param fileName The filename to truncate
 * @param maxLength The maximum length (default: 255 characters)
 */
export function truncateFileName(fileName: string, maxLength: number = 255): string {
  if (!fileName) {
    return 'unnamed';
  }
  
  if (fileName.length <= maxLength) {
    return fileName;
  }
  
  // Get the extension
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex) : '';
  
  // Calculate how much of the name we can keep
  const nameLength = maxLength - extension.length;
  
  // Truncate the name and add the extension back
  return fileName.slice(0, nameLength) + extension;
}
