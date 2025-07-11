import { Socket } from 'socket.io-client';

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  avatar?: string;
  isOnline?: boolean;
  createdAt?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId?: string;
  receiverId?: string;
  conversationId?: string;
  timestamp?: string;
  isRead?: boolean;
  sender?: User;
  createdAt?: string;
}

export interface Conversation {
  id: string;
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (conversationId: string, content: string, useEncryption?: boolean) => Promise<void>;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  initiateKeyExchange: (conversationId: string) => Promise<void>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  currentUser: User;
}

export interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  isTyping: boolean;
  currentUser: User;
}

export interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
}