/**
 * Helper functions to handle YouTube's SSAP (server-side ads) experiment
 * which can interfere with yt-dlp's ability to extract video URLs.
 * 
 * See: https://github.com/yt-dlp/yt-dlp/issues/12482
 */

/**
 * Get the player client arguments to avoid SSAP experiment issues
 * 
 * @param clientType The type of player client to use
 * @returns The extractor args string
 */
export function getPlayerClientArgs(clientType: 'android' | 'ios' | 'tvhtml5' | 'web' = 'android'): string {
  // Different player clients have different behaviors with the SSAP experiment
  switch (clientType) {
    case 'android':
      // Android client is less likely to be affected by SSAP
      return 'youtube:player_client=android;player_skip=js;formats=missing_pot';
    case 'ios':
      // iOS client is another option that often works
      return 'youtube:player_client=ios;player_skip=js;formats=missing_pot';
    case 'tvhtml5':
      // TVHTML5 client is a good last resort
      return 'youtube:player_client=TVHTML5;player_skip=js;formats=missing_pot';
    case 'web':
    default:
      // Web client is most likely to be affected by SSAP
      return 'youtube:player_client=web;formats=missing_pot';
  }
}

/**
 * Get the player client arguments for all client types
 * This is useful for fallback strategies
 * 
 * @returns An array of extractor args for different player clients
 */
export function getAllPlayerClientArgs(): string[] {
  return [
    getPlayerClientArgs('android'),
    getPlayerClientArgs('ios'),
    getPlayerClientArgs('tvhtml5'),
    getPlayerClientArgs('web')
  ];
}

/**
 * Get the recommended yt-dlp arguments to avoid SSAP experiment issues
 * 
 * @param clientType The type of player client to use
 * @returns An array of arguments to pass to yt-dlp
 */
export function getRecommendedArgs(clientType: 'android' | 'ios' | 'tvhtml5' | 'web' = 'android'): string[] {
  return [
    '--extractor-args', getPlayerClientArgs(clientType)
  ];
}

/**
 * Get the fallback arguments to try when the primary download fails
 * 
 * @returns An array of fallback arguments to try
 */
export function getFallbackArgs(): string[][] {
  return [
    // First fallback: Try iOS client
    ['--extractor-args', getPlayerClientArgs('ios')],
    
    // Second fallback: Try TVHTML5 client
    ['--extractor-args', getPlayerClientArgs('tvhtml5')],
    
    // Third fallback: Try web client with additional options
    [
      '--extractor-args', getPlayerClientArgs('web'),
      '--no-check-certificate',
      '--no-cache-dir',
      '--cookies-from-browser', 'chrome'
    ]
  ];
}
