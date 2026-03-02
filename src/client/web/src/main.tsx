import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from "react-router-dom";
import "./i18n.ts";
import { router } from './routes';
import './index.css'
import { handleMsalStartup } from '$/features/auth/providers/microsoftProvider';

if (!await handleMsalStartup()) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Suspense fallback={<div>Loading...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </StrictMode>,
  );
}
