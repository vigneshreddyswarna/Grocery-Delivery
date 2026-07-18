
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import AppErrorBoundary from './components/AppErrorBoundary.tsx'
import { Analytics } from '@vercel/analytics/react'

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
          <Analytics />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </AppErrorBoundary>,
)
