import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthState } from '../types';
import { apiService } from '../services/api';

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
      fetchUser(token);
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      console.log('Fetching user profile with token:', token);
      const response = await apiService.getProfile();
      console.log('Profile response:', response);
      
      if (response.success && response.data) {
        console.log('User authenticated successfully:', response.data);
        setAuthState({
          user: response.data,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      apiService.setToken(null);
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (token: string) => {
    console.log('Login called with token:', token);
    localStorage.setItem('token', token);
    apiService.setToken(token);
    await fetchUser(token);
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('token');
      apiService.setToken(null);
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};