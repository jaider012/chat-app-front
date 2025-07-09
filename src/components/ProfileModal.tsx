import React from 'react';
import { X, LogOut, User as UserIcon } from 'lucide-react';
import type { ProfileModalProps } from '../types';

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
}) => {
  const handleLogout = () => {
    onLogout();
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-header text-primary">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
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
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <UserIcon className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Full Name</p>
              <p className="text-sm text-gray-500">{user?.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
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