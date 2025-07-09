import React, { useState, useEffect } from 'react';
import { Search, Plus, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import type { Conversation, Message } from '../types';
import { apiService } from '../services/api';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';

import UserSearchModal from '../components/UserSearchModal';
import ProfileModal from '../components/ProfileModal';

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

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('newMessage', handleNewMessage);
      socket.on('userTyping', handleUserTyping);
      socket.on('userStoppedTyping', handleUserStoppedTyping);

      return () => {
        socket.off('newMessage', handleNewMessage);
        socket.off('userTyping', handleUserTyping);
        socket.off('userStoppedTyping', handleUserStoppedTyping);
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
      const response = await apiService.getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      console.log('Loading messages for conversation:', conversationId);
      const response = await apiService.getMessages(conversationId);
      console.log('Messages response:', response);
      if (response.success && response.data) {
        setMessages(response.data);
      } else {
        console.error('Failed to load messages:', response.message);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleNewMessage = (message: Message) => {
    if (message.conversationId === selectedConversationId) {
      setMessages(prev => [...prev, message]);
    }
    
    setConversations(prev => 
      prev.map(conv => 
        conv.id === message.conversationId 
          ? { ...conv, lastMessage: message, unreadCount: conv.unreadCount + 1 }
          : conv
      )
    );
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
    if (selectedConversationId && socket) {
      socket.emit('sendMessage', { conversationId: selectedConversationId, content });
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
        setConversations(prev => [response.data, ...prev]);
        setSelectedConversationId(response.data.id);
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
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            onSendMessage={handleSendMessage}
            onStartTyping={handleStartTyping}
            onStopTyping={handleStopTyping}
            isTyping={isTyping}
            currentUser={user!}
          />
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