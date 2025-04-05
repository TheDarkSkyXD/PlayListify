/**
 * Format seconds into human-readable duration (MM:SS or HH:MM:SS)
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) {
    return '00:00';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(remainingSeconds).padStart(2, '0');
  
  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  
  return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || isNaN(bytes)) {
    return '0 B';
  }
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format date to localized string
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format a relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return formatDate(dateStr);
    }
  } catch (e) {
    return dateStr;
  }
}
