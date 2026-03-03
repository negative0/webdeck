import { useState, useEffect, useCallback, useRef } from 'react';

interface UseWakeLockProps {
  enabled: boolean;
}

interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  request: () => Promise<void>;
  release: () => Promise<void>;
}

export const useWakeLock = (enabled: boolean): UseWakeLockReturn => {
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isMounted = useRef(true);
  const enabledRef = useRef(enabled);

  // Update enabled ref
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Setup isMounted pattern for safe state updates
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check browser support on mount
  useEffect(() => {
    if ('wakeLock' in navigator || (window as any).ReactNativeWebView) {
      setIsSupported(true);
    } else {
      console.warn('Wake Lock API is not supported in this browser');
    }
  }, []);

  // Request wake lock with retry logic
  const requestWakeLock = useCallback(async (retryCount = 0, maxRetries = 3): Promise<void> => {
    if (!isMounted.current) return;

    // Check if already active
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      console.log('Wake lock already active');
      return;
    }

    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'WAKE_LOCK_ACQUIRE' }));
      setIsActive(true);
      return;
    }

    // Check browser support
    if (!('wakeLock' in navigator)) {
      if (isMounted.current) {
        setIsSupported(false);
      }
      return;
    }

    try {
      const wakeLock = await navigator.wakeLock!.request('screen');

      if (!isMounted.current) {
        // Component unmounted during request, release immediately
        await wakeLock.release();
        return;
      }

      wakeLockRef.current = wakeLock;
      setIsActive(true);
      console.log('Wake lock acquired successfully');

      // Attach release event listener (inline to avoid circular dependency)
      const handleRelease = () => {
        console.log('Wake lock was released');
        if (isMounted.current) {
          setIsActive(false);
        }
        wakeLockRef.current = null;

        // Re-acquire if page is visible and still enabled
        if (document.visibilityState === 'visible' && enabledRef.current) {
          console.log('Attempting to re-acquire wake lock after release');
          // Use a small delay to avoid immediate re-request during page transitions
          setTimeout(() => {
            if (isMounted.current && enabledRef.current) {
              requestWakeLock();
            }
          }, 100);
        }
      };

      wakeLock.addEventListener('release', handleRelease);
    } catch (err) {
      const error = err as Error;
      console.error(`Wake Lock error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);

      if (!isMounted.current) return;

      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        console.warn('Wake Lock permission denied by user or browser policy');
        setIsSupported(false);
        return;
      }

      if (error.name === 'NotSupportedError') {
        console.warn('Wake Lock is not supported');
        setIsSupported(false);
        return;
      }

      // Retry with exponential backoff for other errors
      if (retryCount < maxRetries) {
        const delay = Math.pow(3, retryCount) * 100; // 100ms, 300ms, 900ms
        console.log(`Retrying wake lock request in ${delay}ms...`);
        setTimeout(() => {
          if (isMounted.current && enabledRef.current) {
            requestWakeLock(retryCount + 1, maxRetries);
          }
        }, delay);
      }
    }
  }, []);

  // Release wake lock
  const release = useCallback(async (): Promise<void> => {
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'WAKE_LOCK_RELEASE' }));
      if (isMounted.current) setIsActive(false);
      return;
    }

    if (!wakeLockRef.current) return;

    try {
      await wakeLockRef.current.release();
      console.log('Wake lock released manually');
    } catch (err) {
      console.error('Error releasing wake lock:', err);
    }

    if (isMounted.current) {
      setIsActive(false);
    }
    wakeLockRef.current = null;
  }, []);

  // Handle visibility changes to re-acquire wake lock
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      console.log('Page became visible');
      // Only re-acquire if enabled and wake lock is not active
      if (enabledRef.current && (!wakeLockRef.current || wakeLockRef.current.released)) {
        console.log('Re-acquiring wake lock after visibility change');
        requestWakeLock();
      }
    } else {
      console.log('Page became hidden, wake lock will be released by browser');
    }
  }, [requestWakeLock]);

  // Setup visibility change listener
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Handle enabled state changes
  useEffect(() => {
    if (enabled) {
      requestWakeLock();
    } else {
      release();
    }
  }, [enabled, requestWakeLock, release]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  return {
    isSupported,
    isActive,
    request: requestWakeLock,
    release,
  };
};
