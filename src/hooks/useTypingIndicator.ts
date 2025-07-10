import { useCallback, useRef } from 'react';

interface UseTypingIndicatorProps {
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  timeout?: number;
}

/**
 * Custom hook for managing typing indicator with timeout
 */
export const useTypingIndicator = ({
  onStartTyping,
  onStopTyping,
  timeout = 1000
}: UseTypingIndicatorProps) => {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    if (onStopTyping) {
      onStopTyping();
    }
  }, [onStopTyping]);

  const handleStartTyping = useCallback(() => {
    if (onStartTyping) {
      onStartTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, timeout);
  }, [onStartTyping, timeout, handleStopTyping]);

  const handleInputChange = useCallback((value: string) => {
    if (value.trim()) {
      handleStartTyping();
    } else {
      handleStopTyping();
    }
  }, [handleStartTyping, handleStopTyping]);

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  return {
    handleStartTyping,
    handleStopTyping,
    handleInputChange,
    cleanup
  };
};