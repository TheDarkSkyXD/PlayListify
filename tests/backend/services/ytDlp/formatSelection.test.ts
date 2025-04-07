import { describe, it, expect } from '@jest/globals';
import { getFormatString } from '../../../../src/backend/services/ytDlp/video/formatSelection';

describe('Format Selection', () => {
  describe('getFormatString', () => {
    it('should return a format string that includes fallback options', () => {
      const formatString = getFormatString(1080);

      // Check that the format string includes all the necessary components
      expect(formatString).toContain('bestvideo[height<=1080]+bestaudio');
      expect(formatString).toContain('bestvideo[height<=1080]');
      expect(formatString).toContain('bestvideo+bestaudio');
      expect(formatString).toContain('best');
    });

    it('should handle different height values correctly', () => {
      // Test with 720p
      const formatString720 = getFormatString(720);
      expect(formatString720).toContain('bestvideo[height<=720]+bestaudio');
      expect(formatString720).toContain('bestvideo[height<=720]');

      // Test with 480p
      const formatString480 = getFormatString(480);
      expect(formatString480).toContain('bestvideo[height<=480]+bestaudio');
      expect(formatString480).toContain('bestvideo[height<=480]');

      // Test with 4K
      const formatString4K = getFormatString(2160);
      expect(formatString4K).toContain('bestvideo[height<=2160]+bestaudio');
      expect(formatString4K).toContain('bestvideo[height<=2160]');
    });

    it('should include fallback options for when the requested quality is not available', () => {
      const formatString = getFormatString(1080);

      // The format string should include fallbacks for when the requested quality is not available
      const formatParts = formatString.split('/');

      // Should have at least 3 fallback options
      expect(formatParts.length).toBeGreaterThanOrEqual(3);

      // Should include a fallback to best video+audio regardless of height
      expect(formatString).toContain('bestvideo+bestaudio');

      // Should include a fallback to best format
      expect(formatString).toContain('best');
    });
  });
});
