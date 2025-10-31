import { useState, useCallback } from 'react';

/**
 * Custom hook for centralized error handling
 * Provides consistent error state management and user-friendly error messages
 */
const useErrorHandler = (initialError = null) => {
  const [error, setError] = useState(initialError);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Set an error with optional transformation
   */
  const setErrorState = useCallback((error) => {
    console.error('Error occurred:', error);
    setError(error);
  }, []);

  /**
   * Execute an async operation with error handling
   */
  const executeWithErrorHandling = useCallback(async (asyncOperation, options = {}) => {
    const { 
      loadingState = true, 
      clearPreviousError = true,
      onSuccess = null,
      onError = null,
      transformError = null
    } = options;

    if (clearPreviousError) {
      clearError();
    }

    if (loadingState) {
      setIsLoading(true);
    }

    try {
      const result = await asyncOperation();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      let processedError = err;
      
      // Transform error if transformer provided
      if (transformError) {
        processedError = transformError(err);
      } else {
        // Default error transformation
        processedError = transformDefaultError(err);
      }
      
      setError(processedError);
      
      if (onError) {
        onError(processedError);
      }
      
      throw processedError;
    } finally {
      if (loadingState) {
        setIsLoading(false);
      }
    }
  }, [clearError]);

  /**
   * Transform common API errors into user-friendly messages
   */
  const transformDefaultError = (error) => {
    if (typeof error === 'string') {
      return error;
    }

    // Network errors
    if (!error.response) {
      return {
        message: 'Network error. Please check your connection and try again.',
        type: 'network',
        originalError: error
      };
    }

    const { status, data } = error.response;

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return {
          message: data?.message || 'Invalid request. Please check your input.',
          type: 'validation',
          details: data?.details || null,
          originalError: error
        };
      
      case 401:
        return {
          message: 'You are not authorized to perform this action.',
          type: 'authorization',
          originalError: error
        };
      
      case 403:
        return {
          message: 'Access denied. You do not have permission for this action.',
          type: 'permission',
          originalError: error
        };
      
      case 404:
        return {
          message: 'The requested resource was not found.',
          type: 'notFound',
          originalError: error
        };
      
      case 409:
        return {
          message: data?.message || 'A conflict occurred. The resource may already exist.',
          type: 'conflict',
          originalError: error
        };
      
      case 422:
        return {
          message: data?.message || 'Validation failed. Please check your input.',
          type: 'validation',
          details: data?.details || null,
          originalError: error
        };
      
      case 429:
        return {
          message: 'Too many requests. Please wait a moment and try again.',
          type: 'rateLimit',
          originalError: error
        };
      
      case 500:
        return {
          message: 'Server error. Please try again later.',
          type: 'server',
          originalError: error
        };
      
      case 503:
        return {
          message: 'Service temporarily unavailable. Please try again later.',
          type: 'service',
          originalError: error
        };
      
      default:
        return {
          message: data?.message || `An error occurred (${status}). Please try again.`,
          type: 'unknown',
          originalError: error
        };
    }
  };

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = useCallback(() => {
    if (!error) return null;
    
    if (typeof error === 'string') {
      return error;
    }
    
    return error.message || 'An unexpected error occurred';
  }, [error]);

  /**
   * Check if error is of specific type
   */
  const isErrorType = useCallback((type) => {
    return error && typeof error === 'object' && error.type === type;
  }, [error]);

  /**
   * Retry wrapper for failed operations
   */
  const retry = useCallback(async (operation, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await executeWithErrorHandling(operation, {
          clearPreviousError: attempt === 1
        });
      } catch (err) {
        lastError = err;
        
        // Don't retry on client errors (4xx)
        if (err.originalError?.response?.status >= 400 && err.originalError?.response?.status < 500) {
          throw err;
        }
        
        // Wait before retrying (except on last attempt)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError;
  }, [executeWithErrorHandling]);

  return {
    error,
    isLoading,
    clearError,
    setError: setErrorState,
    executeWithErrorHandling,
    getErrorMessage,
    isErrorType,
    retry,
    hasError: !!error
  };
};

export default useErrorHandler;