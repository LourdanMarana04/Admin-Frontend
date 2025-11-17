import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { appInsights } from './utils/appInsights.js';

// ✅ Optional: Import Flowbite JS (only if you're using Flowbite's interactive components like modals, dropdowns)
import 'flowbite';

// appInsights.track({ name: 'App Initialized' }); // ❗ UNCOMMENT THIS LINE after providing your connection string.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
