import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } })
ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={qc}>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a2744', color: '#e2e8f5', border: '1px solid #2a3f6f' } }} />
    </BrowserRouter>
  </QueryClientProvider>
)
