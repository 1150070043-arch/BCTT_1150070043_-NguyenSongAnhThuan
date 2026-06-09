import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/landing.css';
import './styles/3d-enhancements.css';
import './styles/ice-theme-3d.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

