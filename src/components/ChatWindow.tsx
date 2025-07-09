import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { ChatWindowProps } from '../types';
import { formatDistanceToNow } from 'date-fns';

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  onSendMessage,
  onStartTyping,
  onStopTyping,
  isTyping,
  currentUser,
}) => {
  console.log('ChatWindow rendered with:', { conversation, messages, currentUser });
  const [messageInput, setMessageInput] = useState('');
  const [, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const otherParticipant = conversation?.participants?.find(p => p.id !== currentUser?.id);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
    }
  }, [isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && onSendMessage) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
      handleStopTyping();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    
    if (e.target.value.trim() && onStartTyping) {
      onStartTyping();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 1000);
    } else if (!e.target.value.trim()) {
      handleStopTyping();
    }
  };

  const handleStopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (onStopTyping) {
      onStopTyping();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
              {otherParticipant?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {otherParticipant?.isOnline && (
              <div className="absolute bottom-0 right-0 status-online ring-2 ring-white"></div>
            )}
          </div>
          <div>
            <h2 className="font-medium text-gray-900">{otherParticipant?.name || 'Unknown User'}</h2>
            <p className="text-sm text-gray-500">
              {otherParticipant?.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUser.id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div className="max-w-xs lg:max-w-md">
                <div
                  className={`${
                    isOwnMessage ? 'chat-bubble-sent' : 'chat-bubble-received'
                  } rounded-2xl px-4 py-2 break-words`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                  {message.timestamp ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true }) : 'Just now'}
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex justify-start animate-slide-up">
            <div className="max-w-xs lg:max-w-md">
              <div className="chat-bubble-received rounded-2xl px-4 py-2">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                setIsInputFocused(false);
                handleStopTyping();
              }}
              placeholder="Type a message..."
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent max-h-32"
              rows={1}
              style={{ minHeight: '44px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className={`p-3 rounded-lg transition-colors ${
              messageInput.trim()
                ? 'bg-secondary text-white hover:bg-secondary/90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;