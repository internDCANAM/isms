/// <reference types="vite/client" />
import {lazy, StrictMode, Suspense, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {AssetInventoryPage} from './ui/pages/AssetInventory.js';
import {LoginPage} from './ui/pages/Login.js';
import {LoginPage as LoginV1Page} from './ui/pages/Login.v1.js';
import {MainPage} from './ui/pages/Main.js';
import {ControlsPage} from './ui/pages/Controls.js';
import {DashboardPage} from './ui/pages/Dashboard.js';
import {DocumentsPage} from './ui/pages/Documents.js';
import {NonconformityDetailPage} from './ui/pages/NonconformityDetail.js';
import {NonconformityListPage} from './ui/pages/NonconformityList.js';
import {RiskDetailPage} from './ui/pages/RiskDetail.js';
import {RiskRegisterPage} from './ui/pages/RiskRegister.js';
import {apiUrl} from './ui/links.js';
import type {ModInfo} from './api/mod.js';
import {AppLayout} from './ui/components/AppLayout.js';
import './ui/css/index.css';

const ModPanel = lazy(async() => {
  const mod = await import('./ui/components/ModPanel.js');
  return {default: mod.ModPanel};
});

function App() {
  const [modular, setModular] = useState(false);
  useEffect(() => {
    void fetch(apiUrl('/mod'))
      .then((res) => res.ok ? res.json() as Promise<ModInfo> : null)
      .then((body) => { setModular(body?.modular === true); })
      .catch(() => undefined);
  }, []);
  return (
    <>
      {/* <Header /> */}
      <div className="app__main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/v1" element={<LoginV1Page />} />

          <Route element={<AppLayout />}>
            <Route index element={<MainPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/risks" element={<RiskRegisterPage />} />
            <Route path="/risks/:id" element={<RiskDetailPage />} />
            <Route path="/nonconformities" element={<NonconformityListPage />} />
            <Route path="/nonconformities/:id" element={<NonconformityDetailPage />} />
            <Route path="/assets" element={<AssetInventoryPage />} />
            <Route path="/controls" element={<ControlsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {modular && (
        <Suspense fallback={null}>
          <ModPanel />
        </Suspense>
      )}
      {/* <Footer /> */}
    </>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {queries: {retry: 1, staleTime: 30_000, refetchOnWindowFocus: false}}
});

const root = document.getElementById('root');
if (!root) throw new Error('index.html is missing #root');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
