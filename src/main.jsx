import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 🆕 ADD: Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
          <div className="text-center p-4">
            <div className="mb-4">
              <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
              <h2 className="mb-3">Application Error</h2>
            </div>
            <p className="text-muted mb-4">
              We're having trouble loading the application. This might be due to a temporary issue.
            </p>
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-redo me-2"></i>
              Refresh Page
            </button>
            <div className="mt-4">
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-start">
                <summary className="btn btn-sm btn-outline-danger">Development Error Details</summary>
                <div className="mt-2 p-3 bg-dark text-light rounded small">
                  <strong>Error:</strong> {this.state.error.toString()}
                  <br />
                  <strong>Component Stack:</strong>
                  <pre className="mt-2 mb-0">{this.state.errorInfo?.componentStack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 🆕 ADD: Simple app initialization without complex Agora checks
const initializeApp = () => {
  try {
    // Hide loading indicator
    const loadingEl = document.getElementById('agora-loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }

    // Add loaded class to body
    document.body.classList.add('app-loaded');

    const root = ReactDOM.createRoot(document.getElementById('root'));
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );

    console.log('✅ React app initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize React app:', error);
    
    // Show error message
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div class="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
          <div class="text-center">
            <h3 class="text-danger">Failed to Load Application</h3>
            <p class="text-muted">Please refresh the page or check your console for errors.</p>
            <button class="btn btn-primary" onclick="window.location.reload()">Refresh Page</button>
          </div>
        </div>
      `;
    }
  }
};

// 🆕 ADD: Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// 🆕 ADD: Fallback - ensure app loads even if there are minor errors
setTimeout(() => {
  const rootElement = document.getElementById('root');
  if (rootElement && !rootElement.hasChildNodes()) {
    console.log('🔄 Fallback: Initializing app after timeout');
    initializeApp();
  }
}, 1000);