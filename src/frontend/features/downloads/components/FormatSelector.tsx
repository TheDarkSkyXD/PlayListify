import React from 'react';
import { 
  useAvailableFormats, 
  useAvailableQualities, 
  useAvailableAudioBitrates,
  ConversionFormat,
  QualityOption,
  AudioBitrateOption
} from '../hooks/useFormatConverter';

export interface FormatSelectorProps {
  selectedFormat: string;
  selectedQuality: string;
  selectedAudioBitrate: string;
  isAudioOnly: boolean;
  disabled?: boolean;
  onFormatChange: (format: string) => void;
  onQualityChange: (quality: string) => void;
  onAudioBitrateChange: (bitrate: string) => void;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  selectedQuality,
  selectedAudioBitrate,
  isAudioOnly,
  disabled = false,
  onFormatChange,
  onQualityChange,
  onAudioBitrateChange
}) => {
  // Get hooks for options
  const { data: formats, isLoading: formatsLoading } = useAvailableFormats();
  const { data: qualities, isLoading: qualitiesLoading } = useAvailableQualities();
  const { data: bitrates, isLoading: bitratesLoading } = useAvailableAudioBitrates();

  return (
    <div className="mb-6">
      <h3 className="font-medium mb-2">Output Format</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm mb-1">Format</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={selectedFormat}
            onChange={(e) => onFormatChange(e.target.value)}
            disabled={disabled}
          >
            {formatsLoading ? (
              <option>Loading...</option>
            ) : (
              formats?.map((format: ConversionFormat) => (
                <option key={format.id} value={format.id}>
                  {format.name} ({format.type})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Quality Selection (only for video formats) */}
        {!isAudioOnly && (
          <div>
            <label className="block text-sm mb-1">Quality</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={selectedQuality}
              onChange={(e) => onQualityChange(e.target.value)}
              disabled={disabled}
            >
              {qualitiesLoading ? (
                <option>Loading...</option>
              ) : (
                qualities?.map((quality: QualityOption) => (
                  <option key={quality.id} value={quality.id}>
                    {quality.name} {quality.resolution ? `(${quality.resolution})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Audio Bitrate */}
        <div>
          <label className="block text-sm mb-1">Audio Bitrate</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={selectedAudioBitrate}
            onChange={(e) => onAudioBitrateChange(e.target.value)}
            disabled={disabled}
          >
            {bitratesLoading ? (
              <option>Loading...</option>
            ) : (
              bitrates?.map((bitrate: AudioBitrateOption) => (
                <option key={bitrate.id} value={bitrate.id}>
                  {bitrate.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FormatSelector; 