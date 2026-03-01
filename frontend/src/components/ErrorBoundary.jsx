import React from 'react';
import { captureError } from '../utils/errorTracking';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Send to error tracking
    captureError(error, {
      componentStack: errorInfo.componentStack,
      boundary: this.props.name || 'ErrorBoundary'
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          retry: this.handleRetry
        });
      }

      // Default fallback UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-900 mb-2">
              Etwas ist schiefgelaufen
            </h2>
            <p className="text-gray-600 dark:text-zinc-500 mb-4">
              {this.props.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4 text-sm">
                <summary className="cursor-pointer text-red-600 dark:text-red-400 font-medium">
                  Fehlerdetails
                </summary>
                <pre className="mt-2 overflow-auto text-red-800 dark:text-red-300">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-purple-600 text-zinc-900 rounded-lg hover:bg-purple-700 transition"
              >
                Erneut versuchen
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-50 transition"
              >
                Seite neu laden
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = (Component, options = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
};

/**
 * Page-level error boundary with full-page fallback
 */
export const PageErrorBoundary = ({ children }) => (
  <ErrorBoundary
    name="PageErrorBoundary"
    fallback={({ error, retry }) => (
      <div className="min-h-screen bg-gray-100 dark:bg-white flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-50 rounded-2xl shadow-none p-8 max-w-lg w-full text-center">
          <div className="text-7xl mb-6">🔧</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-900 mb-3">
            Seite konnte nicht geladen werden
          </h1>
          <p className="text-gray-600 dark:text-zinc-500 mb-6">
            Wir arbeiten daran, das Problem zu beheben. Bitte versuche es erneut.
          </p>
          
          {import.meta.env.DEV && error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6 text-left text-sm">
              <p className="text-red-600 dark:text-red-400 font-mono">
                {error.toString()}
              </p>
            </div>
          )}
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={retry}
              className="px-6 py-3 bg-purple-600 text-zinc-900 rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Erneut versuchen
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-100 transition"
            >
              Zur Startseite
            </button>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;
