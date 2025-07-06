import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-space-black text-foreground p-4">
          <div className="max-w-md w-full bg-card p-6 rounded-md border border-electric-blue shadow-lg">
            <h2 className="text-2xl font-orbitron text-electric-blue mb-4">Application Error</h2>
            <p className="mb-4">
              Something went wrong while loading the application. Please try refreshing the page.
            </p>
            
            <div className="mt-6 border-t border-muted pt-4">
              <h3 className="text-lg text-acid-green mb-2">Technical Details</h3>
              <div className="bg-muted p-3 rounded overflow-auto max-h-[150px] text-sm font-mono">
                {this.state.error?.message || "Unknown error"}
              </div>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-electric-blue hover:bg-bright-cyan text-black font-bold rounded cybr-btn transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary;