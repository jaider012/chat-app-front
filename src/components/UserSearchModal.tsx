import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import type { UserSearchModalProps } from '../types';
import { useUserSearch } from '../hooks/useUserSearch';
import { useModalKeyHandler } from '../hooks/useModalKeyHandler';
import { getUserDisplayName } from '../utils/dataHelpers';

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
}) => {
  const {
    searchTerm,
    filteredUsers,
    isLoading,
    error,
    setSearchTerm,
    loadUsers,
    handleSelectUser
  } = useUserSearch({
    isEnabled: isOpen
  });

  const { handleKeyDown } = useModalKeyHandler({
    isOpen,
    onClose
  });

  const handleUserSelection = (user: any) => {
    handleSelectUser(user, (selectedUser) => {
      onSelectUser(selectedUser);
      onClose();
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="w-full h-full sm:w-auto sm:h-auto sm:max-w-md sm:mx-4 bg-white sm:rounded-lg p-6 shadow-xl animate-scale-up overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-header text-primary">Start a new conversation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
          >
            <X className="w-6 h-6 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent text-base"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto">
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
                  onClick={() => handleUserSelection(user)}
                  className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50 rounded-lg transition-colors touch-manipulation"
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
                    <p className="font-medium text-gray-900">{getUserDisplayName(user)}</p>
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