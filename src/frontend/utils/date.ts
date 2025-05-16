export function formatUploadDate(dateString?: string): string {
  if (!dateString) return 'Date unknown';

  // Check if it's YYYYMMDD format from yt-dlp
  if (/^\d{8}$/.test(dateString)) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Try parsing as ISO string or other full date formats
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeDate(dateString?: string): string {
  if (!dateString) return 'Date unknown';

  let dateInput: Date;
  // Check if it's YYYYMMDD format from yt-dlp
  if (/^\d{8}$/.test(dateString)) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    dateInput = new Date(`${year}-${month}-${day}`);
  } else {
    // Try parsing as ISO string or other full date formats
    dateInput = new Date(dateString);
  }

  if (isNaN(dateInput.getTime())) return 'Invalid date';

  const now = new Date();
  const seconds = Math.round((now.getTime() - dateInput.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44); // Average days in month
  const years = Math.round(days / 365.25); // Account for leap years

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`; // Up to 4 weeks
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return '-';
  const date = new Date(0);
  date.setSeconds(seconds);
  const timeString = date.toISOString().slice(11, 19);
  // For videos less than an hour, display MM:SS, otherwise HH:MM:SS
  if (seconds < 3600) {
    return timeString.slice(3); // MM:SS
  }
  return timeString; // HH:MM:SS
} 