
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TooltipProvider } from "@/components/ui/tooltip";
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </React.StrictMode>
);
