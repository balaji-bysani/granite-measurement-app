import React from 'react';
import { Alert, Container, Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: reportError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, showDetails = false } = this.props;
      
      // Custom fallback component
      if (Fallback) {
        return (
          <Fallback 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
          />
        );
      }

      // Default error UI
      return (
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Something went wrong
            </Alert.Heading>
            
            <p className="mb-3">
              We're sorry, but something unexpected happened. This error has been logged 
              and we'll look into it.
            </p>
            
            <div className="d-flex gap-2 mb-3">
              <Button variant="outline-danger" onClick={this.handleRetry}>
                <i className="bi bi-arrow-clockwise me-1"></i>
                Try Again
              </Button>
              <Button variant="danger" onClick={this.handleReload}>
                <i className="bi bi-arrow-repeat me-1"></i>
                Reload Page
              </Button>
            </div>

            {(showDetails || process.env.NODE_ENV === 'development') && (
              <details className="mt-3">
                <summary style={{ cursor: 'pointer' }}>
                  <strong>Error Details (ID: {this.state.errorId})</strong>
                </summary>
                <div className="mt-2">
                  <pre className="bg-light p-3 rounded small">
                    <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                    {'\n\n'}
                    <strong>Stack Trace:</strong>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;