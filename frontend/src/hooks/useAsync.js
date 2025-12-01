import { useState, useCallback, useEffect } from 'react';

/**
 * useAsync Hook
 * Handle async operations with loading, error, and data states
 * 
 * Usage:
 * const { data, isLoading, error, execute } = useAsync(asyncFunction);
 * execute(args);
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await asyncFunction(...args);
        setData(response);
        return response;
      } catch (err) {
        setError(err.message || 'An error occurred');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, isLoading, error, execute };
};

export default useAsync;
