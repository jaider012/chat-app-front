import { useCallback } from 'react';

interface UseMessageSenderProps {
  onSendMessage?: (content: string) => void;
  onClear?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for handling message sending logic
 */
export const useMessageSender = ({
  onSendMessage,
  onClear,
  onError
}: UseMessageSenderProps) => {

  const handleSendMessage = useCallback((
    event: React.FormEvent,
    messageContent: string
  ) => {
    event.preventDefault();
    
    try {
      const trimmedContent = messageContent.trim();
      
      if (!trimmedContent) {
        return;
      }

      if (!onSendMessage) {
        console.error('No send message handler provided');
        return;
      }

      onSendMessage(trimmedContent);
      
      if (onClear) {
        onClear();
      }
      
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  }, [onSendMessage, onClear, onError]);

  const validateMessage = useCallback((content: string): boolean => {
    return content.trim().length > 0;
  }, []);

  const canSendMessage = useCallback((content: string): boolean => {
    return validateMessage(content);
  }, [validateMessage]);

  return {
    handleSendMessage,
    validateMessage,
    canSendMessage
  };
};