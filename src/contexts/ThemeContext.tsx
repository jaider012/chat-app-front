import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>('light');

  // Get the storage key for the current user
  const getStorageKey = () => {
    return user ? `theme_${user.id}` : 'theme_default';
  };

  // Load theme preference on mount or user change
  useEffect(() => {
    const loadTheme = () => {
      try {
        const storageKey = getStorageKey();
        const savedTheme = localStorage.getItem(storageKey) as Theme;
        
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setThemeState(savedTheme);
        } else {
          // Default to system preference
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const defaultTheme = systemPrefersDark ? 'dark' : 'light';
          setThemeState(defaultTheme);
          localStorage.setItem(storageKey, defaultTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        setThemeState('light');
      }
    };

    loadTheme();
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Save theme preference
  const setTheme = (newTheme: Theme) => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};