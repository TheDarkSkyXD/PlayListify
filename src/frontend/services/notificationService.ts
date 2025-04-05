import { toast } from '../components/ui/use-toast';

// Variable to hold the audio element
let notificationSound: HTMLAudioElement | null = null;

// Initialize the notification sound with a short beep sound encoded as a data URL
function initNotificationSound() {
  if (!notificationSound && typeof window !== 'undefined') {
    notificationSound = new Audio();
    // This is a short beep sound encoded as a data URL
    notificationSound.src = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18AAAAA';
    notificationSound.load();
  }
}

// Play notification sound
function playNotificationSound() {
  if (!notificationSound) {
    initNotificationSound();
  }
  
  if (notificationSound) {
    // Reset the audio to the beginning if it's already playing
    notificationSound.pause();
    notificationSound.currentTime = 0;
    
    // Play the sound
    notificationSound.play().catch(err => {
      console.error('Failed to play notification sound:', err);
    });
  }
}

// Send a desktop notification
function sendDesktopNotification(title: string, body: string, onClick?: () => void) {
  // Check if the browser supports notifications
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return;
  }
  
  // Check if we already have permission
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: body,
      icon: '/icons/app-icon.png'
    });
    
    if (onClick) {
      notification.onclick = onClick;
    }
  } 
  // Otherwise, ask for permission
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        const notification = new Notification(title, {
          body: body,
          icon: '/icons/app-icon.png'
        });
        
        if (onClick) {
          notification.onclick = onClick;
        }
      }
    });
  }
}

// Show a toast with optional sound and desktop notification
function showNotification(options: {
  title: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
  playSound?: boolean;
  desktopNotification?: boolean;
  onClick?: () => void;
}) {
  const { 
    title, 
    description, 
    variant = 'default', 
    duration = 5000,
    playSound = false,
    desktopNotification = false,
    onClick
  } = options;
  
  // Show toast notification
  toast({
    title,
    description,
    variant,
    duration,
  });
  
  // Play sound if requested
  if (playSound) {
    playNotificationSound();
  }
  
  // Send desktop notification if requested
  if (desktopNotification) {
    sendDesktopNotification(title, description, onClick);
  }
}

// Export the notification service functions
export const notificationService = {
  showNotification,
  playNotificationSound,
  sendDesktopNotification
}; 