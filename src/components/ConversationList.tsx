import React from 'react';
import type { ConversationListProps, Conversation, User } from '../types';
import { getUserDisplayName, formatMessageTime } from '../utils/dataHelpers';
import { useConversationParticipants } from '../hooks/useConversationParticipants';

interface ConversationItemProps {
  conversation: Conversation;
  currentUser: User;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUser,
  isSelected,
  onSelect
}) => {
  const { otherParticipant } = useConversationParticipants({ conversation, currentUser });

  return (
    <div
      key={conversation.id}
      onClick={() => onSelect(conversation.id)}
      className={`conversation-item ${isSelected ? 'conversation-item-selected' : ''}`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center font-medium text-sm sm:text-base">
            {getUserDisplayName(otherParticipant)[0]?.toUpperCase() || 'U'}
          </div>
          {otherParticipant?.isOnline && (
            <div className="absolute bottom-0 right-0 status-online ring-2 ring-white"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base">
              {getUserDisplayName(otherParticipant)}
            </h3>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {conversation.lastMessage && conversation.lastMessage.timestamp && (
                <span className="text-xs text-gray-500">
                  {formatMessageTime(conversation.lastMessage.timestamp)}
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
            <p className="text-xs sm:text-sm text-gray-500 truncate break-words overflow-hidden">
              {conversation.lastMessage.senderId === currentUser.id ? 'You: ' : ''}
              {conversation.lastMessage.content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUser,
}) => {
  return (
    <div className="divide-y divide-gray-100 h-full overflow-y-auto">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          currentUser={currentUser}
          isSelected={conversation.id === selectedConversationId}
          onSelect={onSelectConversation}
        />
      ))}
    </div>
  );
};

export default ConversationList;