import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import type { UserSearchModalProps, User } from '../types';
import { apiService } from '../services/api';

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setSearchTerm('');
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
        setFilteredUsers(response.data);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      setError('Error loading users');
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-header text-primary">Start a new conversation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
            autoFocus
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
              <span className="ml-2 text-gray-500">Loading users...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-error">{error}</p>
              <button
                onClick={loadUsers}
                className="mt-2 text-sm text-secondary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'No users found matching your search' : 'No users available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 status-online ring-2 ring-white"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  {user.isOnline && (
                    <span className="text-xs text-secondary font-medium">Online</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;