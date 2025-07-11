import { useCallback, useEffect } from 'react';

interface UseModalKeyHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  onEscape?: () => void;
  enableGlobalHandler?: boolean;
}

/**
 * Custom hook for handling modal keyboard events
 */
export const useModalKeyHandler = ({
  isOpen,
  onClose,
  onEscape,
  enableGlobalHandler = true
}: UseModalKeyHandlerProps) => {

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      
      if (onEscape) {
        onEscape();
      } else {
        onClose();
      }
    }
  }, [onClose, onEscape]);

  const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      event.stopPropagation();
      
      if (onEscape) {
        onEscape();
      } else {
        onClose();
      }
    }
  }, [isOpen, onClose, onEscape]);

  // Add global event listener when modal is open
  useEffect(() => {
    if (isOpen && enableGlobalHandler) {
      document.addEventListener('keydown', handleGlobalKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleGlobalKeyDown);
      };
    }
  }, [isOpen, enableGlobalHandler, handleGlobalKeyDown]);

  return {
    handleKeyDown
  };
};