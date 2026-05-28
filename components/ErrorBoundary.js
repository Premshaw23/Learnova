"use client";
import React from "react";
import { AlertOctagon, RefreshCw, ChevronDown, ChevronUp, Terminal } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      showDetails: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null, 
        showDetails: false 
      });
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      showDetails: false 
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;

      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-8 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-2">
                <AlertOctagon className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                Something went wrong
              </h2>
              <p className="text-gray-400">
                {this.props.errorMessage || "An unexpected error occurred while rendering this component. We've logged the issue and are looking into it."}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={this.handleRetry}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
                >
                  Reload Page
                </button>
              </div>
            </div>

            <div className="border-t border-gray-700 bg-gray-800/50">
              <button
                onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                className="w-full flex items-center justify-between p-4 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Terminal className="w-4 h-4" />
                  {this.state.showDetails ? "Hide Error Details" : "Show Error Details"}
                </span>
                {this.state.showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {this.state.showDetails && this.state.error && (
                <div className="p-4 pt-0">
                  <div className="bg-black/50 rounded-xl p-4 overflow-auto max-h-60 border border-gray-700/50">
                    <p className="text-red-400 font-mono text-sm font-bold mb-2">
                      {this.state.error.toString()}
                    </p>
                    <pre className="text-gray-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;