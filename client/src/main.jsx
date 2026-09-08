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
            // Theme tokens from index.css — follows the light/dark shell.
            style: {
              background: 'rgb(var(--ink-800))',
              color: 'rgb(var(--slate-200))',
              border: '1px solid rgb(var(--line))',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: 'rgb(var(--ink-900))',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: 'rgb(var(--ink-900))',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
