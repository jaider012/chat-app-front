import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { CryptoManager } from "../crypto/CryptoManager";
import {
  type CryptoContextValue,
  type UserKeyPair,
  type ConversationCryptoState,
  type EncryptedMessage,
  type CryptoError,
  EncryptionStatus,
} from "../crypto/types";
interface CryptoProviderProps {
  children: ReactNode;
}

const CryptoContext = createContext<CryptoContextValue | null>(null);

export const useCryptoContext = () => {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error("useCryptoContext must be used within a CryptoProvider");
  }
  return context;
};

export const CryptoProvider: React.FC<CryptoProviderProps> = ({ children }) => {
  const [cryptoManager] = useState(() => new CryptoManager());
  const [isInitialized, setIsInitialized] = useState(false);
  const [userKeys, setUserKeys] = useState<UserKeyPair | null>(null);
  const [conversationKeys, setConversationKeys] = useState<
    Map<string, ConversationCryptoState>
  >(new Map());
  const [encryptionStatus, setEncryptionStatus] = useState<
    Map<string, EncryptionStatus>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CryptoError | null>(null);

  const initializeCrypto = useCallback(async () => {
    if (isInitialized) return;

    setIsLoading(true);
    setError(null);

    try {
      await cryptoManager.initialize();
      const keys = await cryptoManager.generateUserKeys();
      setUserKeys(keys);
      setIsInitialized(true);
    } catch (err) {
      const cryptoError: CryptoError = {
        code: "INIT_ERROR",
        message:
          err instanceof Error ? err.message : "Failed to initialize crypto",
      };
      setError(cryptoError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cryptoManager, isInitialized]);

  const startKeyExchange = useCallback(
    async (conversationId: string) => {
      if (!isInitialized) {
        throw new Error("Crypto not initialized");
      }

      try {
        setError(null);
        const keyExchangeData = await cryptoManager.startKeyExchange(
          conversationId
        );

        // Update status
        setEncryptionStatus((prev) =>
          new Map(prev).set(
            conversationId,
            EncryptionStatus.KEY_EXCHANGE_PENDING
          )
        );

        return keyExchangeData;
      } catch (err) {
        const cryptoError: CryptoError = {
          code: "KEY_EXCHANGE_START_ERROR",
          message:
            err instanceof Error ? err.message : "Failed to start key exchange",
          conversationId,
        };
        setError(cryptoError);
        throw err;
      }
    },
    [cryptoManager, isInitialized]
  );

  const completeKeyExchange = useCallback(
    async (conversationId: string, publicKey: string) => {
      if (!isInitialized) {
        throw new Error("Crypto not initialized");
      }

      try {
        setError(null);
        await cryptoManager.completeKeyExchange(conversationId, publicKey);

        // Update local state
        const state = cryptoManager.getConversationState(conversationId);
        if (state) {
          setConversationKeys((prev) =>
            new Map(prev).set(conversationId, state)
          );
        }

        setEncryptionStatus((prev) =>
          new Map(prev).set(conversationId, EncryptionStatus.ACTIVE)
        );
      } catch (err) {
        const cryptoError: CryptoError = {
          code: "KEY_EXCHANGE_COMPLETE_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Failed to complete key exchange",
          conversationId,
        };
        setError(cryptoError);
        setEncryptionStatus((prev) =>
          new Map(prev).set(conversationId, EncryptionStatus.ERROR)
        );
        throw err;
      }
    },
    [cryptoManager, isInitialized]
  );

  const encryptMessage = useCallback(
    async (
      message: string,
      conversationId: string,
      sender: string = "current-user"
    ): Promise<EncryptedMessage> => {
      if (!isInitialized) {
        throw new Error("Crypto not initialized");
      }

      try {
        setError(null);
        return await cryptoManager.encryptMessage(
          message,
          conversationId,
          sender
        );
      } catch (err) {
        const cryptoError: CryptoError = {
          code: "ENCRYPT_ERROR",
          message:
            err instanceof Error ? err.message : "Failed to encrypt message",
          conversationId,
        };
        setError(cryptoError);
        throw err;
      }
    },
    [cryptoManager, isInitialized]
  );

  const decryptMessage = useCallback(
    async (encryptedMessage: EncryptedMessage): Promise<string> => {
      if (!isInitialized) {
        throw new Error("Crypto not initialized");
      }

      try {
        setError(null);
        return await cryptoManager.decryptMessage(encryptedMessage);
      } catch (err) {
        const cryptoError: CryptoError = {
          code: "DECRYPT_ERROR",
          message:
            err instanceof Error ? err.message : "Failed to decrypt message",
          conversationId: encryptedMessage.conversationId,
        };
        setError(cryptoError);
        throw err;
      }
    },
    [cryptoManager, isInitialized]
  );

  const getEncryptionStatus = useCallback(
    (conversationId: string): EncryptionStatus => {
      return (
        encryptionStatus.get(conversationId) || EncryptionStatus.NOT_INITIALIZED
      );
    },
    [encryptionStatus]
  );

  const clearConversationKeys = useCallback(
    (conversationId: string) => {
      cryptoManager.clearConversationKeys(conversationId);
      setConversationKeys((prev) => {
        const newMap = new Map(prev);
        newMap.delete(conversationId);
        return newMap;
      });
      setEncryptionStatus((prev) => {
        const newMap = new Map(prev);
        newMap.delete(conversationId);
        return newMap;
      });
      setError(null);
    },
    [cryptoManager]
  );

  const isConversationSecure = useCallback(
    (conversationId: string): boolean => {
      return cryptoManager.isConversationSecure(conversationId);
    },
    [cryptoManager]
  );

  const getUserPublicKey = useCallback(async (): Promise<string> => {
    if (!isInitialized) {
      throw new Error("Crypto not initialized");
    }
    return await cryptoManager.getUserPublicKey();
  }, [cryptoManager, isInitialized]);

  const clearAllData = useCallback(async () => {
    try {
      await cryptoManager.clearAllData();
      setConversationKeys(new Map());
      setEncryptionStatus(new Map());
      setUserKeys(null);
      setIsInitialized(false);
      setError(null);
    } catch (err) {
      const cryptoError: CryptoError = {
        code: "CLEAR_ALL_ERROR",
        message:
          err instanceof Error ? err.message : "Failed to clear all data",
      };
      setError(cryptoError);
      throw err;
    }
  }, [cryptoManager]);

  const performHealthCheck = useCallback(async () => {
    return await cryptoManager.performHealthCheck();
  }, [cryptoManager]);

  // Set up event listeners for crypto manager
  useEffect(() => {
    const handleStatusChange = ({
      conversationId,
      status,
    }: {
      conversationId: string;
      status: EncryptionStatus;
    }) => {
      setEncryptionStatus((prev) => new Map(prev).set(conversationId, status));
    };

    const handleKeyExchangeCompleted = ({
      conversationId,
    }: {
      conversationId: string;
    }) => {
      const state = cryptoManager.getConversationState(conversationId);
      if (state) {
        setConversationKeys((prev) => new Map(prev).set(conversationId, state));
      }
    };

    const handleError = (error: CryptoError) => {
      setError(error);
    };

    const handleConversationCleared = ({
      conversationId,
    }: {
      conversationId: string;
    }) => {
      setConversationKeys((prev) => {
        const newMap = new Map(prev);
        newMap.delete(conversationId);
        return newMap;
      });
      setEncryptionStatus((prev) => {
        const newMap = new Map(prev);
        newMap.delete(conversationId);
        return newMap;
      });
    };

    cryptoManager.on("statusChanged", handleStatusChange);
    cryptoManager.on("keyExchangeCompleted", handleKeyExchangeCompleted);
    cryptoManager.on("error", handleError);
    cryptoManager.on("conversationCleared", handleConversationCleared);

    return () => {
      cryptoManager.off("statusChanged", handleStatusChange);
      cryptoManager.off("keyExchangeCompleted", handleKeyExchangeCompleted);
      cryptoManager.off("error", handleError);
      cryptoManager.off("conversationCleared", handleConversationCleared);
    };
  }, [cryptoManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cryptoManager.destroy();
    };
  }, [cryptoManager]);

  const contextValue: CryptoContextValue = {
    isInitialized,
    userKeys,
    conversationKeys,
    encryptionStatus,
    initializeCrypto,
    startKeyExchange,
    completeKeyExchange,
    encryptMessage,
    decryptMessage,
    getEncryptionStatus,
    clearConversationKeys,
    isConversationSecure,
    getUserPublicKey,
    clearAllData,
    performHealthCheck,
    isLoading,
    error,
  };

  return (
    <CryptoContext.Provider value={contextValue}>
      {children}
    </CryptoContext.Provider>
  );
};

// Additional utility hooks
export const useEncryptionStatus = (conversationId: string) => {
  const { getEncryptionStatus } = useCryptoContext();
  return getEncryptionStatus(conversationId);
};

export const useIsConversationSecure = (conversationId: string) => {
  const { isConversationSecure } = useCryptoContext();
  return isConversationSecure(conversationId);
};

export const useCryptoHealth = () => {
  const { performHealthCheck } = useCryptoContext();
  const [healthStatus, setHealthStatus] = useState<{
    isHealthy: boolean;
    issues: string[];
    conversationCount: number;
  } | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await performHealthCheck();
        setHealthStatus(status);
      } catch {
        setHealthStatus({
          isHealthy: false,
          issues: ["Health check failed"],
          conversationCount: 0,
        });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [performHealthCheck]);

  return healthStatus;
};
