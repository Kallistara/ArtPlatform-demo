import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './app/providers/AuthProvider';
import './shared/styles/global.css';
import {ToastProvider} from './shared/ui/Notifications/ToastProvider'
import {ScrollToTop} from './app/router/ScrollTop';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);