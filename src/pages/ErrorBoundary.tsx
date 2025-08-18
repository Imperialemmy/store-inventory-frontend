import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state to render fallback UI
    console.log(_)
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log the error to an error reporting service here
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>Please try refreshing the page or contact support.</p>
        </div>
      );
    }

    // Render children normally if no error
    return this.props.children;
  }
}

export default ErrorBoundary;
