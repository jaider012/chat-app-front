import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UseLogoutProps {
  onLogout?: () => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}

/**
 * Custom hook for handling user logout
 */
export const useLogout = ({
  onLogout,
  onError,
  redirectTo = '/login'
}: UseLogoutProps = {}) => {
  const { logout: authLogout } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      // Call the auth context logout
      await authLogout();
      
      // Call additional logout handler if provided
      if (onLogout) {
        onLogout();
      }
      
      // Redirect if needed (though auth context usually handles this)
      if (redirectTo && typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
      
    } catch (error) {
      console.error('Error during logout:', error);
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  }, [authLogout, onLogout, onError, redirectTo]);

  const confirmLogout = useCallback(async (
    confirmMessage = 'Are you sure you want to log out?'
  ) => {
    if (window.confirm(confirmMessage)) {
      await handleLogout();
    }
  }, [handleLogout]);

  return {
    handleLogout,
    confirmLogout
  };
};