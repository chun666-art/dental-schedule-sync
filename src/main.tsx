
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Find the root element
const rootElement = document.getElementById("root");

// Check if root element exists
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

// Create root and render app
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
