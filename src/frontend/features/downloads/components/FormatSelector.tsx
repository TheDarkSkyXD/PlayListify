import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Slider } from '../../../components/ui/slider';
import { VIDEO_FORMATS, AUDIO_FORMATS, VIDEO_QUALITIES } from '../../../../shared/constants/appConstants';
import { DownloadOptions } from '../../../../shared/types/appTypes';
import { Film, Music, Settings } from 'lucide-react';

interface FormatSelectorProps {
  initialFormat?: string;
  initialQuality?: string;
  onFormatChange: (options: DownloadOptions) => void;
  showAdvanced?: boolean;
  disabled?: boolean;
}

export default function FormatSelector({
  initialFormat = 'mp4',
  initialQuality = '1080p',
  onFormatChange,
  showAdvanced = false,
  disabled = false
}: FormatSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>('video');
  const [format, setFormat] = useState<string>(initialFormat);
  const [quality, setQuality] = useState<string>(initialQuality);
  const [audioBitrate, setAudioBitrate] = useState<number>(192);
  const [autoConvert, setAutoConvert] = useState<boolean>(false);

  // Update parent component when format or quality changes
  useEffect(() => {
    onFormatChange({
      format: format as any,
      quality: quality as any
    });
  }, [format, quality, onFormatChange]);

  // Set active tab based on initial format
  useEffect(() => {
    if (AUDIO_FORMATS.includes(initialFormat as any)) {
      setActiveTab('audio');
    } else {
      setActiveTab('video');
    }
  }, [initialFormat]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Set default format based on tab
    if (value === 'video' && !VIDEO_FORMATS.includes(format as any)) {
      setFormat('mp4');
    } else if (value === 'audio' && !AUDIO_FORMATS.includes(format as any)) {
      setFormat('mp3');
    }
  };

  // Handle format change
  const handleFormatChange = (value: string) => {
    setFormat(value);

    // If switching to audio format, update the tab
    if (AUDIO_FORMATS.includes(value as any) && activeTab !== 'audio') {
      setActiveTab('audio');
    } else if (VIDEO_FORMATS.includes(value as any) && activeTab !== 'video') {
      setActiveTab('video');
    }
  };

  // Handle quality change
  const handleQualityChange = (value: string) => {
    setQuality(value);
  };

  // Handle audio bitrate change
  const handleAudioBitrateChange = (value: number[]) => {
    setAudioBitrate(value[0]);
  };

  // Handle auto convert change
  const handleAutoConvertChange = (checked: boolean) => {
    setAutoConvert(checked);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Format Options</CardTitle>
        <CardDescription>
          Choose the format and quality for your download
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="video" disabled={disabled}>
              <Film className="h-4 w-4 mr-2" />
              Video
            </TabsTrigger>
            <TabsTrigger value="audio" disabled={disabled}>
              <Music className="h-4 w-4 mr-2" />
              Audio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoFormat">Video Format</Label>
              <Select
                value={format}
                onValueChange={handleFormatChange}
                disabled={disabled}
              >
                <SelectTrigger id="videoFormat">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_FORMATS.map((videoFormat) => (
                    <SelectItem key={videoFormat} value={videoFormat}>
                      {videoFormat.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoQuality">Video Quality</Label>
              <Select
                value={quality}
                onValueChange={handleQualityChange}
                disabled={disabled}
              >
                <SelectTrigger id="videoQuality">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_QUALITIES.map((videoQuality) => (
                    <SelectItem key={videoQuality} value={videoQuality}>
                      {videoQuality === '4320p' ? '8K (4320p)' :
                       videoQuality === '2160p' ? '4K (2160p)' :
                       videoQuality === '1440p' ? 'QHD (1440p)' :
                       videoQuality === '1080p' ? 'Full HD (1080p)' :
                       videoQuality === '720p' ? 'HD (720p)' :
                       videoQuality === '480p' ? 'SD (480p)' :
                       videoQuality === '360p' ? 'LD (360p)' :
                       videoQuality === 'best' ? 'Best Available' :
                       videoQuality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showAdvanced && (
              <div className="pt-2">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="autoConvert"
                    checked={autoConvert}
                    onCheckedChange={handleAutoConvertChange}
                    disabled={disabled}
                  />
                  <Label htmlFor="autoConvert" className="cursor-pointer">
                    Also extract audio (MP3)
                  </Label>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="audio" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audioFormat">Audio Format</Label>
              <Select
                value={format}
                onValueChange={handleFormatChange}
                disabled={disabled}
              >
                <SelectTrigger id="audioFormat">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIO_FORMATS.map((audioFormat) => (
                    <SelectItem key={audioFormat} value={audioFormat}>
                      {audioFormat.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showAdvanced && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="audioBitrate">Audio Bitrate: {audioBitrate} kbps</Label>
                </div>
                <Slider
                  id="audioBitrate"
                  min={64}
                  max={320}
                  step={32}
                  value={[audioBitrate]}
                  onValueChange={handleAudioBitrateChange}
                  disabled={disabled}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {showAdvanced && (
        <CardFooter className="flex justify-between pt-0">
          <Button variant="outline" size="sm" disabled={disabled}>
            <Settings className="h-4 w-4 mr-2" />
            Advanced Options
          </Button>
          <Button variant="default" size="sm" disabled={disabled}>
            Apply
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
