import React, { useState } from 'react';
import useDownloadStore from '../../store/downloadStore';
import { useVideoFormats, useStartVideoDownload } from '../../hooks/useDownloadQueries';
import { Button } from '../ui/Button';
import { Loader } from 'lucide-react';

// Define simple dialog components since we might not have the shadcn/ui ones yet
const Dialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }> = ({ 
  open, onOpenChange, children 
}) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg overflow-hidden max-w-md w-full">
        {children}
      </div>
      <div className="absolute inset-0 -z-10" onClick={() => onOpenChange(false)} />
    </div>
  );
};

const DialogContent: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={className}>{children}</div>
);

const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 pb-0">{children}</div>
);

const DialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-semibold">{children}</h2>
);

const DialogDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-muted-foreground mt-1">{children}</p>
);

const DialogFooter: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={`p-6 pt-0 mt-6 flex justify-end space-x-2 ${className}`}>{children}</div>
);

const DialogClose: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

// Define type for SelectTrigger props
interface SelectTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
  value?: string;
}

// Define type for SelectItem props
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onSelect?: () => void;
  isSelected?: boolean;
}

// Define simple select components
const Select: React.FC<{ value: string; onValueChange: (value: string) => void; children: React.ReactNode }> = ({ 
  value, onValueChange, children 
}) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Check if child is SelectTrigger
          if (child.type === SelectTrigger) {
            return React.cloneElement(child, { 
              onClick: () => setOpen(!open),
              value 
            } as SelectTriggerProps);
          }
          
          // Check if child is SelectContent
          if (child.type === SelectContent && open) {
            const contentProps = child.props as { children: React.ReactNode };
            return (
              <div className="absolute top-full left-0 w-full mt-1 bg-background border rounded-md shadow-lg z-10">
                {React.Children.map(contentProps.children, option => {
                  if (React.isValidElement(option) && option.type === SelectItem) {
                    const optionProps = option.props as SelectItemProps;
                    return React.cloneElement(option, {
                      onSelect: () => {
                        onValueChange(optionProps.value);
                        setOpen(false);
                      },
                      isSelected: optionProps.value === value
                    } as SelectItemProps);
                  }
                  return option;
                })}
              </div>
            );
          }
        }
        return null;
      })}
    </div>
  );
};

const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  children, onClick
}) => (
  <button 
    type="button" 
    className="w-full flex items-center justify-between px-3 py-2 border rounded-md bg-background"
    onClick={onClick}
  >
    {children}
  </button>
);

const SelectValue: React.FC<{ placeholder: string }> = ({ placeholder }) => (
  <span>{placeholder}</span>
);

const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

