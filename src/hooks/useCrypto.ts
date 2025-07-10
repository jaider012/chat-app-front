import { useCallback, useState, useEffect } from 'react';
import { useCryptoContext } from '../contexts/CryptoContext';
import { EncryptionStatus, EncryptedMessage, CryptoError } from '../crypto/types';

export const useCrypto = () => {
  const context = useCryptoContext();
  return context;
};

export const useEncryption = (conversationId: string) => {
  const {
    encryptMessage,
    decryptMessage,
    getEncryptionStatus,
    isConversationSecure,
    startKeyExchange,
    completeKeyExchange,
    clearConversationKeys,
    error,
    isInitialized,
  } = useCryptoContext();

  const [status, setStatus] = useState<EncryptionStatus>(EncryptionStatus.NOT_INITIALIZED);
  const [isSecure, setIsSecure] = useState(false);

  useEffect(() => {
    if (isInitialized && conversationId) {
      const currentStatus = getEncryptionStatus(conversationId);
      setStatus(currentStatus);
      setIsSecure(isConversationSecure(conversationId));
    }
  }, [conversationId, isInitialized, getEncryptionStatus, isConversationSecure]);

  const encrypt = useCallback(
    async (message: string, sender: string = 'current-user') => {
      if (!conversationId) {
        throw new Error('No conversation ID provided');
      }
      return await encryptMessage(message, conversationId, sender);
    },
    [encryptMessage, conversationId]
  );

  const decrypt = useCallback(
    async (encryptedMessage: EncryptedMessage) => {
      return await decryptMessage(encryptedMessage);
    },
    [decryptMessage]
  );

  const initiateKeyExchange = useCallback(async () => {
    if (!conversationId) {
      throw new Error('No conversation ID provided');
    }
    return await startKeyExchange(conversationId);
  }, [startKeyExchange, conversationId]);

  const finishKeyExchange = useCallback(
    async (publicKey: string) => {
      if (!conversationId) {
        throw new Error('No conversation ID provided');
      }
      await completeKeyExchange(conversationId, publicKey);
    },
    [completeKeyExchange, conversationId]
  );

  const clearKeys = useCallback(() => {
    if (conversationId) {
      clearConversationKeys(conversationId);
    }
  }, [clearConversationKeys, conversationId]);

  return {
    encrypt,
    decrypt,
    initiateKeyExchange,
    finishKeyExchange,
    clearKeys,
    status,
    isSecure,
    error,
    conversationId,
  };
};

export const useSecureMessaging = (conversationId: string) => {
  const { encrypt, decrypt, status, isSecure, error } = useEncryption(conversationId);
  const [messageQueue, setMessageQueue] = useState<EncryptedMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const sendSecureMessage = useCallback(
    async (message: string, sender: string = 'current-user') => {
      if (!isSecure) {
        throw new Error('Conversation is not secure');
      }

      setIsProcessing(true);
      try {
        const encryptedMessage = await encrypt(message, sender);
        return encryptedMessage;
      } finally {
        setIsProcessing(false);
      }
    },
    [encrypt, isSecure]
  );

  const receiveSecureMessage = useCallback(
    async (encryptedMessage: EncryptedMessage) => {
      setIsProcessing(true);
      try {
        const decryptedMessage = await decrypt(encryptedMessage);
        return decryptedMessage;
      } finally {
        setIsProcessing(false);
      }
    },
    [decrypt]
  );

  const queueMessage = useCallback((encryptedMessage: EncryptedMessage) => {
    setMessageQueue(prev => [...prev, encryptedMessage]);
  }, []);

  const processQueue = useCallback(async () => {
    if (messageQueue.length === 0 || isProcessing) return;

    setIsProcessing(true);
    const decryptedMessages: { message: string; original: EncryptedMessage }[] = [];

    try {
      for (const encryptedMessage of messageQueue) {
        try {
          const decryptedMessage = await decrypt(encryptedMessage);
          decryptedMessages.push({ message: decryptedMessage, original: encryptedMessage });
        } catch (error) {
          console.error('Failed to decrypt queued message:', error);
        }
      }

      setMessageQueue([]);
      return decryptedMessages;
    } finally {
      setIsProcessing(false);
    }
  }, [messageQueue, decrypt, isProcessing]);

  useEffect(() => {
    if (isSecure && messageQueue.length > 0) {
      processQueue();
    }
  }, [isSecure, messageQueue.length, processQueue]);

  return {
    sendSecureMessage,
    receiveSecureMessage,
    queueMessage,
    processQueue,
    messageQueue,
    isProcessing,
    status,
    isSecure,
    error,
  };
};

