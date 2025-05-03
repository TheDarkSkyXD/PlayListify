import React from 'react';
import { Download, Check, X, Loader } from 'lucide-react';
import useDownloadStore from '../../store/downloadStore';

interface DownloadButtonProps {
  videoId: string;
  videoTitle: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  videoId,
  videoTitle,
  size = 'md',
  variant = 'primary',
}) => {
  const { downloads, openDownloadModal } = useDownloadStore();
  
  // Check if video is already in downloads
  const download = Object.values(downloads).find(d => d.videoId === videoId);
  
  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    ghost: 'bg-transparent hover:bg-secondary/20',
  };
  
  // Get appropriate icon and classes based on download status
  const getButtonContent = () => {
    if (!download) {
      return {
        icon: <Download className="mx-auto size-5" />,
        classes: `${variantClasses[variant]} ${sizeClasses[size]} rounded-full flex items-center justify-center focus:outline-none`,
        title: 'Download video',
      };
    }
    
    switch (download.status) {
      case 'downloading':
        // Show progress indicator
        return {
          icon: <div className="relative flex items-center justify-center w-full h-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-full h-full">
                <circle
                  className="text-gray-300"
                  strokeWidth="2"
                  stroke="currentColor"
                  fill="transparent"
                  r="45%"
                  cx="50%"
                  cy="50%"
                />
                <circle
                  className="text-primary"
                  strokeWidth="2"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="45%"
                  cx="50%"
                  cy="50%"
                  strokeDasharray={`${download.progress * 2.83} 283`} // 2*PI*r where r=45
                />
              </svg>
              <span className="absolute text-xs font-medium">{Math.round(download.progress)}%</span>
            </div>
          </div>,
          classes: `bg-transparent text-primary ${sizeClasses[size]} rounded-full flex items-center justify-center cursor-not-allowed`,
          title: `Downloading: ${Math.round(download.progress)}% complete`,
        };
      case 'queued':
        return {
          icon: <Loader className="mx-auto size-5 animate-spin" />,
          classes: `bg-amber-500 text-white ${sizeClasses[size]} rounded-full flex items-center justify-center cursor-not-allowed`,
          title: 'Queued for download',
        };
      case 'completed':
        return {
          icon: <Check className="mx-auto size-5" />,
          classes: `bg-green-500 text-white ${sizeClasses[size]} rounded-full flex items-center justify-center`,
          title: 'Download complete',
        };
      case 'failed':
        return {
          icon: <X className="mx-auto size-5" />,
          classes: `bg-red-500 text-white ${sizeClasses[size]} rounded-full flex items-center justify-center`,
          title: 'Download failed',
        };
      default:
        return {
          icon: <Download className="mx-auto size-5" />,
          classes: `${variantClasses[variant]} ${sizeClasses[size]} rounded-full flex items-center justify-center focus:outline-none`,
          title: 'Download video',
        };
    }
  };
  
  const { icon, classes, title } = getButtonContent();
  
  const handleClick = () => {
    if (!download || download.status === 'failed') {
      // Open download modal
      openDownloadModal(videoId);
    }
    // Do nothing for other states (downloading, queued, completed)
  };
  
  return (
    <button
      type="button"
      className={classes}
      onClick={handleClick}
      disabled={download?.status === 'downloading' || download?.status === 'queued'}
      title={title}
      aria-label={title}
    >
      {icon}
    </button>
  );
}; 