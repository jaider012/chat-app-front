/**
 * Gets the label for theme toggle button
 */
export const getThemeToggleLabel = (currentTheme: 'light' | 'dark'): string => {
  return currentTheme === 'light' ? 'Dark' : 'Light';
};

/**
 * Gets the title for theme toggle button
 */
export const getThemeToggleTitle = (currentTheme: 'light' | 'dark'): string => {
  return `Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`;
};

/**
 * Gets the aria-label for theme toggle button
 */
export const getThemeToggleAriaLabel = (currentTheme: 'light' | 'dark'): string => {
  return `Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`;
};

/**
 * Detects system theme preference
 */
export const getSystemThemePreference = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Validates theme value
 */
export const isValidTheme = (theme: string): theme is 'light' | 'dark' => {
  return theme === 'light' || theme === 'dark';
};

/**
 * Gets storage key for user theme preference
 */
export const getThemeStorageKey = (userId?: string): string => {
  return userId ? `theme_${userId}` : 'theme_default';
};