const SelectItem: React.FC<SelectItemProps> = ({ 
  children, onSelect, isSelected 
}) => (
  <div 
    className={`px-3 py-2 hover:bg-secondary/20 cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
    onClick={onSelect}
  >
    {children}
  </div>
);

// Import VideoFormat from downloadService
interface VideoFormat {
  format_id: string;
  format_note: string;
  ext: string;
  resolution?: string;
  fps?: number;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number;
  vbr?: number;
  abr?: number;
  format: string;
  vcodec?: string;
  acodec?: string;
  audioBitrate?: number;
}

// Updated VideoFormat interface to match what we're using
interface ExtendedVideoFormat {
  formatId: string;
  formatNote?: string;
  ext: string;
  resolution?: string;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  audioBitrate?: number;
  filesize?: number;
}

// Function to convert VideoFormat to ExtendedVideoFormat
function convertToExtendedFormat(format: VideoFormat): ExtendedVideoFormat {
  return {
    formatId: format.format_id,
    formatNote: format.format_note,
    ext: format.ext,
    resolution: format.resolution,
    fps: format.fps,
    vcodec: format.vcodec,
    acodec: format.acodec,
    audioBitrate: format.abr,
    filesize: format.filesize || format.filesize_approx
  };
}

export const DownloadOptionsModal: React.FC = () => {
  const { isDownloadModalOpen, currentVideoId, closeDownloadModal, selectedFormatId, setSelectedFormat } = useDownloadStore();
  const [downloadLocation, setDownloadLocation] = useState<string | null>(null);
  const [quality, setQuality] = useState<'best' | 'worst' | '1080p' | '720p' | '480p' | '360p' | 'audio'>('best');
  const [audioOnly, setAudioOnly] = useState(false);
  
  // Fetch formats
  const { data: rawFormats, isLoading: formatsLoading, error: formatsError } = useVideoFormats(currentVideoId);
  
  // Convert formats to ExtendedVideoFormat
  const formats: ExtendedVideoFormat[] = React.useMemo(() => {
    if (!rawFormats) return [];
    return (rawFormats as VideoFormat[]).map(convertToExtendedFormat);
  }, [rawFormats]);
  
  // Get video formats grouped by resolution
  const videoFormats = formats 
    ? formats
        .filter(f => f.vcodec !== 'none' && f.resolution !== null)
        .sort((a, b) => {
          const resA = parseInt((a.resolution?.split('x')[1] || '0'), 10);
          const resB = parseInt((b.resolution?.split('x')[1] || '0'), 10);
          return resB - resA;
        })
    : [];
    
  // Get audio-only formats
  const audioFormats = formats
    ? formats
        .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
        .sort((a, b) => {
          const bitrateA = a.audioBitrate || 0;
          const bitrateB = b.audioBitrate || 0;
          return bitrateB - bitrateA;
        })
    : [];

  // Start download mutation
  const startDownload = useStartVideoDownload();
  
  const handleDownload = () => {
    if (!currentVideoId) return;
    
    const downloadOptions = {
      videoId: currentVideoId,
      formatId: selectedFormatId || undefined,
      quality: !selectedFormatId ? quality : undefined,
      downloadPath: downloadLocation || undefined,
      audioOnly
    };
    
    startDownload.mutate(downloadOptions, {
      onSuccess: (response: any) => {
        if (response?.success) {
          closeDownloadModal();
        }
      }
    });
  };
  
  const handleSelectFormat = (formatId: string) => {
    setSelectedFormat(formatId);
  };
  
  const handleSelectQuality = (value: string) => {
    setQuality(value as any);
    // Don't set to null as it expects a string
    setSelectedFormat('');
  };
  
  const handleAudioOnlyChange = (value: boolean) => {
    setAudioOnly(value);
    if (value) {
      // If switching to audio only, select best audio format
      if (audioFormats.length > 0) {
        setSelectedFormat(audioFormats[0].formatId);
      }
    } else {
      // Don't set to null as it expects a string
      setSelectedFormat('');
    }
  };
  
  const selectLocation = async () => {
    try {
      // Fix the ipcRenderer call to use the correct API
      const result = await window.electron.ipcRenderer.invoke('download:select-directory');
      
      // Use proper type assertion for the result
      if (result && typeof result === 'object') {
        // Handle the response according to the actual structure from the IPC handler
        const typedResult = result as { success: boolean; data?: { path: string } };
        if (typedResult.success && typedResult.data?.path) {
          setDownloadLocation(typedResult.data.path);
        }
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };
  
  const renderFormatOptions = () => {
    if (formatsLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader className="size-8 animate-spin text-primary" />
          <span className="ml-2">Loading available formats...</span>
        </div>
      );
    }
    
    if (formatsError) {
      return (
        <div className="p-4 text-center text-red-500">
          Error loading formats. Please try again.
        </div>
      );
    }
    
    if (!formats || formats.length === 0) {
      return (
        <div className="p-4 text-center">
          No formats available for this video.
        </div>
      );
    }
    
    const formatsList = audioOnly ? audioFormats : videoFormats;
    
    return (
      <div className="grid gap-2 p-4">
        {formatsList.map((format) => (
          <div
            key={format.formatId}
            className={`p-3 border rounded-md cursor-pointer ${
              selectedFormatId === format.formatId 
                ? 'border-primary bg-primary/10' 
                : 'hover:bg-secondary/20'
            }`}
            onClick={() => handleSelectFormat(format.formatId)}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {format.resolution || 'Audio only'} 
                  {format.fps ? ` ${format.fps}fps` : ''}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format.ext.toUpperCase()} {format.formatNote ? `(${format.formatNote})` : ''}
                </div>
              </div>
              <div className="text-sm">
                {format.filesize 
                  ? `${Math.round(format.filesize / 1024 / 1024 * 10) / 10} MB` 
                  : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Dialog open={isDownloadModalOpen} onOpenChange={closeDownloadModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Options</DialogTitle>
          <DialogDescription>
            Select quality and format for your download
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Download Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`px-3 py-2 rounded-md ${!audioOnly ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                onClick={() => handleAudioOnlyChange(false)}
              >
                Video
              </button>
              <button
                type="button"
                className={`px-3 py-2 rounded-md ${audioOnly ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                onClick={() => handleAudioOnlyChange(true)}
              >
                Audio Only
              </button>
            </div>
          </div>
          
          {!selectedFormatId && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Quality Preset
              </label>
              <Select 
                value={quality} 
                onValueChange={handleSelectQuality}
              >
                <SelectTrigger>
                  <SelectValue placeholder={quality} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">Best Quality</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="360p">360p</SelectItem>
                  <SelectItem value="worst">Worst Quality (Smallest Size)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">
                {selectedFormatId ? 'Selected Format' : 'Advanced Format Selection'}
              </label>
              {selectedFormatId && (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setSelectedFormat('')}
                >
                  Change
                </button>
              )}
            </div>
            
            {selectedFormatId ? (
              <div className="p-2 border rounded-md">
                {formats?.find(f => f.formatId === selectedFormatId)?.resolution || 'Audio only'} - 
                {formats?.find(f => f.formatId === selectedFormatId)?.ext.toUpperCase()}
              </div>
            ) : (
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {renderFormatOptions()}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Download Location
            </label>
            <div className="flex gap-2">
              <div className="flex-1 p-2 border rounded-md text-sm truncate">
                {downloadLocation || 'Default location'}
              </div>
              <Button onClick={selectLocation}>Browse</Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={closeDownloadModal}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={formatsLoading || startDownload.isPending}>
            {startDownload.isPending ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              'Download'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 