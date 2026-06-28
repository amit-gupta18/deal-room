import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthGuard } from 'lemma-sdk/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lemmaClient } from './lemma-client'
import { Shell } from './Shell'
import { Pipeline } from './pages/Pipeline'
import { CreateDeal } from './pages/CreateDeal'
import { DealDetail } from './pages/DealDetail'
import { ReviewQueue } from './pages/ReviewQueue'
import './styles.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthGuard
        client={lemmaClient}
        loadingFallback={
          <main className="app-shell">
            <section className="panel">Checking access...</section>
          </main>
        }
      >
        <BrowserRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<Pipeline />} />
              <Route path="/create" element={<CreateDeal />} />
              <Route path="/deals/:dealId" element={<DealDetail />} />
              <Route path="/review" element={<ReviewQueue />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthGuard>
    </QueryClientProvider>
  </React.StrictMode>,
)
