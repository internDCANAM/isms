/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {AssetInventoryPage} from './ui/pages/AssetInventory.js';
import {LoginPage} from './ui/pages/Login.js';
import {MainPage} from './ui/pages/Main.js';
import {ControlsPage} from './ui/pages/Controls.js';
import {DocumentsPage} from './ui/pages/Documents.js';
import {NonconformityDetailPage} from './ui/pages/NonconformityDetail.js';
import {NonconformityListPage} from './ui/pages/NonconformityList.js';
import {RiskDetailPage} from './ui/pages/RiskDetail.js';
import {RiskRegisterPage} from './ui/pages/RiskRegister.js';
import {AppLayout} from './ui/components/AppLayout.js';
import './ui/css/index.css';


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route index element={<MainPage />} />
        <Route path="/risks" element={<RiskRegisterPage />} />
        <Route path="/risks/:id" element={<RiskDetailPage />} />
        <Route path="/nonconformities" element={<NonconformityListPage />} />
        <Route
          path="/nonconformities/:id"
          element={<NonconformityDetailPage />}
        />
        <Route path="/assets" element={<AssetInventoryPage />} />
        <Route path="/controls" element={<ControlsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
