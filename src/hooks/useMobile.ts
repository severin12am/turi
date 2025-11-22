import { useEffect } from 'react';

export const useMobile = () => {
  useEffect(() => {
    const initMobile = () => {
      try {
        // Check if we're on a mobile device
        if (isMobileDevice()) {
          // Add mobile-specific CSS classes
          document.body.classList.add('mobile-app');
          document.documentElement.classList.add('mobile-app');
          
          // Ensure viewport meta tag is optimized for mobile
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
          }
        }
      } catch (error) {
        console.log('Mobile initialization error:', error);
      }
    };

    initMobile();
  }, []);
};

// Helper function to detect mobile devices
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Helper function for backward compatibility (returns false since we removed Capacitor)
export const isMobileApp = (): boolean => {
  return false;
};

