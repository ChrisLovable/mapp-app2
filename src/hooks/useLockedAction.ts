import { useState, useCallback } from 'react';

interface UseLockedActionReturn {
  locked: boolean;
  runLocked: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  setLocked: (locked: boolean) => void;
}

export function useLockedAction(): UseLockedActionReturn {
  const [locked, setLocked] = useState(false);

  const runLocked = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (locked) {
      console.log('🔒 Action locked, ignoring duplicate request');
      return undefined;
    }

    setLocked(true);
    try {
      const result = await fn();
      return result;
    } catch (error) {
      console.error('🔒 Error in locked action:', error);
      throw error;
    } finally {
      setLocked(false);
    }
  }, [locked]);

  return {
    locked,
    runLocked,
    setLocked
  };
} 