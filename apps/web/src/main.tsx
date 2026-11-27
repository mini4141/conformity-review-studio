import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { UiProvider } from '@crs/ui';
import './app.css';
import { DecisionPage } from './routes/DecisionPage';
import { MatrixPage } from './routes/MatrixPage';
import { QueuePage } from './routes/QueuePage';
import { Shell } from './routes/Shell';
import { WorkspacePage } from './routes/WorkspacePage';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } } });

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <QueuePage /> },
      { path: '/files/:id', element: <WorkspacePage /> },
      { path: '/files/:id/matrix', element: <MatrixPage /> },
      { path: '/files/:id/decision', element: <DecisionPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <UiProvider>
        <RouterProvider router={router} />
      </UiProvider>
    </QueryClientProvider>
  </StrictMode>,
);
