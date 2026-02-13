import { useState, useEffect } from 'react';
import { deckService } from '../services/deck.service';

interface UseButtonStateProps {
  checkCommand?: string;
  interval?: number;
}

export const useButtonState = ({ checkCommand, interval = 5_000 }: UseButtonStateProps) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!checkCommand) return;

    let isMounted = true;

    const checkState = async () => {
      try {
        const result = await deckService.executeCommand(checkCommand);
        if (isMounted && result.success) {
          // Check for common "true" values in stdout
          const output = (result.stdout || '').trim().toLowerCase();
          setIsActive(output === 'true' || output === 'on' || output === '1' || output === 'yes');
        }
      } catch (error) {
        console.error('Failed to check button state:', error);
      }
    };

    // Initial check
    checkState();

    const timer = setInterval(checkState, interval);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [checkCommand, interval]);

  return isActive;
};
