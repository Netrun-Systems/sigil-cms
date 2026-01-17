import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@netrun-cms/theme';
import { netrunDarkPreset } from '@netrun-cms/theme';
import App from './App';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(ThemeProvider, { initialTheme: {
                mode: 'dark',
                darkTokens: netrunDarkPreset.darkTokens,
                lightTokens: netrunDarkPreset.lightTokens,
            }, children: _jsx(App, {}) }) }) }));
//# sourceMappingURL=main.js.map