import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

/**
 * Enhanced Error Boundary Component with better error reporting and recovery options
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to error reporting service if available
    if (window.Sentry) {
      window.Sentry.captureException(error, { 
        extra: errorInfo,
        tags: {
          component: 'ErrorBoundary',
          retryCount: this.state.retryCount
        }
      });
    }

    // Log to console with more details in development
    if (import.meta.env.DEV) {
      console.group('🔍 Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorType = (error) => {
    if (!error) return 'unknown';
    
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('ChunkLoadError') || errorMessage.includes('Loading chunk')) {
      return 'chunk-load';
    }
    if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
      return 'network';
    }
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return 'not-found';
    }
    if (errorMessage.includes('timeout')) {
      return 'timeout';
    }
    
    return 'generic';
  };

  getErrorMessage = (errorType, error) => {
    const messages = {
      'chunk-load': {
        title: 'Loading Error',
        description: 'There was a problem loading parts of the application. This usually happens after an update.',
        action: 'refresh'
      },
      'network': {
        title: 'Connection Error',
        description: 'Unable to connect to our servers. Please check your internet connection.',
        action: 'retry'
      },
      'not-found': {
        title: 'Page Not Found',
        description: 'The page you\'re looking for doesn\'t exist or has been moved.',
        action: 'home'
      },
      'timeout': {
        title: 'Request Timeout',
        description: 'The request took too long to complete. Please try again.',
        action: 'retry'
      },
      'generic': {
        title: 'Something went wrong',
        description: 'An unexpected error occurred. Our team has been notified.',
        action: 'retry'
      }
    };

    return messages[errorType] || messages.generic;
  };

  render() {
    if (this.state.hasError) {
      const errorType = this.getErrorType(this.state.error);
      const errorMessage = this.getErrorMessage(errorType, this.state.error);

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
          <div className="text-center max-w-2xl">
            {/* Error Icon */}
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {errorMessage.title}
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed max-w-lg mx-auto">
                {errorMessage.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              {errorMessage.action === 'refresh' && (
                <button
                  onClick={this.handleReload}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Refresh Page
                </button>
              )}
              
              {(errorMessage.action === 'retry' || errorMessage.action === 'refresh') && (
                <button
                  onClick={this.handleRetry}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Try Again
                </button>
              )}
              
              <button
                onClick={this.handleGoHome}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                <Home className="mr-2 h-5 w-5" />
                Go Home
              </button>
            </div>

            {/* Additional Info */}
            <div className="text-sm text-gray-500 mb-6">
              {this.state.retryCount > 0 && (
                <p className="mb-2">Retry attempts: {this.state.retryCount}</p>
              )}
              <p>
                If this problem persists, please contact support or try refreshing the page.
              </p>
            </div>

            {/* Error Details for Development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-gray-900/50 rounded-lg p-4 mt-8">
                <summary className="cursor-pointer text-yellow-400 font-medium flex items-center">
                  <Bug className="mr-2 h-4 w-4" />
                  Developer Details
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-red-400 font-semibold mb-2">Error:</h3>
                    <pre className="text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  
                  {this.state.error.stack && (
                    <div>
                      <h3 className="text-red-400 font-semibold mb-2">Stack Trace:</h3>
                      <pre className="text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-auto max-h-48">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {this.state.errorInfo && (
                    <div>
                      <h3 className="text-red-400 font-semibold mb-2">Component Stack:</h3>
                      <pre className="text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Error ID for support */}
            {!import.meta.env.DEV && (
              <div className="text-xs text-gray-600 mt-6">
                Error ID: {Date.now().toString(36).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;