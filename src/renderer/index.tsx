import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import './styles/globals.css';

// Initialize the root for React 18+
const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
); 