export const useKeyExchange = () => {
  const { startKeyExchange, completeKeyExchange, getUserPublicKey, error } = useCryptoContext();
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeState, setExchangeState] = useState<{
    conversationId: string | null;
    publicKey: string | null;
    isInitiator: boolean;
  }>({
    conversationId: null,
    publicKey: null,
    isInitiator: false,
  });

  const initiate = useCallback(
    async (conversationId: string) => {
      setIsExchanging(true);
      try {
        const keyExchangeData = await startKeyExchange(conversationId);
        setExchangeState({
          conversationId,
          publicKey: keyExchangeData.publicKey,
          isInitiator: true,
        });
        return keyExchangeData;
      } catch (err) {
        throw err;
      } finally {
        setIsExchanging(false);
      }
    },
    [startKeyExchange]
  );

  const respond = useCallback(
    async (conversationId: string, remotePublicKey: string) => {
      setIsExchanging(true);
      try {
        const myPublicKey = await getUserPublicKey();
        await completeKeyExchange(conversationId, remotePublicKey);
        
        setExchangeState({
          conversationId,
          publicKey: myPublicKey,
          isInitiator: false,
        });

        return myPublicKey;
      } catch (err) {
        throw err;
      } finally {
        setIsExchanging(false);
      }
    },
    [completeKeyExchange, getUserPublicKey]
  );

  const complete = useCallback(
    async (remotePublicKey: string) => {
      if (!exchangeState.conversationId) {
        throw new Error('No key exchange in progress');
      }

      setIsExchanging(true);
      try {
        await completeKeyExchange(exchangeState.conversationId, remotePublicKey);
        setExchangeState({
          conversationId: null,
          publicKey: null,
          isInitiator: false,
        });
      } catch (err) {
        throw err;
      } finally {
        setIsExchanging(false);
      }
    },
    [completeKeyExchange, exchangeState.conversationId]
  );

  const reset = useCallback(() => {
    setExchangeState({
      conversationId: null,
      publicKey: null,
      isInitiator: false,
    });
  }, []);

  return {
    initiate,
    respond,
    complete,
    reset,
    isExchanging,
    exchangeState,
    error,
  };
};

export const useCryptoErrors = () => {
  const { error } = useCryptoContext();
  const [errorHistory, setErrorHistory] = useState<CryptoError[]>([]);

  useEffect(() => {
    if (error) {
      setErrorHistory(prev => [...prev, error]);
    }
  }, [error]);

  const clearErrors = useCallback(() => {
    setErrorHistory([]);
  }, []);

  const getErrorsForConversation = useCallback(
    (conversationId: string) => {
      return errorHistory.filter(err => err.conversationId === conversationId);
    },
    [errorHistory]
  );

  return {
    currentError: error,
    errorHistory,
    clearErrors,
    getErrorsForConversation,
  };
};

export const useCryptoHealth = () => {
  const { performHealthCheck, isInitialized } = useCryptoContext();
  const [healthStatus, setHealthStatus] = useState<{
    isHealthy: boolean;
    issues: string[];
    conversationCount: number;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    if (!isInitialized) return;

    setIsChecking(true);
    try {
      const status = await performHealthCheck();
      setHealthStatus(status);
    } catch (error) {
      setHealthStatus({
        isHealthy: false,
        issues: ['Health check failed'],
        conversationCount: 0,
      });
    } finally {
      setIsChecking(false);
    }
  }, [performHealthCheck, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      checkHealth();
      const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isInitialized, checkHealth]);

  return {
    healthStatus,
    isChecking,
    checkHealth,
  };
};