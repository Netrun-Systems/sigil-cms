import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@netrun-cms/theme';
import { netrunDarkPreset } from '@netrun-cms/theme';
import { AuthProvider } from './lib/auth';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider
        initialTheme={{
          mode: 'dark',
          darkTokens: netrunDarkPreset.darkTokens,
          lightTokens: netrunDarkPreset.lightTokens,
        }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
