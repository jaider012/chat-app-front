import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SocketContextType } from '../types';
import { useAuth } from './AuthContext';

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

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io('http://localhost:3006', {
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

  const sendMessage = (conversationId: string, content: string) => {
    if (socket && isConnected) {
      console.log('SocketContext: Emitting sendMessage', { conversationId, content });
      socket.emit('sendMessage', { conversationId, content });
    } else {
      console.error('SocketContext: Cannot send message - socket not connected', { socket: !!socket, isConnected });
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
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};