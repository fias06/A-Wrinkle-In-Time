import React from 'react'
import ReactDOM from 'react-dom/client'
// Temporarily use test app to debug
// import App from '@/App.jsx'
import App from '@/App.jsx'
import '@/index.css'

// Add console logs to debug
console.log('🚀 main.jsx loaded');
console.log('React version:', React.version);

// Error Boundary for catching rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-white p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-slate-600 mb-4">{this.state.error?.message || 'Unknown error'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
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

// Check if root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found!</div>';
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to render app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1 style="color: red;">Failed to load app</h1>
        <p>Error: ${error.message}</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #f59e0b; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
}
