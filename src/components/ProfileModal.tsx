import React from 'react';
import { X, LogOut, User as UserIcon, Palette } from 'lucide-react';
import type { ProfileModalProps } from '../types';
import ThemeToggle from './ThemeToggle';
import { useModalKeyHandler } from '../hooks/useModalKeyHandler';
import { useLogout } from '../hooks/useLogout';

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
}) => {
  const { handleLogout } = useLogout({
    onLogout: () => {
      onLogout();
      onClose();
    }
  });

  const { handleKeyDown } = useModalKeyHandler({
    isOpen,
    onClose
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="w-full h-full sm:w-auto sm:h-auto sm:max-w-md sm:mx-4 bg-white sm:rounded-lg p-6 shadow-xl animate-scale-up overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-header text-primary">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
          >
            <X className="w-6 h-6 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">{user?.name}</h3>
          <p className="text-gray-500">{user?.email}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Full Name</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Palette className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Theme</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred theme</p>
              </div>
            </div>
            <ThemeToggle size="md" showLabel />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-error text-white rounded-lg hover:bg-error/90 transition-colors touch-manipulation text-base font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;