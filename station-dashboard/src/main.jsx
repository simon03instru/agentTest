/**
 * src/main.jsx  ← FILE EXISTING YANG DIMODIFIKASI
 *
 * Perubahan: tambahkan <AuthProvider> sebagai wrapper.
 * Semua yang lain tidak berubah.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { FetchingProvider } from '@/context/FetchingProvider'
import { AuthProvider } from '@/context/AuthContext'   // ← TAMBAHAN
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* AuthProvider harus di LUAR FetchingProvider agar auth tersedia di mana-mana */}
    <AuthProvider>                                       {/* ← TAMBAHAN */}
      <FetchingProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </FetchingProvider>
    </AuthProvider>                                      {/* ← TAMBAHAN */}
  </StrictMode>
)
