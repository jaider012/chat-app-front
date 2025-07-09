import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import type { Conversation, Message, User } from '../types';
import { apiService } from '../services/api';
import { mockConversations, getMessagesByConversationId } from '../utils/mockData';
import { normalizeConversation, normalizeMessage } from '../utils/dataHelpers';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import ErrorBoundary from '../components/ErrorBoundary';
import UserSearchModal from '../components/UserSearchModal';
import ProfileModal from '../components/ProfileModal';

const sortConversations = (convs: Conversation[]): Conversation[] => {
  return [...convs].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });
};

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      console.log('Loading conversations...');
      const response = await apiService.getConversations();
      console.log('API response:', response);
      
      if (response.success && response.data) {
        console.log('Using real API data');
        const normalizedConversations = response.data.map(normalizeConversation);
        setConversations(sortConversations(normalizedConversations));
      } else {
        console.warn('API not available, using mock data');
        setConversations(sortConversations(mockConversations));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      console.warn('Using mock data instead');
      setConversations(sortConversations(mockConversations));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleNewMessage = useCallback((message: Message) => {
    try {
      console.log('New message received:', message);
      const normalizedMessage = normalizeMessage(message);
      const isOwnMessage = (normalizedMessage.senderId || normalizedMessage.sender?.id) === user?.id;

      if (normalizedMessage.conversationId === selectedConversationId) {
        setMessages(prev => {
          const newMessages = [...prev.filter(m => m.id !== normalizedMessage.id), normalizedMessage];
          return newMessages.sort((a, b) => {
            const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
            const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
            return timeA - timeB;
          });
        });
      }
      
      setConversations(prev => {
        const convIndex = prev.findIndex(c => c.id === normalizedMessage.conversationId);
        if (convIndex === -1) return prev;

        const convToUpdate = prev[convIndex];
        const isChatting = selectedConversationId === normalizedMessage.conversationId;
        
        const updatedConv = { 
          ...convToUpdate, 
          lastMessage: normalizedMessage, 
          unreadCount: !isChatting && !isOwnMessage ? (convToUpdate.unreadCount || 0) + 1 : convToUpdate.unreadCount,
          updatedAt: normalizedMessage.timestamp || normalizedMessage.createdAt || new Date().toISOString()
        };

        const otherConvs = prev.filter(c => c.id !== normalizedMessage.conversationId);
        return sortConversations([updatedConv, ...otherConvs]);
      });
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  }, [selectedConversationId, user]);

  const handleUserTyping = useCallback(() => {
    if (selectedConversationId) {
      setIsTyping(true);
    }
  }, [selectedConversationId]);

  const handleUserStoppedTyping = useCallback(() => {
    setIsTyping(false);
  }, []);

  const handleNewConversation = useCallback((conversation: Conversation) => {
    console.log('New conversation received via socket:', conversation);
    const newConversation = normalizeConversation(conversation);
    setConversations(prev => {
      if (prev.some(c => c.id === newConversation.id)) {
        return prev;
      }
      return sortConversations([newConversation, ...prev]);
    });
  }, []);

  useEffect(() => {
    if (socket) {
      console.log('Setting up socket listeners');
      
      socket.on('newMessage', handleNewMessage);
      socket.on('userTyping', handleUserTyping);
      socket.on('userStoppedTyping', handleUserStoppedTyping);
      socket.on('newConversation', handleNewConversation);

      return () => {
        socket.off('newMessage', handleNewMessage);
        socket.off('userTyping', handleUserTyping);
        socket.off('userStoppedTyping', handleUserStoppedTyping);
        socket.off('newConversation', handleNewConversation);
      };
    }
  }, [socket, handleNewMessage, handleUserTyping, handleUserStoppedTyping, handleNewConversation]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      console.log('Loading messages for conversation:', conversationId);
      const response = await apiService.getMessages(conversationId);
      console.log('Messages API response:', response);
      
      if (response.success && response.data) {
        const messagesData = response.data.items || response.data;
        const normalizedMessages = Array.isArray(messagesData) 
          ? messagesData.map(normalizeMessage)
          : [];
        
        const sortedMessages = normalizedMessages.sort((a, b) => {
          const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
          const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
          return timeA - timeB;
        });
        
        console.log('Using real API messages:', sortedMessages);
        setMessages(sortedMessages);
      } else {
        console.warn('API not available for messages, using mock data');
        const conversationMessages = getMessagesByConversationId(conversationId);
        setMessages(conversationMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      console.warn('Using mock messages instead');
      const conversationMessages = getMessagesByConversationId(conversationId);
      setMessages(conversationMessages);
    }
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId, loadMessages]);

  const handleSelectConversation = (conversationId: string) => {
    console.log('Selecting conversation:', conversationId);
    try {
      if (selectedConversationId === conversationId) return;
      
      setSelectedConversationId(conversationId);
      setIsTyping(false);
      
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
      );
    } catch (error) {
      console.error('Error selecting conversation:', error);
    }
  };

  const handleSendMessage = (content: string) => {
    try {
      console.log('Sending message:', { conversationId: selectedConversationId, content });
      
      if (!selectedConversationId || !socket || !socket.connected) {
        console.error('Cannot send message - no conversation selected or socket not connected');
        return;
      }
      
      socket.emit('sendMessage', { 
        conversationId: selectedConversationId, 
        content: content.trim()
      });
      
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleStartTyping = () => {
    if (selectedConversationId && socket) {
      socket.emit('startTyping', { conversationId: selectedConversationId });
    }
  };

  const handleStopTyping = () => {
    if (selectedConversationId && socket) {
      socket.emit('stopTyping', { conversationId: selectedConversationId });
    }
  };

  const handleCreateConversation = async (selectedUser: User) => {
    try {
      const existingConv = conversations.find(c => 
        c.participants.length === 2 &&
        c.participants.some(p => p.id === selectedUser.id) &&
        c.participants.some(p => p.id === user?.id)
      );

      if (existingConv) {
        setSelectedConversationId(existingConv.id);
        setIsUserSearchOpen(false);
        return;
      }

      const response = await apiService.createConversation(selectedUser.id);
      if (response.success && response.data) {
        const newConversation = normalizeConversation(response.data);
        setConversations(prev => {
          const otherConvs = prev.filter(c => c.id !== newConversation.id);
          return sortConversations([newConversation, ...otherConvs]);
        });
        setSelectedConversationId(newConversation.id);
        setIsUserSearchOpen(false);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants.find(p => p.id !== user?.id);
    return otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);
  
  console.log('Dashboard render state:', {
    selectedConversationId,
    selectedConversation,
    conversations,
    messages,
    user,
    conversationsLength: conversations.length
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-text-secondary-light">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light flex">
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-header text-primary">Messages</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsUserSearchOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Start new conversation"
              >
                <Plus className="w-5 h-5 text-secondary" />
              </button>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center"
                title="Profile"
              >
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No conversations yet</h3>
              <p className="text-gray-500 mb-4">Start a new conversation to begin chatting</p>
              <button
                onClick={() => setIsUserSearchOpen(true)}
                className="btn-secondary"
              >
                Start Chatting
              </button>
            </div>
          ) : (
            <ConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId || undefined}
              onSelectConversation={handleSelectConversation}
              currentUser={user!}
            />
          )}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ErrorBoundary>
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              onStartTyping={handleStartTyping}
              onStopTyping={handleStopTyping}
              isTyping={isTyping}
              currentUser={user!}
            />
          </ErrorBoundary>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-24 h-24 text-gray-300 mb-4 mx-auto" />
              <h3 className="text-xl font-medium text-gray-500 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
      
      <UserSearchModal
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
        onSelectUser={(user) => handleCreateConversation(user)}
      />
      
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user!}
        onLogout={logout}
      />
    </div>
  );
};

export default DashboardPage;
