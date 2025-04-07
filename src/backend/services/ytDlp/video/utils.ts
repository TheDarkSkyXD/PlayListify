import fs from 'fs-extra';
import path from 'path';

/**
 * Clean up partial files from a failed download
 */
export async function cleanupPartialFiles(filePath: string): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath, path.extname(filePath));
    const files = await fs.readdir(dir);

    // Look for partial downloads with the same base name
    const partialFiles = files.filter((file: string) =>
      file.startsWith(basename) &&
      (file.includes('.part') || file.includes('.f') || file.includes('.temp'))
    );

    if (partialFiles.length > 0) {
      console.log(`Found ${partialFiles.length} partial download files to clean up`);
      for (const file of partialFiles) {
        const partialFilePath = path.join(dir, file);
        console.log(`Removing partial file: ${partialFilePath}`);
        await fs.remove(partialFilePath);
      }
    }
  } catch (cleanupError) {
    console.error('Error cleaning up partial files:', cleanupError);
  }
}

/**
 * Verify that a downloaded file exists and has a reasonable size
 */
export async function verifyDownloadedFile(
  outputFile: string, 
  onSuccess?: () => void
): Promise<boolean> {
  if (await fs.pathExists(outputFile)) {
    const stats = await fs.stat(outputFile);
    console.log(`Download completed. File size: ${stats.size} bytes`);

    if (stats.size < 1000) { // Less than 1KB is probably an error
      console.error(`Downloaded file is too small (${stats.size} bytes), likely an error`);
      return false;
    }

    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  } else {
    console.error(`Output file does not exist: ${outputFile}`);
    return false;
  }
}

/**
 * Truncate a command for logging
 */
export function truncateCommand(command: string, maxLength: number = 200): string {
  return command.length > maxLength 
    ? command.substring(0, maxLength) + '...' 
    : command;
}
