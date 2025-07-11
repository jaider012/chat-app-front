import type { User, Conversation } from '../types';

/**
 * Filters users based on search term matching name or email
 */
export const filterUsers = (users: User[], searchTerm: string): User[] => {
  if (!searchTerm.trim()) {
    return users;
  }

  const lowercaseSearch = searchTerm.toLowerCase();
  
  return users.filter(user => {
    const name = user.name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const firstName = user.firstName?.toLowerCase() || '';
    const lastName = user.lastName?.toLowerCase() || '';
    
    return (
      name.includes(lowercaseSearch) ||
      email.includes(lowercaseSearch) ||
      firstName.includes(lowercaseSearch) ||
      lastName.includes(lowercaseSearch)
    );
  });
};

/**
 * Filters conversations based on participant names
 */
export const filterConversations = (
  conversations: Conversation[],
  searchTerm: string,
  currentUserId: string
): Conversation[] => {
  if (!searchTerm.trim()) {
    return conversations;
  }

  const lowercaseSearch = searchTerm.toLowerCase();
  
  return conversations.filter(conv => {
    const otherParticipant = conv.participants.find(p => p.id !== currentUserId);
    const name = otherParticipant?.name?.toLowerCase() || '';
    const email = otherParticipant?.email?.toLowerCase() || '';
    
    return name.includes(lowercaseSearch) || email.includes(lowercaseSearch);
  });
};

/**
 * Highlights search term in text
 */
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) {
    return text;
  }

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

/**
 * Normalizes search term for better matching
 */
export const normalizeSearchTerm = (term: string): string => {
  return term.trim().toLowerCase().replace(/\s+/g, ' ');
};