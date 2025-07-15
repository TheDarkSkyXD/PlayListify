import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './frontend/lib/router';
import './styles/globals.css';

export const App: React.FC = () => {
  return (
    <RouterProvider router={router} />
  );
};