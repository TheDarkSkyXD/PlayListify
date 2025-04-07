/**
 * Mock implementation of the getFormatString function
 */
export function getFormatString(maxHeight: number | 'best'): string {
  // If 'best' is selected, don't limit by height
  if (maxHeight === 'best') {
    // This format string prioritizes the best video and audio quality available
    return 'bestvideo+bestaudio/best';
  }
  
  // For specific height limits, use a more sophisticated format string
  return `bestvideo[height<=${maxHeight}]+bestaudio/best[height<=${maxHeight}]/bestvideo[height<=${maxHeight}]/bestvideo+bestaudio/best`;
}
