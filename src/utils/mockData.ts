import type { Conversation, Message, User } from '../types';

export const mockUser: User = {
  id: '22e1de11-4c04-41d3-afa2-4d9703af0a4f',
  email: '12carta@gmail.com',
  name: 'Jaider Panqueva',
  avatar: undefined,
  isOnline: true
};

export const mockOtherUser: User = {
  id: 'other-user-id',
  email: 'other@example.com',
  name: 'María García',
  avatar: undefined,
  isOnline: true
};

export const mockUser2: User = {
  id: 'user-2-id',
  email: 'carlos@example.com',
  name: 'Carlos López',
  avatar: undefined,
  isOnline: false
};

export const mockUser3: User = {
  id: 'user-3-id',
  email: 'ana@example.com',
  name: 'Ana Martínez',
  avatar: undefined,
  isOnline: true
};

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participants: [mockUser, mockOtherUser],
    lastMessage: {
      id: 'msg-1',
      content: '¡Hola! ¿Cómo estás?',
      senderId: 'other-user-id',
      receiverId: mockUser.id,
      conversationId: 'conv-1',
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
      isRead: false
    },
    unreadCount: 2,
    updatedAt: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'conv-2',
    participants: [mockUser, mockUser2],
    lastMessage: {
      id: 'msg-10',
      content: 'Perfecto, nos vemos mañana',
      senderId: mockUser.id,
      receiverId: 'user-2-id',
      conversationId: 'conv-2',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      isRead: true
    },
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'conv-3',
    participants: [mockUser, mockUser3],
    lastMessage: {
      id: 'msg-20',
      content: '¿Ya viste el nuevo proyecto?',
      senderId: 'user-3-id',
      receiverId: mockUser.id,
      conversationId: 'conv-3',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      isRead: false
    },
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    content: '¡Hola Jaider! ¿Cómo has estado?',
    senderId: 'other-user-id',
    receiverId: mockUser.id,
    conversationId: 'conv-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    isRead: true
  },
  {
    id: 'msg-2',
    content: '¡Hola María! Todo bien por acá, trabajando en unos proyectos nuevos',
    senderId: mockUser.id,
    receiverId: 'other-user-id',
    conversationId: 'conv-1',
    timestamp: new Date(Date.now() - 3400000).toISOString(), // 56 min ago
    isRead: true
  },
  {
    id: 'msg-3',
    content: '¡Qué genial! Me encantaría saber más sobre esos proyectos',
    senderId: 'other-user-id',
    receiverId: mockUser.id,
    conversationId: 'conv-1',
    timestamp: new Date(Date.now() - 3000000).toISOString(), // 50 min ago
    isRead: true
  },
  {
    id: 'msg-4',
    content: 'Claro, estoy trabajando en una app de chat con React y TypeScript',
    senderId: mockUser.id,
    receiverId: 'other-user-id',
    conversationId: 'conv-1',
    timestamp: new Date(Date.now() - 2400000).toISOString(), // 40 min ago
    isRead: true
  },
  {
    id: 'msg-5',
    content: '¡Hola! ¿Cómo estás?',
    senderId: 'other-user-id',
    receiverId: mockUser.id,
    conversationId: 'conv-1',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    isRead: false
  }
];

// Función para obtener mensajes por conversación
export const getMessagesByConversationId = (conversationId: string): Message[] => {
  return mockMessages.filter(msg => msg.conversationId === conversationId);
};