import { useEffect, useState } from 'react';

export interface ScreenOrientation {
  isLandscape: boolean;
  orientation: 'portrait' | 'landscape';
}

export function useScreenOrientation(): ScreenOrientation {
  const [orientation, setOrientation] = useState<ScreenOrientation>({
    isLandscape: window.innerWidth > window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
  });

  useEffect(() => {
    const updateOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setOrientation({
        isLandscape,
        orientation: isLandscape ? 'landscape' : 'portrait',
      });
    };

    // Listen to window resize
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    // Also try screen.orientation API if available
    if (screen.orientation) {
      const handleOrientationChange = () => {
        updateOrientation();
      };
      screen.orientation.addEventListener('change', handleOrientationChange);
      return () => {
        window.removeEventListener('resize', updateOrientation);
        window.removeEventListener('orientationchange', updateOrientation);
        screen.orientation?.removeEventListener('change', handleOrientationChange);
      };
    }

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
}
