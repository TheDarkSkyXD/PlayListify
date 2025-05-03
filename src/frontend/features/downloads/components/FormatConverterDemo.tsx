import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { 
  useVideoInfo,
  useConvertFile,
  useExtractAudio,
  useSelectFile,
  useConversionProgress,
  ConversionFormat,
} from '../hooks/useFormatConverter';
import FormatSelector from './FormatSelector';

// Define CheckIcon and XIcon as simple SVG components
const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// Simple function to extract filename from a path
const getFileName = (filePath: string): string => {
  return filePath.split(/[\\/]/).pop() || '';
};

const FormatConverterDemo: React.FC = () => {
  // Local state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('mp4');
  const [selectedQuality, setSelectedQuality] = useState<string>('best');
  const [selectedAudioBitrate, setSelectedAudioBitrate] = useState<string>('192k');
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(false);
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  // Get hooks
  const { data: videoInfo } = useVideoInfo(selectedFile);
  const { selectFile } = useSelectFile();
  const convertFile = useConvertFile();
  const extractAudio = useExtractAudio();
  const { progress, isComplete, result } = useConversionProgress(conversionId);

  // Update audioOnly state when format changes
  useEffect(() => {
    // We'll update this when the format selector returns the selected format info
    if (selectedFormat === 'mp3' || selectedFormat === 'aac' || 
        selectedFormat === 'flac' || selectedFormat === 'opus' || 
        selectedFormat === 'm4a') {
      setIsAudioOnly(true);
    } else {
      setIsAudioOnly(false);
    }
  }, [selectedFormat]);

  // Handle file selection
  const handleSelectFile = async () => {
    const filePath = await selectFile();
    if (filePath) {
      setSelectedFile(filePath);
      setFileName(getFileName(filePath));
    }
  };

  // Start the conversion process
  const handleStartConversion = async () => {
    if (!selectedFile) return;

    try {
      if (isAudioOnly) {
        // Extract audio only
        const result = await extractAudio.mutateAsync({
          inputPath: selectedFile,
          outputFormat: selectedFormat as any,
          audioBitrate: selectedAudioBitrate
        });
        setConversionId(result.id);
      } else {
        // Convert with video
        const result = await convertFile.mutateAsync({
          inputPath: selectedFile,
          format: selectedFormat,
          quality: selectedQuality,
          audioBitrate: selectedAudioBitrate
        });
        setConversionId(result.id);
      }
    } catch (error) {
      console.error('Conversion failed:', error);
    }
  };

  // Format file size for display
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    if (sizeInBytes < 1024 * 1024 * 1024) return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Reset the conversion state
  const handleReset = () => {
    setConversionId(null);
    setSelectedFile(null);
    setFileName('');
  };

  // Check if conversion process is in progress
  const isConverting = convertFile.isPending || extractAudio.isPending;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Format Converter</h2>
      
      {/* File Selection */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <h3 className="font-medium">Source File</h3>
          {videoInfo && (
            <span className="ml-2 text-sm text-gray-500">
              {videoInfo.format?.duration?.toFixed(1)}s, {formatFileSize(videoInfo.format?.size || 0)}
            </span>
          )}
        </div>
        
        {selectedFile ? (
          <div className="flex items-center">
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm">{fileName}</p>
              <p className="text-xs text-gray-500 truncate">{selectedFile}</p>
            </div>
            <Button 
              onClick={handleSelectFile} 
              variant="outline"
              className="ml-2"
              disabled={isConverting}
            >
              Change
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleSelectFile} 
            variant="default"
            className="w-full"
          >
            Select File
          </Button>
        )}
      </div>

      {/* Format Options */}
      {selectedFile && (
        <FormatSelector
          selectedFormat={selectedFormat}
          selectedQuality={selectedQuality}
          selectedAudioBitrate={selectedAudioBitrate}
          isAudioOnly={isAudioOnly}
          disabled={isConverting}
          onFormatChange={setSelectedFormat}
          onQualityChange={setSelectedQuality}
          onAudioBitrateChange={setSelectedAudioBitrate}
        />
      )}

      {/* Conversion Controls */}
      {selectedFile && !isComplete && !progress && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            className="mr-2"
            onClick={handleReset}
            disabled={isConverting}
          >
            Cancel
          </Button>
          <Button 
            variant="default"
            onClick={handleStartConversion}
            disabled={isConverting}
          >
            {isConverting && (
              <span className="mr-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            )}
            {isAudioOnly ? 'Extract Audio' : 'Convert File'}
          </Button>
        </div>
      )}

      {/* Progress Indicator */}
      {progress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Converting...</span>
            <span>{progress.percent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${progress.percent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            {progress.fps && <span>{progress.fps.toFixed(1)} fps</span>}
            {progress.kbps && <span>{progress.kbps} kbps</span>}
            {progress.timemark && <span>{progress.timemark}</span>}
          </div>
        </div>
      )}

      {/* Completion Message */}
      {isComplete && result && (
        <div className="mt-4">
          {result.success ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <h4 className="font-medium text-green-800">Conversion Completed</h4>
                  <p className="text-sm text-green-700 mt-1">
                    File saved to: <span className="font-mono text-xs break-all">{result.outputPath}</span>
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={handleReset}
                  >
                    Start New Conversion
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <XIcon className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <h4 className="font-medium text-red-800">Conversion Failed</h4>
                  {result.error && (
                    <p className="text-sm text-red-700 mt-1">{result.error}</p>
                  )}
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={handleReset}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormatConverterDemo; 