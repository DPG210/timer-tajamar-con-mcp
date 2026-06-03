/**
 * Entry point.
 * Mounts:
 *   - QueryClientProvider (TanStack Query)
 *   - App (router + all routes)
 *
 * QueryClient is a singleton — defined here, not in App, so it survives
 * any future HMR refresh during development.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import { initTheme } from './stores/themeStore';
import { ErrorBoundary } from './components/ErrorBoundary';

initTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
