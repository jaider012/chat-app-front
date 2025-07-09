import React from 'react';
import type { ConversationListProps } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { getUserDisplayName } from '../utils/dataHelpers';

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUser,
}) => {
  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conversation) => {
        const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
        const isSelected = conversation.id === selectedConversationId;
        
        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`conversation-item ${isSelected ? 'conversation-item-selected' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                  {getUserDisplayName(otherParticipant)[0]?.toUpperCase() || 'U'}
                </div>
                {otherParticipant?.isOnline && (
                  <div className="absolute bottom-0 right-0 status-online ring-2 ring-white"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {getUserDisplayName(otherParticipant)}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: true })}
                      </span>
                    )}
                    {(conversation.unreadCount || 0) > 0 && (
                      <span className="unread-counter animate-pulse-accent">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                
                {conversation.lastMessage && (
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage.senderId === currentUser.id ? 'You: ' : ''}
                    {conversation.lastMessage.content}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;