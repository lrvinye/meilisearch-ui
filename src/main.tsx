import React from 'react';
import ReactDOM from 'react-dom/client';
import 'virtual:uno.css';
import './style/global.css';
import '@arco-themes/react-meilisearch/css/arco.css';
import './utils/i18n';
import { AppProvider } from '@/providers';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import the generated route tree
import { routeTree } from './routeTree.gen';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NotFound } from './components/404';
import { Loader } from './components/loader';
import { Logo } from './components/Logo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: true,
      refetchIntervalInBackground: false,
      refetchOnReconnect: 'always',
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
      refetchInterval: 30000,
    },
  },
});

// Create a new router instance
const router = createRouter({
  routeTree,
  // why not use import.meta.env.BASE_PATH? ref: https://cn.vite.dev/guide/env-and-mode.html#env-variables
  basepath: import.meta.env.BASE_URL || '/',
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  defaultPendingComponent: () => (
    <div className="h-dvh flex justify-center items-center">
      <div className="flex gap-6 items-center">
        <Logo className="shrink" />
        <div className="my-2 min-h-10 w-0.5 bg-neutral-300"></div>
        <Loader />
      </div>
    </div>
  ),
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  defaultNotFoundComponent: NotFound,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </React.StrictMode>
  );
}
