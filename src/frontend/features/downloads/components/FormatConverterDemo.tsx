import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, FileVideo, Music } from 'lucide-react';
import FormatSelector from './FormatSelector';
import { ConversionOptions, ConversionProgress, ConversionResult } from '../../../../shared/types/appTypes';

interface FormatConverterDemoProps {
  downloadId?: string;
  filePath?: string;
  title?: string;
}

export default function FormatConverterDemo({
  downloadId,
  filePath,
  title = 'Format Converter'
}: FormatConverterDemoProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ConversionOptions>({
    format: 'mp4',
    quality: '1080p'
  });
  const [progressChannel, setProgressChannel] = useState<string | null>(null);
  const [cleanupFunction, setCleanupFunction] = useState<(() => void) | null>(null);

  // Initialize FFmpeg when component mounts
  useEffect(() => {
    window.electron.formatConverter.initFFmpeg()
      .then(result => {
        if (!result.success) {
          setError(`Failed to initialize FFmpeg: ${result.error}`);
        }
      })
      .catch(err => {
        setError(`Error initializing FFmpeg: ${err.message}`);
      });
    
    return () => {
      // Clean up progress listener when component unmounts
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, []);

  // Set up progress listener when progressChannel changes
  useEffect(() => {
    if (progressChannel) {
      const cleanup = window.electron.formatConverter.onConversionProgress(
        progressChannel,
        (conversionProgress: ConversionProgress) => {
          setProgress(conversionProgress);
        }
      );
      
      setCleanupFunction(() => cleanup);
      
      return () => {
        cleanup();
      };
    }
  }, [progressChannel]);

  // Handle format change from FormatSelector
  const handleFormatChange = (newOptions: ConversionOptions) => {
    setOptions(prevOptions => ({
      ...prevOptions,
      format: newOptions.format,
      quality: newOptions.quality
    }));
  };

  // Start conversion
  const handleStartConversion = async () => {
    setIsConverting(true);
    setProgress(null);
    setResult(null);
    setError(null);
    
    try {
      let response;
      
      if (downloadId) {
        // Convert a downloaded video
        response = await window.electron.formatConverter.convertDownloadedVideo(
          downloadId,
          options
        );
      } else if (filePath) {
        // Convert a file
        response = await window.electron.formatConverter.convertFile(
          filePath,
          options
        );
      } else {
        throw new Error('Either downloadId or filePath must be provided');
      }
      
      if (response.success) {
        setProgressChannel(response.progressChannel || null);
        setResult(response.result || null);
      } else {
        setError(response.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during conversion');
    } finally {
      setIsConverting(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hours > 0 ? hours.toString().padStart(2, '0') : '',
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Convert your video to different formats and qualities
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <FormatSelector
          initialFormat={options.format}
          initialQuality={options.quality as any}
          onFormatChange={handleFormatChange}
          showAdvanced={true}
          disabled={isConverting}
        />
        
        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Converting...</span>
              <span>{progress.percent}%</span>
            </div>
            <Progress value={progress.percent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {progress.timemark && <span>Time: {progress.timemark}</span>}
              {progress.fps && <span>FPS: {Math.round(progress.fps)}</span>}
              {progress.kbps && <span>Speed: {progress.kbps} kbps</span>}
            </div>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && result.success && (
          <Alert variant="default" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Conversion Complete</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Output: {result.outputPath}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="flex items-center">
                  <FileVideo className="h-3 w-3 mr-1" />
                  Format: {result.format.toUpperCase()}
                </span>
                <span className="flex items-center">
                  <Music className="h-3 w-3 mr-1" />
                  Duration: {formatDuration(result.duration)}
                </span>
                <span>Size: {formatFileSize(result.size)}</span>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleStartConversion}
          disabled={isConverting || (!downloadId && !filePath)}
          className="w-full"
        >
          {isConverting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Converting...
            </>
          ) : (
            'Start Conversion'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
