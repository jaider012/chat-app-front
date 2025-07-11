import { useMemo } from 'react';
import type { User, Conversation } from '../types';

interface UseConversationParticipantsProps {
  conversation?: Conversation;
  currentUser?: User;
}

/**
 * Custom hook for getting conversation participants
 */
export const useConversationParticipants = ({
  conversation,
  currentUser
}: UseConversationParticipantsProps) => {

  const otherParticipant = useMemo(() => {
    if (!conversation?.participants || !currentUser) {
      return undefined;
    }

    return conversation.participants.find(p => p.id !== currentUser.id);
  }, [conversation?.participants, currentUser]);

  const allParticipants = useMemo(() => {
    return conversation?.participants || [];
  }, [conversation?.participants]);

  const participantCount = useMemo(() => {
    return allParticipants.length;
  }, [allParticipants]);

  const otherParticipants = useMemo(() => {
    if (!currentUser) {
      return allParticipants;
    }

    return allParticipants.filter(p => p.id !== currentUser.id);
  }, [allParticipants, currentUser]);

  const isGroupConversation = useMemo(() => {
    return participantCount > 2;
  }, [participantCount]);

  const participantNames = useMemo(() => {
    return otherParticipants.map(p => p.name || p.email.split('@')[0]).join(', ');
  }, [otherParticipants]);

  return {
    otherParticipant,
    allParticipants,
    otherParticipants,
    participantCount,
    isGroupConversation,
    participantNames
  };
};