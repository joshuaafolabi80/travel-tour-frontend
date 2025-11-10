import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 🆕 ADDED: Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
          <div className="text-center">
            <div className="mb-4">
              <i className="fas fa-exclamation-triangle fa-3x text-warning"></i>
            </div>
            <h2 className="mb-3">Something went wrong</h2>
            <p className="text-muted mb-4">
              We're having trouble loading the application. Please try refreshing the page.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-redo me-2"></i>
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-start">
                <summary className="btn btn-sm btn-outline-secondary">Error Details</summary>
                <pre className="mt-2 p-3 bg-dark text-light rounded small">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 🆕 ADDED: Wait for Agora SDK to be available
const waitForAgora = () => {
  return new Promise((resolve) => {
    const checkAgora = () => {
      if (window.AgoraRTC) {
        console.log('✅ Agora RTC SDK is ready');
        resolve();
      } else {
        setTimeout(checkAgora, 100);
      }
    };
    checkAgora();
  });
};

// 🆕 ADDED: Initialize app with Agora check
const initializeApp = async () => {
  try {
    // Wait for Agora SDK (max 5 seconds)
    await Promise.race([
      waitForAgora(),
      new Promise(resolve => setTimeout(resolve, 5000))
    ]);
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    
    // Hide loading indicator
    const loadingEl = document.getElementById('agora-loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h3>Application Error</h3>
          <p>Please refresh the page to try again.</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
};

// Start the app
initializeApp();