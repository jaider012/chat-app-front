import React, { useState, useEffect } from 'react';
import { Search, Plus, MessageCircle, ArrowLeft, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import type { Conversation, Message } from '../types';
import { apiService } from '../services/api';
import { mockConversations, getMessagesByConversationId } from '../utils/mockData';
import { normalizeConversation, normalizeMessage } from '../utils/dataHelpers';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import ErrorBoundary from '../components/ErrorBoundary';
import UserSearchModal from '../components/UserSearchModal';
import ProfileModal from '../components/ProfileModal';
import ThemeToggle from '../components/ThemeToggle';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    if (selectedConversationId && isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [selectedConversationId, isMobile]);

  useEffect(() => {
    if (socket) {
      console.log('Setting up socket listeners');
      
      const wrappedHandleNewMessage = (message: Message) => {
        try {
          handleNewMessage(message);
        } catch (error) {
          console.error('Error in newMessage handler:', error);
        }
      };
      
      const wrappedHandleUserTyping = (data: { userId: string }) => {
        try {
          handleUserTyping(data);
        } catch (error) {
          console.error('Error in userTyping handler:', error);
        }
      };
      
      const wrappedHandleUserStoppedTyping = (data: { userId: string }) => {
        try {
          handleUserStoppedTyping(data);
        } catch (error) {
          console.error('Error in userStoppedTyping handler:', error);
        }
      };

      socket.on('newMessage', wrappedHandleNewMessage);
      socket.on('userTyping', wrappedHandleUserTyping);
      socket.on('userStoppedTyping', wrappedHandleUserStoppedTyping);

      return () => {
        socket.off('newMessage', wrappedHandleNewMessage);
        socket.off('userTyping', wrappedHandleUserTyping);
        socket.off('userStoppedTyping', wrappedHandleUserStoppedTyping);
      };
    }
  }, [socket, selectedConversationId]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  const loadConversations = async () => {
    try {
      console.log('Loading conversations...');
      const response = await apiService.getConversations();
      console.log('API response:', response);
      
      if (response.success && response.data) {
        console.log('Using real API data');
        const normalizedConversations = response.data.map(normalizeConversation);
        setConversations(normalizedConversations);
      } else {
        console.warn('API not available, using mock data');
        setConversations(mockConversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      console.warn('Using mock data instead');
      setConversations(mockConversations);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      console.log('Loading messages for conversation:', conversationId);
      const response = await apiService.getMessages(conversationId);
      console.log('Messages API response:', response);
      
      if (response.success && response.data) {
        // La API devuelve { items: [...], meta: {...} }
        const messagesData = response.data.items || response.data;
        const normalizedMessages = Array.isArray(messagesData) 
          ? messagesData.map(normalizeMessage)
          : [];
        
        // Ordenar mensajes por timestamp (más antiguo al inicio, más reciente al final)
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
  };

  const handleNewMessage = (message: Message) => {
    try {
      console.log('New message received:', message);
      const normalizedMessage = normalizeMessage(message);
      
      if (normalizedMessage.conversationId === selectedConversationId) {
        setMessages(prev => {
          const newMessages = [...prev, normalizedMessage];
          // Ordenar por timestamp (más reciente al final)
          return newMessages.sort((a, b) => {
            const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
            const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
            return timeA - timeB;
          });
        });
      }
      
      // Actualizar la lista de conversaciones
      setConversations(prev => 
        prev.map(conv => 
          conv.id === normalizedMessage.conversationId 
            ? { 
                ...conv, 
                lastMessage: normalizedMessage, 
                unreadCount: (conv.unreadCount || 0) + 1,
                updatedAt: normalizedMessage.timestamp || normalizedMessage.createdAt || new Date().toISOString()
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  };

  const handleUserTyping = (_data: { userId: string }) => {
    if (selectedConversationId) {
      setIsTyping(true);
    }
  };

  const handleUserStoppedTyping = (_data: { userId: string }) => {
    setIsTyping(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    console.log('Selecting conversation:', conversationId);
    try {
      setSelectedConversationId(conversationId);
      setMessages([]);
      setIsTyping(false);
    } catch (error) {
      console.error('Error selecting conversation:', error);
    }
  };

  const handleSendMessage = (content: string) => {
    try {
      console.log('Sending message:', { conversationId: selectedConversationId, content });
      
      if (!selectedConversationId) {
        console.error('No conversation selected');
        return;
      }
      
      if (!socket) {
        console.error('Socket not connected');
        return;
      }
      
      if (!socket.connected) {
        console.error('Socket not connected');
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

  const handleCreateConversation = async (participantId: string) => {
    try {
      const response = await apiService.createConversation(participantId);
      if (response.success && response.data) {
        const normalizedConversation = normalizeConversation(response.data);
        setConversations(prev => [normalizedConversation, ...prev]);
        setSelectedConversationId(normalizedConversation.id);
        setIsUserSearchOpen(false);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants.find(p => p.id !== user?.id);
    return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase());
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
    <div className="h-screen bg-background-light dark:bg-gray-900 flex relative">
      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out' : 'w-1/3 lg:w-1/4 xl:w-1/3'}
        ${isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-header text-primary dark:text-gray-100">Messages</h1>
            <div className="flex items-center space-x-2">
              {/* Mobile Close Button */}
              {isMobile && (
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title="Close menu"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              )}
              <ThemeToggle size="sm" className="text-gray-600 dark:text-gray-300" />
              <button
                onClick={() => setIsUserSearchOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedConversation ? (
          <ErrorBoundary>
            {/* Mobile Header */}
            {isMobile && (
              <div className="flex items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors mr-3"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-medium text-sm">
                      {selectedConversation.participants.find(p => p.id !== user?.id)?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    {selectedConversation.participants.find(p => p.id !== user?.id)?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full ring-1 ring-white"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {selectedConversation.participants.find(p => p.id !== user?.id)?.name || 'Unknown User'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedConversation.participants.find(p => p.id !== user?.id)?.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
          <div className="flex-1 flex flex-col">
            {/* Mobile Header for Empty State */}
            {isMobile && (
              <div className="flex items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors mr-3"
                >
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100">Messages</h1>
              </div>
            )}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <MessageCircle className="w-16 sm:w-24 h-16 sm:h-24 text-gray-300 mb-4 mx-auto" />
                <h3 className="text-lg sm:text-xl font-medium text-gray-500 mb-2">Select a conversation</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  {isMobile ? 'Tap the menu to see your conversations' : 'Choose a conversation from the sidebar to start messaging'}
                </p>
                {isMobile && (
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="btn-secondary text-sm"
                  >
                    View Conversations
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <UserSearchModal
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
        onSelectUser={(user) => handleCreateConversation(user.id)}
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