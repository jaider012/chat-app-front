import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SocketContextType } from '../types';
import { useAuth } from './AuthContext';
import { useCryptoContext } from './CryptoContext';
import { type EncryptedMessage, EncryptionStatus } from '../crypto/types';
import { API_BASE_URL } from '../services/api';

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const crypto = useCryptoContext();

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io(API_BASE_URL, {
        auth: {
          token,
        },
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Connected to socket server');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Disconnected from socket server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Handle incoming encrypted messages
      newSocket.on('encryptedMessage', async (data: EncryptedMessage) => {
        try {
          if (crypto.isInitialized) {
            const decryptedContent = await crypto.decryptMessage(data);
            // Emit the decrypted message to the application
            newSocket.emit('messageDecrypted', {
              ...data,
              content: decryptedContent,
              isEncrypted: true,
            });
          }
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          // Still emit the message but mark it as failed to decrypt
          newSocket.emit('messageDecryptionFailed', {
            ...data,
            error: 'Failed to decrypt message',
          });
        }
      });

      // Handle key exchange requests
      newSocket.on('keyExchangeRequest', async (data: { conversationId: string; publicKey: string; sender: string }) => {
        try {
          if (crypto.isInitialized) {
            await crypto.completeKeyExchange(data.conversationId, data.publicKey);
            const myPublicKey = await crypto.getUserPublicKey();
            newSocket.emit('keyExchangeResponse', {
              conversationId: data.conversationId,
              publicKey: myPublicKey,
              recipient: data.sender,
            });
          }
        } catch (error) {
          console.error('Failed to handle key exchange request:', error);
        }
      });

      // Handle key exchange responses
      newSocket.on('keyExchangeResponse', async (data: { conversationId: string; publicKey: string }) => {
        try {
          if (crypto.isInitialized) {
            await crypto.completeKeyExchange(data.conversationId, data.publicKey);
          }
        } catch (error) {
          console.error('Failed to handle key exchange response:', error);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [isAuthenticated, token]);

  const sendMessage = async (conversationId: string, content: string, useEncryption: boolean = true) => {
    if (!socket || !isConnected) return;

    try {
      if (useEncryption && crypto.isInitialized && crypto.getEncryptionStatus(conversationId) === EncryptionStatus.ACTIVE) {
        // Send encrypted message
        const encryptedMessage = await crypto.encryptMessage(content, conversationId);
        socket.emit('sendEncryptedMessage', encryptedMessage);
      } else {
        // Send plain message
        socket.emit('sendMessage', { conversationId, content });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Fallback to plain message
      socket.emit('sendMessage', { conversationId, content });
    }
  };

  const initiateKeyExchange = async (conversationId: string) => {
    if (!socket || !isConnected || !crypto.isInitialized) return;

    try {
      const keyExchangeData = await crypto.startKeyExchange(conversationId);
      socket.emit('keyExchangeRequest', keyExchangeData);
    } catch (error) {
      console.error('Failed to initiate key exchange:', error);
    }
  };

  const startTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('startTyping', { conversationId });
    }
  };

  const stopTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('stopTyping', { conversationId });
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    initiateKeyExchange,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};