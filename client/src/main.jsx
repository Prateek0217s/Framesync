import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#15151F',
              color: '#E2E8F0',
              border: '1px solid #2A2A3A',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#0B0B12' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#0B0B12' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
