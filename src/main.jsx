import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './dark-palette.css';
import './fonts.css';
import './dashboard-refresh.css';
import './bank-theme.css';
import './scrollbars.css';
import './sidebar-fit.css';
import './request-form-compact.css';
import './preview-theme.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
