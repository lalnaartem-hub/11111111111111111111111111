import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { DEFAULT_SETTINGS } from './services/settings';
import { applyShellTheme } from './services/shellTheme';

applyShellTheme(DEFAULT_SETTINGS.theme, DEFAULT_SETTINGS.osMode);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
