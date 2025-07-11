/**
 * Derives error state for React error boundaries
 */
export const deriveErrorState = (error: Error) => {
  return { 
    hasError: true, 
    error,
    errorInfo: {
      componentStack: '',
      errorBoundary: true
    }
  };
};

/**
 * Logs error information to console and external services
 */
export const logError = (error: Error, errorInfo?: any) => {
  console.error('Error caught by error boundary:', error);
  
  if (errorInfo) {
    console.error('Error info:', errorInfo);
  }

  // Here you could send error to external logging service
  // Example: Sentry, LogRocket, etc.
  if (import.meta.env.PROD) {
    // logToExternalService(error, errorInfo);
  }
};

/**
 * Reloads the current page
 */
export const reloadPage = () => {
  window.location.reload();
};

/**
 * Formats error message for display
 */
export const formatErrorMessage = (error: Error): string => {
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Checks if error is a network error
 */
export const isNetworkError = (error: Error): boolean => {
  return error.message.toLowerCase().includes('network') ||
         error.message.toLowerCase().includes('fetch') ||
         error.message.toLowerCase().includes('connection');
};

/**
 * Gets user-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: Error): string => {
  if (isNetworkError(error)) {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  
  return 'Something went wrong. Please try refreshing the page.';
};