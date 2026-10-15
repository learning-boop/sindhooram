import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { CONFIG } from './config';

/* Each page is its own chunk (with its own CSS), so only the one in use is downloaded. */
const Page = CONFIG.mode === 'coming-soon'
  ? lazy(() => import('./ComingSoon.jsx'))
  : lazy(() => import('./store/Store.jsx'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  </StrictMode>,
);
