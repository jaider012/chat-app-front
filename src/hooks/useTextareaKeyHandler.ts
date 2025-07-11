import { useCallback } from 'react';

interface UseTextareaKeyHandlerProps {
  onSubmit?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onEscape?: () => void;
  submitKey?: string;
  modifier?: 'Shift' | 'Control' | 'Meta';
}

/**
 * Custom hook for handling textarea keyboard events
 */
export const useTextareaKeyHandler = ({
  onSubmit,
  onEscape,
  submitKey = 'Enter',
  modifier
}: UseTextareaKeyHandlerProps = {}) => {

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle escape key
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }

    // Handle submit key
    if (event.key === submitKey && onSubmit) {
      const shouldSubmit = modifier 
        ? event.getModifierState(modifier) || (modifier === 'Shift' && event.shiftKey) || (modifier === 'Control' && event.ctrlKey) || (modifier === 'Meta' && event.metaKey)
        : !event.shiftKey; // Default: submit on Enter without Shift

      if (shouldSubmit) {
        event.preventDefault();
        onSubmit(event);
      }
    }
  }, [onSubmit, onEscape, submitKey, modifier]);

  return {
    handleKeyDown
  };
};