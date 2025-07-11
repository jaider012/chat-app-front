import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { sizeClasses, buttonSizeClasses, getSizeClass } from '../utils/styleHelpers';
import { getThemeToggleLabel, getThemeToggleTitle, getThemeToggleAriaLabel } from '../utils/themeHelpers';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'md', 
  showLabel = false,
  className = ''
}) => {
  const { theme, toggleTheme } = useTheme();

  const iconSize = getSizeClass(sizeClasses, size, 'w-5 h-5');
  const buttonSize = getSizeClass(buttonSizeClasses, size, 'p-2');

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${buttonSize} 
        hover:bg-gray-100 dark:hover:bg-gray-700 
        rounded-full transition-colors duration-200 
        flex items-center space-x-2
        ${className}
      `}
      title={getThemeToggleTitle(theme)}
      aria-label={getThemeToggleAriaLabel(theme)}
    >
      {theme === 'light' ? (
        <Moon className={`${iconSize} text-gray-600 dark:text-gray-300`} />
      ) : (
        <Sun className={`${iconSize} text-gray-600 dark:text-gray-300`} />
      )}
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getThemeToggleLabel(theme)}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;