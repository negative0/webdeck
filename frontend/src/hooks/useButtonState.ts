import { useState, useEffect, useCallback, useRef } from 'react';
import { deckService } from '../services/deck.service';

interface UseButtonStateProps {
  checkCommand?: string;
  interval?: number;
}

export const useButtonState = ({ checkCommand, interval = 5_000 }: UseButtonStateProps) => {
  const [isActive, setIsActive] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const checkState = useCallback(async () => {
    if (!checkCommand) return;

    try {
      const result = await deckService.executeCommand(checkCommand);
      if (isMounted.current && result.success) {
        // Check for common "true" values in stdout
        const output = (result.stdout || '').trim().toLowerCase();
        setIsActive(output === 'true' || output === 'on' || output === '1' || output === 'yes');
      }
    } catch (error) {
      console.error('Failed to check button state:', error);
    }
  }, [checkCommand]);

  useEffect(() => {
    if (!checkCommand) return;

    // Initial check
    checkState();

    const timer = setInterval(checkState, interval);

    return () => {
      clearInterval(timer);
    };
  }, [checkCommand, interval, checkState]);

  return { isActive, setIsActive, revalidate: checkState };
};
