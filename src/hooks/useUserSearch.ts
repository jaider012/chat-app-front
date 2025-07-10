import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '../types';
import { apiService } from '../services/api';
import { filterUsers } from '../utils/searchHelpers';

interface UseUserSearchProps {
  isEnabled?: boolean;
  initialUsers?: User[];
}

/**
 * Custom hook for user search functionality
 */
export const useUserSearch = ({
  isEnabled = true,
  initialUsers = []
}: UseUserSearchProps = {}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    return filterUsers(users, searchTerm);
  }, [users, searchTerm]);

  // Load users from API
  const loadUsers = useCallback(async () => {
    if (!isEnabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading users';
      setError(errorMessage);
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  // Handle user selection
  const handleSelectUser = useCallback((
    user: User,
    onSelect?: (user: User) => void
  ) => {
    if (onSelect) {
      onSelect(user);
    }
    // Reset search after selection
    setSearchTerm('');
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setError(null);
  }, []);

  // Reset hook state
  const resetSearch = useCallback(() => {
    setSearchTerm('');
    setUsers(initialUsers);
    setError(null);
    setIsLoading(false);
  }, [initialUsers]);

  // Auto-load users when enabled
  useEffect(() => {
    if (isEnabled && users.length === 0) {
      loadUsers();
    }
  }, [isEnabled, users.length, loadUsers]);

  return {
    // State
    searchTerm,
    users,
    filteredUsers,
    isLoading,
    error,
    
    // Actions
    setSearchTerm,
    loadUsers,
    handleSelectUser,
    clearSearch,
    resetSearch,
    
    // Computed
    hasResults: filteredUsers.length > 0,
    hasUsers: users.length > 0,
    isEmpty: !isLoading && users.length === 0,
    isSearching: searchTerm.trim().length > 0
  };
};