import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 🚨 CRITICAL: Simple error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2>Something went wrong</h2>
          <p style={{ margin: '15px 0' }}>Please refresh the page to continue</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 🚨 CRITICAL: Simple app initialization
console.log('🚀 Starting React app...');

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );

  // Hide loading screen
  setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }, 1000);

  console.log('✅ React app started successfully');

} catch (error) {
  console.error('❌ Failed to start React app:', error);
  
  // Show error message
  const loading = document.getElementById('loading');
  if (loading) {
    loading.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <h3 style="color: #dc3545; margin-bottom: 15px;">Failed to Load</h3>
        <p style="margin-bottom: 20px;">Please check your console and refresh</p>
        <button onclick="window.location.reload()" class="btn btn-danger">Refresh</button>
      </div>
    `;
  }
}