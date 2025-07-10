import type { User, Message, Conversation } from '../types';

export const normalizeUser = (user: any): User => {
  return {
    id: user.id,
    email: user.email,
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    firstName: user.firstName,
    lastName: user.lastName,
    profilePicture: user.profilePicture,
    avatar: user.avatar || user.profilePicture,
    isOnline: user.isOnline || false,
    createdAt: user.createdAt
  };
};

export const normalizeMessage = (message: any): Message => {
  return {
    id: message.id,
    content: message.content,
    senderId: message.senderId || message.sender?.id,
    receiverId: message.receiverId,
    conversationId: message.conversationId,
    timestamp: message.timestamp || message.createdAt,
    isRead: message.isRead || false,
    sender: message.sender ? normalizeUser(message.sender) : undefined,
    createdAt: message.createdAt
  };
};

export const normalizeConversation = (conversation: any): Conversation => {
  return {
    id: conversation.id,
    name: conversation.name,
    participants: conversation.participants?.map(normalizeUser) || [],
    lastMessage: conversation.lastMessage ? normalizeMessage(conversation.lastMessage) : undefined,
    unreadCount: conversation.unreadCount || 0,
    updatedAt: conversation.updatedAt || conversation.createdAt,
    createdAt: conversation.createdAt
  };
};

export const getUserDisplayName = (user: User | undefined): string => {
  if (!user) return 'Unknown User';
  if (user.name) return user.name;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.email) return user.email.split('@')[0];
  return 'Unknown User';
};

export const getUserAvatar = (user: User): string | undefined => {
  return user.avatar || user.profilePicture;
};

export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();

  // Convert to local timezone
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

  const diffInMinutes = Math.floor((now.getTime() - localDate.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} d ago`;

  return localDate.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
